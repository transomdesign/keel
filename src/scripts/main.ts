/**
 * Main JavaScript Entry Point
 *
 * This is the primary entry point for all client-side JavaScript functionality.
 * It handles DOM ready state detection and initializes all components and utilities.
 *
 * Architecture:
 * - CSS imports for styling (imported here in TS for Vite)
 * - DOM ready detection with fallback for already-loaded pages
 * - Dynamic imports for performance (code splitting)
 */

// Import main stylesheet (processed by Vite)
import '../styles/main.css'

// Import site-specific CSS for HMR support in development
// In production, these are loaded via <link> tags from Craft
// Extend or remove these hostname checks to match your project's multi-site URLs
if (import.meta.env.DEV) {
	const hostname = window.location.hostname

	if (hostname.includes('keel-fourth')) {
		void import('../styles/sites/tertiary.css')
	} else if (hostname.includes('keel-tertiary')) {
		void import('../styles/sites/secondary.css')
	} else if (hostname.includes('keel-secondary')) {
		void import('../styles/sites/primary.css')
	}
}

// Import the dynamic module loader
import moduleLoader from './module-loader'

/**
 * DOM Ready Handler
 *
 * This function runs when the DOM is fully loaded and ready for manipulation.
 * It's called either immediately (if DOM is already ready) or when DOMContentLoaded fires.
 */
const onDOMReady = (): void => {
	console.log('🚀 DOM ready - initializing JavaScript')

	// Initialize dynamic component loader
	// This will scan the DOM for data attributes and load corresponding modules
	moduleLoader(document)

	// ============================================================================
	// Global Utilities & Components
	// ============================================================================

	// Load lazy image fade utility
	// This enhances native lazy loading with smooth fade-in animations
	import('./chrome/lazy-fade')
		.then(() => {
			console.log('✅ Lazy fade utility loaded')
		})
		.catch((e) => console.error('❌ Failed to load lazy-fade.ts', e))

	import('./chrome/header-scroll')
		.then((module) => {
			module.default()
			console.log('✅ Scroll utility loaded')
		})
		.catch((e) => console.error('❌ Failed to load header-scroll.ts', e))

	import('./chrome/mobile-menu')
		.then((module) => {
			module.default()
			console.log('✅ Mobile menu loaded')
		})
		.catch((e) => console.error('❌ Failed to load menu.ts', e))

	import('./chrome/toolbox-menu')
		.then((module) => {
			module.default()
			console.log('✅ Toolbox menu loaded')
		})
		.catch((e) => console.error('❌ Failed to load toolbox-menu.ts', e))

	import('./chrome/jump-to-nav')
		.then((module) => {
			module.default()
			console.log('✅ Jump to Nav utility loaded')
		})
		.catch((e) => console.error('❌ Failed to load jump-to-nav.ts', e))

	import('../lib/lite-vimeo/lite-vimeo')
		.then(() => console.log('✅ Lite Vimeo loaded'))
		.catch((e) => console.error('❌ Failed to load lite-vimeo', e))
}

// Ensure global nav size is calculated after all assets (especially images) are loaded
window.addEventListener('load', () => {
	import('./chrome/global-nav-size')
		.then((module) => {
			module.default()
			console.log('✅ Nav Size utility loaded (after window load)')
		})
		.catch((e) =>
			console.error(
				'❌ Failed to load global-nav-size.ts (after window load)',
				e,
			),
		)
})

/**
 * DOM Ready Detection
 *
 * This IIFE (Immediately Invoked Function Expression) handles DOM ready state detection.
 * It accounts for two scenarios:
 * 1. Script loads after DOM is already ready (document.readyState !== 'loading')
 * 2. Script loads before DOM is ready (listen for DOMContentLoaded event)
 *
 * This is more reliable than just using DOMContentLoaded alone.
 */
;((ready) => {
	if (document.readyState !== 'loading') {
		// DOM is already ready, execute immediately
		ready()
	} else {
		// DOM is still loading, wait for DOMContentLoaded event
		document.addEventListener('DOMContentLoaded', ready)
	}
})(onDOMReady) // Pass our ready handler to the IIFE
