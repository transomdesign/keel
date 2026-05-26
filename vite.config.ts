import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { brotliCompressSync } from 'node:zlib'
import tailwindcss from '@tailwindcss/vite'
import gzipPlugin from 'rollup-plugin-gzip'
import { defineConfig, loadEnv, type UserConfig } from 'vite'
import liveReload from 'vite-plugin-live-reload'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { devUrlsPlugin } from 'vite-plugin-dev-urls'
import staticSync from './vite-plugin-static-sync.js'

/**
 * Vite configuration for Craft CMS project with DDEV
 *
 * Features:
 * - Hot Module Replacement (HMR) for development
 * - Tailwind CSS 4.x integration
 * - Live reload for Twig templates
 * - Asset compression (gzip & brotli)
 * - TypeScript support
 * - DDEV-specific configuration
 * - Multi-site CSS support for Craft CMS
 */
export default defineConfig(({ command, mode }): UserConfig => {
	// Load environment variables for use in config
	const env = loadEnv(mode, process.cwd(), '')

	// Resolve __dirname for ES modules
	const __dirname = fileURLToPath(new URL('.', import.meta.url))

	// Primary site URL from environment
	const siteUrl = new URL(env.URL_PRIMARY || 'http://localhost:1234')

	// Build list of all site URLs for multi-domain setup from URL_* env vars
	const devUrls = Object.entries(env)
		.filter(([key]) => key.startsWith('URL_'))
		.map(([key, value]) => (key === 'URL_PRIMARY' ? `${value}/admin` : value))

	// Determine if we're in development mode
	const isDev = command === 'serve'

	return {
		// Source directory configuration
		root: 'src',

		// Base URL for assets: dev = '' (served from Vite), prod = '/dist/' (served from disk)
		base: isDev ? '' : '/dist/',

		publicDir: false, // Disable Vite's built-in static serving - we handle it with our custom plugin

		// Path aliases
		resolve: {
			alias: {
				'#src': join(__dirname, 'src'),
			},
		},

		// Development server configuration
		server: {
			cors: true,
			host: '0.0.0.0', // Allow external connections (required for DDEV)
			port: 1234,
			strictPort: true, // Fail if port is already in use

			// Hot Module Replacement configuration
			hmr: {
				host: siteUrl.hostname,
				port: 1234,
				protocol: siteUrl.protocol === 'https:' ? 'wss' : 'ws',
				overlay: true, // Show errors as overlay in browser
			},

			// File watching configuration (optimized for Docker/DDEV)
			watch: {
				usePolling: true, // Required for file watching in Docker containers
				ignored: ['!**/node_modules/**'], // Watch node_modules for dependency changes
			},

			// Allow serving files from parent directory
			fs: {
				allow: ['..'],
			},
		},

		// CSS configuration
		css: {
			devSourcemap: true, // Generate inline sourcemaps for CSS in dev
		},

		// Production build configuration
		build: {
			manifest: true, // Generate manifest for Craft CMS asset loading
			outDir: join(__dirname, 'web/dist'),
			emptyOutDir: true,
			sourcemap: isDev, // Generate sourcemaps in development

			// Rollup-specific options
			rollupOptions: {
				// Multiple entry points: main JS/CSS + site-specific CSS
				input: {
					main: join(__dirname, 'src/scripts/main.ts'),
					secondary: join(__dirname, 'src/styles/sites/secondary.css'),
					primary: join(__dirname, 'src/styles/sites/primary.css'),
					tertiary: join(__dirname, 'src/styles/sites/tertiary.css'),
				},
				output: {
					// Split vendor dependencies into separate chunk
					manualChunks: (id: string) => {
						if (id.includes('node_modules')) {
							return 'vendor'
						}
						return undefined
					},
				},
			},
		},

		// Plugin configuration
		plugins: [
			// Display all development URLs for multi-site setup
			devUrlsPlugin({
				urls: devUrls,
				introMessage: '🌐 Keel Multi-Site Dev Server:',
			}),

			// Live reload for Twig templates only
			// Note: CSS entry points (primary, secondary, tertiary) are NOT included here
			// because they should use Vite's native HMR, not full-page reload
			liveReload(['../templates/**/*.twig'], {
				// Wait for file writes to complete before triggering reload
				// This ensures Vite finishes processing before browser reloads
				awaitWriteFinish: {
					stabilityThreshold: 500, // Wait 500ms after file stops changing
					pollInterval: 100,
				},
			}),

			// Sync static file directories with watching in dev mode
			staticSync(),

			// Keep vite-plugin-static-copy for build-time organization
			viteStaticCopy({
				silent: true,
				targets: [
					// Ensure static files go to dist/ during build
					{
						src: 'static/**/*',
						dest: '.',
						rename: { stripBase: 1 },
					},
					// Ensure favicons go to web root during build
					{
						src: 'favicons/**/*',
						dest: '../',
						rename: { stripBase: 1 },
					},
					{
						src: 'icon-picker/**/*',
						dest: './icons',
						rename: { stripBase: 1 },
					},
				],
			}),

			// Tailwind CSS 4.x integration
			tailwindcss(),

			// Asset compression for production builds
			...(!isDev
				? [
						// Gzip compression
						gzipPlugin(),

						// Brotli compression (better compression ratio)
						gzipPlugin({
							customCompression: (content: string | Buffer) =>
								brotliCompressSync(Buffer.from(content)),
							fileName: '.br',
						}),
					]
				: []),
		],
	}
})
