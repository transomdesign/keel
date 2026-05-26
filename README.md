# Keel — Craft CMS Starter

A Transom Craft CMS 5 starter with DDEV, Vite, Tailwind 4, TypeScript, and a curated plugin set. Multi-site capable out of the box.

## Bootstrap a new project

**One-liner (clones + renames in one go):**

```bash
curl -fsSL https://raw.githubusercontent.com/transomdesign/keel/main/bin/bootstrap.sh | bash
```

**Manual clone:**

```bash
git clone https://github.com/transomdesign/keel.git my-project
cd my-project
bash bin/init.sh
```

`bin/init.sh` prompts for a project slug, display name, and production hostname, then find-replaces all placeholder tokens and optionally re-inits git history.

## After init

```bash
ddev start
ddev composer install
ddev craft install
ddev launch
```

Visit the Craft admin at `https://<your-slug>.ddev.site/admin` and follow the install wizard.

## Development

```bash
make dev       # Start DDEV + Vite dev server (hot reload)
make build     # Production asset build
make status    # Project health check
make           # Show all commands
```

## Database

```bash
make db-ingest  # Pull from production and import
make db-import  # Import latest local backup
```

## Stack

| Layer | Technology |
|---|---|
| CMS | Craft CMS 5.x |
| Frontend | Vite 8, TypeScript, Tailwind CSS 4.x |
| Dev environment | DDEV (Docker) |
| Server | PHP 8.4, MariaDB 11.4 |
| Package manager | Bun |

## Multi-site

The starter ships with four sites: a primary (`default`) and three brand sites (`primary`, `secondary`, `tertiary`). Out of the box they use the placeholder domains:

```
URL_PRIMARY=https://keel.ddev.site
URL_SECONDARY=https://keel-secondary.ddev.site
URL_TERTIARY=https://keel-tertiary.ddev.site
URL_FOURTH=https://keel-fourth.ddev.site
```

After running `bin/init.sh`, the `keel` prefix becomes your project slug. Rename or remove the extra sites in the Craft control panel and update `.env` accordingly. The `src/scripts/main.ts` hostname switch and `vite.config.ts` build inputs are already updated by `init.sh` — adjust them to match your final site handles.

## Placeholder tokens

`bin/init.sh` replaces these tokens across the repo:

| Token | Replaced with |
|---|---|
| `keel` | your project slug |
| `Keel` | your display name |
| `keel.transom.dev` | your production hostname |
| `keel-secondary` / `keel-tertiary` / `keel-fourth` | slug-prefixed equivalents |

## Customising sites

Each brand site has a CSS file in `src/styles/sites/` (`primary.css`, `secondary.css`, `tertiary.css`) that overrides colour, font, and button tokens from `src/styles/theme/`. Rename and adjust these per project.

## Plugins

Core: `craftcms/cms`, `craftcms/ckeditor`, `craftcms/postmark`

nystudio107: code-editor, code-field, imageoptimize, minify, retour, seomatic, vite

putyourlightson: blitz, sprig

verbb: formie, hyper, icon-picker, navigation

vaersaagod: dospaces

Transom: craft-behold, craft-site-tint, matrix-defaults, site-asset-router

Other: craft-llm-ready, craft-mcp

## Tearing down a test project

```bash
(cd <project-slug> ; ddev delete --omit-snapshot) && rm -rf <project-slug>
```

`--omit-snapshot` skips the automatic DB backup — fine for throwaway test projects. Leave it off if you want to keep the database.

Verify nothing is left:

```bash
ddev list   # should not show the project
```

## Resources

- [Craft CMS docs](https://craftcms.com/docs/5.x/)
- [DDEV docs](https://ddev.readthedocs.io/)
- [Vite docs](https://vitejs.dev/)
- [Tailwind CSS docs](https://tailwindcss.com/docs)
