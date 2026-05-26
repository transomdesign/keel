
const JUMP_TO_NAV_ID = 'jump-to-nav'
const MD_BREAKPOINT = 768 // Tailwind's default 'md' breakpoint

const handleJumpToNav = (): void => {
	const jumpToNavContainer = document.getElementById(JUMP_TO_NAV_ID)
	if (!jumpToNavContainer) return

	const detailsElement = jumpToNavContainer.querySelector('details') as HTMLDetailsElement | null
	if (!detailsElement) return

	const mediaQuery = window.matchMedia(`(min-width: ${MD_BREAKPOINT}px)`)

	const handleBreakpointChange = (e: MediaQueryList | MediaQueryListEvent) => {
		if (e.matches) {
			detailsElement.setAttribute('open', '')
		} else {
			detailsElement.removeAttribute('open')
		}
	}

	// Add listener and run once
	mediaQuery.addEventListener('change', handleBreakpointChange)
	handleBreakpointChange(mediaQuery)
}

export default handleJumpToNav
