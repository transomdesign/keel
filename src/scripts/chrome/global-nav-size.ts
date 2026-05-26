/**
 * Set global CSS vars based on header element's full (uncollapsed) dimensions.
 * Temporarily forces the header to full state to get accurate height for body padding.
 *
 * Sets:
 *   --global-nav-width   — full viewport-width of the header
 *   --global-nav-height  — header height only (used by jump-to-nav sticky `top`, toolbox, mobile menu)
 *   --global-chrome-height — header + jump-to-nav combined (for consumers that need total sticky chrome)
 */
function refreshNavSize(header: HTMLElement): void {
	// Store current state
	const hadFullClass = header.classList.contains('header--full')
	const hadHideClass = header.classList.contains('hide')
	const hadScrolledClass = header.classList.contains('scrolled')

	// Temporarily force full state to measure uncollapsed height.
	// Disable transitions first so getBoundingClientRect() reads the final
	// layout immediately rather than a mid-transition (0fr) value.
	const animated = header.querySelectorAll<HTMLElement>('.navbar, .message-bar-wrap')
	animated.forEach((el) => (el.style.transition = 'none'))

	// jump-to-nav lives outside <header> as a sibling — disable its transition
	// separately so the `top` animation doesn't affect its measured height.
	const jumpToNav = document.querySelector<HTMLElement>('.jump-to-nav')
	if (jumpToNav) jumpToNav.style.transition = 'none'

	header.classList.add('header--full')
	header.classList.remove('hide', 'scrolled')

	// Force synchronous reflow so the browser resolves the full grid height
	header.offsetHeight

	const { width, height } = header.getBoundingClientRect()
	const jumpToNavHeight = jumpToNav?.getBoundingClientRect().height ?? 0

	// Re-enable transitions before restoring state so the hide animation plays normally
	animated.forEach((el) => (el.style.transition = ''))
	if (jumpToNav) jumpToNav.style.transition = ''

	// Restore original state
	if (!hadFullClass) header.classList.remove('header--full')
	if (hadHideClass) header.classList.add('hide')
	if (hadScrolledClass) header.classList.add('scrolled')

	document.documentElement.style.setProperty('--global-nav-width', `${width}px`)
	document.documentElement.style.setProperty('--global-nav-height', `${height}px`)
	document.documentElement.style.setProperty('--global-chrome-height', `${height + jumpToNavHeight}px`)
}

function initNavSize(): void {
	const header = document.querySelector('body > header') as HTMLElement

	if (!header) return

	// Set initial values
	refreshNavSize(header)

	// Only remeasure when the viewport WIDTH changes (orientation change, browser resize).
	// iOS address-bar hide/show only changes innerHeight — skipping those prevents the
	// header from briefly flashing open during the measurement class-swap.
	let prevWidth = window.innerWidth
	let resizeTimeout: number | undefined
	window.addEventListener(
		'resize',
		() => {
			clearTimeout(resizeTimeout)
			resizeTimeout = window.setTimeout(() => {
				const currentWidth = window.innerWidth
				if (currentWidth === prevWidth) return
				prevWidth = currentWidth
				refreshNavSize(header)
			}, 150)
		},
		{ passive: true },
	)
}

export default initNavSize
