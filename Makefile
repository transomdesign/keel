# 🎯 Project Automation
# Import .env variables for use here
ifneq (,$(wildcard ./.env))
	include .env
	export
endif

.PHONY: build dev clean clear-caches db-pull db-import db-ingest db-push-staging update update-clean up down status fmt help
.DEFAULT_GOAL := help

## 🏗️  build: Creates a production build and clears caches
build: up
	@echo "🔨 Creating production build..."
	@ddev exec bun run build
	@$(MAKE) clear-caches

## 🖥️  dev: Starts the local development server with hot reloading
dev: up
	@echo "🚀 Starting development server..."
	-@ddev exec pkill -f bun 2>/dev/null || true
	@ddev bun run dev

## 🧹 clean: Clears Vite build cache and manifest
clean:
	@echo "🧹 Cleaning Vite cache and build artifacts..."
	@rm -rf web/dist/.vite web/dist/assets node_modules/.vite
	@echo "✅ Cache cleared"

## 🗑️  clear-caches: Clears all Craft CMS caches (Blitz, data, Vite)
clear-caches: up
	@echo "🗑️ Clearing Craft CMS caches..."
	@ddev craft blitz/cache/clear
	@ddev craft clear-caches/data
	@ddev craft clear-caches/vite-file-cache
	@ddev craft cache/flush-all
	@echo "✅ All caches cleared"

## ✨ fmt: Format code with Prettier (fallback when language server fails)
fmt: up
	@echo "✨ Formatting code with Prettier..."
	@ddev exec bunx prettier --write "**/*.{js,ts,css,twig,php}"

## ⬇️  db-pull: Downloads database from production server
db-pull:
	@if [ -z "$(DEPLOY_PROD_USER)" ] || [ -z "$(DEPLOY_PROD_HOST)" ] || [ -z "$(DEPLOY_PROD_PATH)" ]; then \
		echo "❌ Missing required .env variables for db-pull:"; \
		[ -z "$(DEPLOY_PROD_USER)" ] && echo "   • DEPLOY_PROD_USER"; \
		[ -z "$(DEPLOY_PROD_HOST)" ] && echo "   • DEPLOY_PROD_HOST"; \
		[ -z "$(DEPLOY_PROD_PATH)" ] && echo "   • DEPLOY_PROD_PATH"; \
		echo "💡 Add these to your .env file (see .env.example)"; \
		exit 1; \
	fi
	@echo "📥 Pulling database from production..."
	@echo "🔄 Creating backup on remote server..."; \
	mkdir -p storage/backups; \
	ssh $(DEPLOY_PROD_USER)@$(DEPLOY_PROD_HOST) "cd $(DEPLOY_PROD_PATH) && php craft db/backup" && \
	echo "📥 Downloading most recent backup..."; \
	LATEST_REMOTE=$$(ssh $(DEPLOY_PROD_USER)@$(DEPLOY_PROD_HOST) "ls -t $(DEPLOY_PROD_PATH)/storage/backups/*.{sql,zip} 2>/dev/null | head -1"); \
	scp $(DEPLOY_PROD_USER)@$(DEPLOY_PROD_HOST):$$LATEST_REMOTE ./storage/backups/ && \
	echo "✅ Database backup downloaded: $$(basename $$LATEST_REMOTE)"

## 📊 db-import: Imports the most recent database backup into Craft
db-import: up
	@LATEST_DB=$$(ls -t ./storage/backups 2>/dev/null | head -1); \
	if [ -z "$$LATEST_DB" ]; then \
		echo "❌ No database backups found in ./storage/backups/"; \
		exit 1; \
	else \
		echo "📊 Importing database: $$LATEST_DB"; \
		ddev import-db --file="./storage/backups/$$LATEST_DB"; \
		echo "⚙️  Rebuilding Craft project config from imported database..."; \
		ddev craft project-config/rebuild --interactive=0; \
	fi

## 🔄 db-ingest: Pulls database from production and imports it locally
db-ingest: db-pull db-import

## ⬆️  db-push-staging: Backup local DB and upload/import to STAGING server
db-push-staging: up
	@if [ -z "$(DEPLOY_STAGING_USER)" ] || [ -z "$(DEPLOY_STAGING_HOST)" ] || [ -z "$(DEPLOY_STAGING_DB_NAME)" ] || [ -z "$(DEPLOY_STAGING_DB_USER)" ] || [ -z "$(DEPLOY_STAGING_DB_PASSWORD)" ]; then \
		echo "❌ Missing required .env variables for db-push-staging:"; \
		[ -z "$(DEPLOY_STAGING_USER)" ] && echo "   • DEPLOY_STAGING_USER"; \
		[ -z "$(DEPLOY_STAGING_HOST)" ] && echo "   • DEPLOY_STAGING_HOST"; \
		[ -z "$(DEPLOY_STAGING_DB_NAME)" ] && echo "   • DEPLOY_STAGING_DB_NAME"; \
		[ -z "$(DEPLOY_STAGING_DB_USER)" ] && echo "   • DEPLOY_STAGING_DB_USER"; \
		[ -z "$(DEPLOY_STAGING_DB_PASSWORD)" ] && echo "   • DEPLOY_STAGING_DB_PASSWORD"; \
		echo "💡 Add these to your .env file (see .env.example)"; \
		exit 1; \
	fi
	@echo "⚠️  WARNING: This will OVERWRITE the database on STAGING server"; \
	echo "📍 Target: $(DEPLOY_STAGING_USER)@$(DEPLOY_STAGING_HOST) -> $(DEPLOY_STAGING_DB_NAME)"; \
	read -p "Continue? [y/N] " -n 1 -r; \
	echo; \
	if [[ ! $$REPLY =~ ^[Yy]$$ ]]; then \
		echo "❌ Aborted"; \
		exit 1; \
	fi; \
	echo "💾 Creating local database backup..."; \
	mkdir -p storage/backups; \
	ddev craft db/backup && \
	LATEST_LOCAL=$$(ls -t ./storage/backups/*.sql 2>/dev/null | head -1); \
	if [ -z "$$LATEST_LOCAL" ]; then \
		echo "❌ Backup failed - no backup file created"; \
		exit 1; \
	fi; \
	BACKUP_FILE=$$(basename $$LATEST_LOCAL); \
	echo "📤 Uploading $$BACKUP_FILE to staging server..."; \
	scp $$LATEST_LOCAL $(DEPLOY_STAGING_USER)@$(DEPLOY_STAGING_HOST):/tmp/$$BACKUP_FILE && \
	echo "📊 Importing database on staging server..."; \
	ssh $(DEPLOY_STAGING_USER)@$(DEPLOY_STAGING_HOST) "mysql -u$(DEPLOY_STAGING_DB_USER) -p$(DEPLOY_STAGING_DB_PASSWORD) $(DEPLOY_STAGING_DB_NAME) < /tmp/$$BACKUP_FILE && rm /tmp/$$BACKUP_FILE" && \
	echo "✅ Database successfully pushed to STAGING server"

## 📦 update: Updates both bun and composer dependencies
update: up
	@echo "📦 Updating dependencies..."
	@ddev bun update -i
	@ddev composer update

## 🧹 update-clean: Clean reinstall of all dependencies (destructive!)
update-clean: down
	@echo "🧹 Performing clean dependency reinstall..."
	@echo "⚠️  Removing lock files and vendor directories..."
	@rm -f composer.lock bun.lock
	@rm -rf vendor/ node_modules/
	@$(MAKE) up
	@echo "📦 Reinstalling dependencies..."
	@ddev composer install
	@ddev bun install

## 🟢 up: Starts DDEV project if not already running
up:
	@if ddev describe --json-output 2>/dev/null | grep -q '"status":"running"'; then \
		echo "✅ DDEV is already running"; \
	else \
		echo "🚀 Starting DDEV..."; \
		ddev start -y; \
	fi

## 🔴 down: Stops DDEV project
down:
	@echo "🛑 Stopping DDEV project..."
	@ddev stop

## 📋 status: Shows current DDEV project status
status:
	@echo "📊 DDEV Project Status:"
	@ddev describe 2>/dev/null || echo "❌ DDEV project not found or stopped"
	@echo ""
	@LATEST_DB=$$(ls -t ./storage/backups 2>/dev/null | head -1); \
	if [ -n "$$LATEST_DB" ]; then \
		echo "📂 Latest DB backup: $$LATEST_DB"; \
	else \
		echo "📂 No database backups found"; \
	fi

## 🆘 help: Show this help message
help: Makefile
	@echo "🎯 Available commands:"
	@echo ""
	@sed -n 's/^## //p' $<
	@echo ""
	@echo "💡 Pro tips:"
	@echo "   • Use 'ddev bun <command>' or 'ddev composer <command>' directly"
	@echo "   • Run 'make status' to check project health"
	@echo "   • Database backups should be in ./storage/backups/"

# Catch-all rule for unknown targets
%:
	@echo "❓ Unknown target: $@"
	@echo "Use 'make help' to see available commands"
	@exit 1
