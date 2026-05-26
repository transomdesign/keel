/**
 * Custom Vite plugin to copy static files during development with file watching
 *
 * This plugin bridges the gap between development and production builds by:
 * - Watching for file changes and copying them automatically during dev
 * - Triggering browser reloads when static files change
 *
 * Why this is needed:
 * - Vite's built-in static serving doesn't watch for file changes
 * - DDEV/Docker environments require polling-based file watching
 */
import path from 'path'
import chokidar from 'chokidar'
import fs from 'fs-extra'
import { type ViteDevServer } from 'vite'

type Config = {
	src: string
	dest: string
	name: string
	emoji: string
	maintainStructure: boolean
	usePolling: boolean
	interval: number
}

/**
 * Default copy configurations
 */
const DEFAULT_COPY_CONFIGS: Config[] = [
	{
		src: 'src/static',
		dest: 'web/dist',
		name: 'Static files',
		emoji: '📁',
		maintainStructure: true,
		usePolling: true,
		interval: 1000,
	},
	{
		src: 'src/favicons',
		dest: 'web',
		name: 'Favicons',
		emoji: '🔖',
		maintainStructure: false, // Favicons go directly to web root
		usePolling: true,
		interval: 1000,
	},
	{
		src: 'src/icon-picker',
		dest: 'web/dist/icons',
		name: 'Icon Picker files',
		emoji: '🎨',
		maintainStructure: true,
		usePolling: true,
		interval: 1000,
	},
]

/**
 * Creates the vite-plugin-static-sync plugin
 * @param [copyConfigs=DEFAULT_COPY_CONFIGS] - Array of copy configurations
 * @returns Vite plugin configuration
 */
function staticSync(copyConfigs: Config[] = DEFAULT_COPY_CONFIGS) {
	return {
		name: 'vite-plugin-static-sync',

		/**
		 * Configures the development server with file watchers
		 * @param server - Vite development server instance
		 */
		configureServer(server: ViteDevServer) {
			// Initial file copy when server starts
			copyConfigs.forEach((config) => {
				copyFiles(config)
			})

			// Set up file watchers for each configuration
			const watchers = copyConfigs
				.map((config) => {
					const srcPath = path.resolve(config.src)

					if (!fs.existsSync(srcPath)) {
						return null // Skip if source doesn't exist
					}

					const watcher = chokidar.watch(srcPath, {
						ignored: /node_modules/,
						persistent: true,
						ignoreInitial: true,
						usePolling: config.usePolling ?? true,
						interval: config.interval ?? 1000,
						awaitWriteFinish: {
							stabilityThreshold: 100,
							pollInterval: 100,
						},
					})

					// Handle file events
					watcher.on('add', (filePath) => {
						copyFile(filePath, config)
						server.ws.send({ type: 'full-reload' })
					})

					watcher.on('change', (filePath) => {
						copyFile(filePath, config)
						server.ws.send({ type: 'full-reload' })
					})

					watcher.on('unlink', (filePath) => {
						removeFile(filePath, config)
						server.ws.send({ type: 'full-reload' })
					})

					watcher.on('error', (error) => {
						console.error(`❌ ${config.name} watcher error:`, error)
					})

					return watcher
				})
				.filter(Boolean) // Remove null watchers

			// Cleanup all watchers when server closes
			server.httpServer?.on('close', () => {
				watchers.forEach((watcher) => watcher?.close())
			})
		},
	}
}

/**
 * Copies all files from source to destination during initial server startup
 * @param config - Copy configuration object
 */
function copyFiles(config: Config) {
	if (!fs.existsSync(config.src)) {
		return
	}

	if (config.maintainStructure) {
		// Copy entire directory structure
		fs.ensureDirSync(config.dest)
		fs.copySync(config.src, config.dest, { overwrite: true })
	} else {
		// Copy files directly to destination (like favicons)
		const files = fs.readdirSync(config.src)

		files.forEach((file) => {
			const srcPath = path.join(config.src, file)
			const destPath = path.join(config.dest, file)

			if (fs.statSync(srcPath).isFile()) {
				fs.copySync(srcPath, destPath, { overwrite: true })
			}
		})
	}

	console.log(`${config.emoji} ${config.name} ready`)
}

/**
 * Copies a single file based on configuration
 * @param filePath - Absolute path to the source file
 * @param config - Copy configuration object
 */
function copyFile(filePath: string, config: Config) {
	if (config.maintainStructure) {
		// Maintain directory structure
		const relativePath = path.relative(config.src, filePath)
		const destPath = path.join(config.dest, relativePath)

		fs.ensureDirSync(path.dirname(destPath))
		fs.copySync(filePath, destPath)

		console.log(
			`${config.emoji} ${path.basename(filePath)} → ${path.basename(config.dest)}/`,
		)
	} else {
		// Copy directly to destination root
		const fileName = path.basename(filePath)
		const destPath = path.join(config.dest, fileName)

		fs.copySync(filePath, destPath)
		console.log(`${config.emoji} ${fileName} → ${path.basename(config.dest)}/`)
	}
}

/**
 * Removes a file from the destination directory
 * @param filePath - Absolute path to the source file (now deleted)
 * @param config - Copy configuration object
 */
function removeFile(filePath: string, config: Config) {
	if (config.maintainStructure) {
		// Remove file maintaining directory structure
		const relativePath = path.relative(config.src, filePath)
		const destPath = path.join(config.dest, relativePath)

		if (fs.existsSync(destPath)) {
			fs.removeSync(destPath)
			console.log(`🗑️  Removed ${path.basename(destPath)}`)
		}
	} else {
		// Remove file from destination root
		const fileName = path.basename(filePath)
		const destPath = path.join(config.dest, fileName)

		if (fs.existsSync(destPath)) {
			fs.removeSync(destPath)
			console.log(`🗑️  Removed ${fileName}`)
		}
	}
}

export { type Config, staticSync as default, staticSync }
