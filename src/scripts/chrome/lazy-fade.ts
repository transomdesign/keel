/**
 * Progressive enhancement lazy image fade-in effect with viewport detection
 *
 * This module enhances native lazy loading with a smooth fade-in animation
 * that only triggers when the image is actually visible in the viewport.
 * - Works with native loading="lazy" images
 * - Uses Intersection Observer for viewport detection
 * - Gracefully degrades for users without JavaScript
 * - Uses CSS transitions for smooth animations
 * - A11y friendly with proper fallbacks
 */

// Initialize the lazy fade functionality
function initLazyFade(): void {
	// Set up progressive enhancement - add js-enabled class to html
	document.documentElement.classList.add('js-enabled')

	// Find all lazy loading images
	const lazyImages = document.querySelectorAll<HTMLImageElement>(
		'img[loading="lazy"]',
	)

	// Set up Intersection Observer for viewport detection
	const intersectionObserver = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					const img = entry.target as HTMLImageElement
					// Mark as in viewport for potential later loading
					img.dataset.inViewport = 'true'
					// Image is now visible in viewport, check if it's loaded
					checkImageAndFade(img)
					// Only unobserve if image actually faded in
					if (img.classList.contains('lazy-fade-loaded')) {
						intersectionObserver.unobserve(img)
					}
				}
			})
		},
		{
			rootMargin: '-100px', // Start fade after image is already 50px into viewport
			threshold: 0.1, // Trigger when 10% of image is visible
		},
	)

	if (lazyImages.length > 0) {
		console.log(`🦥 Setting up lazy fade for ${lazyImages.length} images`)

		lazyImages.forEach((img) => {
			// Add initial fade class (images start hidden when JS is enabled)
			img.classList.add('lazy-fade')

			// Track load state
			img.dataset.loadState = 'loading'

			// Listen for load event (but don't fade in yet)
			if (img.complete && img.naturalWidth > 0) {
				img.dataset.loadState = 'loaded'
			} else {
				img.addEventListener(
					'load',
					() => {
						img.dataset.loadState = 'loaded'
						// If image was already detected as in viewport, fade it in now
						if (img.dataset.inViewport === 'true') {
							checkImageAndFade(img)
							// Unobserve now that it's loaded and faded in
							intersectionObserver.unobserve(img)
						}
					},
					{ once: true },
				)

				img.addEventListener(
					'error',
					() => {
						img.dataset.loadState = 'error'
						handleImageError(img)
					},
					{ once: true },
				)
			}

			// Start observing for viewport intersection
			intersectionObserver.observe(img)
			
			// Check if image is already in viewport (handles page refresh case)
			const rect = img.getBoundingClientRect()
			const rootMargin = 100 // Match the rootMargin value from observer
			const isInViewport = rect.top < window.innerHeight + rootMargin && rect.bottom > -rootMargin
			
			if (isInViewport) {
				// Mark image as in viewport for load event handler
				img.dataset.inViewport = 'true'
				// Image is already in viewport, check if it should fade in
				checkImageAndFade(img)
				intersectionObserver.unobserve(img)
			}
		})
	}

	/**
	 * Check if image is loaded and in viewport, then fade it in
	 */
	function checkImageAndFade(img: HTMLImageElement): void {
		const loadState = img.dataset.loadState

		if (loadState === 'loaded') {
			// Image is loaded and visible, fade it in
			handleImageLoad(img)
		} else if (loadState === 'error') {
			// Image failed to load but is visible
			handleImageError(img)
		}
		// If still loading, the load event handler will call this function again
	}

	/**
	 * Handle successful image load and fade-in
	 */
	function handleImageLoad(img: HTMLImageElement): void {
		// Add loaded class to trigger fade-in animation
		img.classList.add('lazy-fade-loaded')

		// Clean up data attribute
		delete img.dataset.loadState

		// Optional: Remove the transition class after animation completes
		// to improve performance for subsequent interactions
		img.addEventListener(
			'transitionend',
			() => {
				img.classList.remove('lazy-fade')
			},
			{ once: true },
		)
	}

	/**
	 * Handle image load errors
	 */
	function handleImageError(img: HTMLImageElement): void {
		console.warn('Failed to load lazy image:', img.src)
		// Still show the image area even if it failed to load
		img.classList.add('lazy-fade-error')

		// Clean up data attribute
		delete img.dataset.loadState
	}
}

// Auto-initialize when module is imported
initLazyFade()

// Export for potential manual initialization
export default initLazyFade
