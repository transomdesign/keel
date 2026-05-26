/**
 * Dynamic Module Loader
 *
 * This module provides a way to automatically load JavaScript modules based on
 * HTML 'data' attributes found in the DOM. It's a performance optimization that
 * only loads code when the corresponding HTML elements are actually present.
 * See: https://www.mostlyserious.io/insights/process-spotlight-how-we-do-javascript-at-mostly-serious
 *
 * How it works:
 * 1. Define modules with their CSS selectors in the modules object
 * 2. When init() is called, it searches the scope for elements matching each selector
 * 3. If matching elements are found, it dynamically imports the module
 * 4. The imported module is then called with the matching elements
 *
 * Example:
 * - HTML: <div data-accordion>...</div>
 * - This will automatically load and initialize the accordion module
 */

// Module registry: maps CSS selectors to dynamic import functions
const modules: Record<string, () => Promise<any>> = {
	'[data-accordion]': () => import('./modules/accordion'),
	'[data-carousel]': () => import('./modules/carousel'),
	'[data-video-trigger]': () => import('./modules/video-modal'),
	'[data-quotes-carousel]': () => import('./modules/quotes-carousel'),
}

/**
 * Initialize modules for elements found within the given scope
 *
 * @param scope - The DOM element to search within (usually document)
 */
export default (scope: Document | Element): void => {
	// Loop through each registered module
	Object.keys(modules).forEach((selector) => {
		// Get the import function for this selector
		const request = modules[selector]

		// TypeScript safety check: ensure the module exists
		if (!request) {
			console.warn(`Module not found for selector: ${selector}`)
			return
		}

		// IIFE (Immediately Invoked Function Expression) pattern:
		// This creates and immediately calls a function with the query results
		;((els) => {
			// Only load the module if we found matching elements
			if (els && els.length) {
				// Dynamically import the module and call its default export
				// with the matching elements
				void request().then(({ default: module }) => module(els))
			}
		})(scope.querySelectorAll(selector)) // <- This part executes the query and passes results to the IIFE
	})
}
