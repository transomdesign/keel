export type ScrollDirection = 'initial' | 'up' | 'down'

type ScrollDirectionManagerOptions = {
	/** Minimum scroll position (in px) before tracking direction changes. Default: 120 */
	initialOffset?: number
	/** Minimum scroll distance (in px) required to trigger a direction change. Default: 0 */
	threshold?: number
	/** Callback fired when scroll direction changes */
	onDirectionChange?: (direction: ScrollDirection) => void
}

/**
 * Tracks scroll direction and fires callbacks when direction changes.
 * Useful for showing/hiding navigation based on scroll behavior.
 */
export class ScrollDirectionManager {
	private readonly onDirectionChange: ScrollDirectionManagerOptions['onDirectionChange'] =
		undefined
	private currentScrollPosition: number
	private lastScrollPosition: number
	private pendingDirection: ScrollDirection | null = null
	private pendingDirectionStartPosition: number = 0
	private scrollDirection: ScrollDirection = 'initial'
	private readonly initialOffset: number = 120
	private readonly threshold: number = 0

	private scrollListener: EventListener | null = null

	public constructor({
		initialOffset,
		threshold,
		onDirectionChange,
	}: ScrollDirectionManagerOptions) {
		this.currentScrollPosition = window.scrollY
		this.lastScrollPosition = this.currentScrollPosition
		if (initialOffset !== undefined) this.initialOffset = initialOffset
		if (threshold !== undefined) this.threshold = threshold
		this.onDirectionChange = onDirectionChange
		this.setupSubscriptions()
	}

	private readonly setupSubscriptions = (): void => {
		this.scrollListener = this.handleScrollDirection.bind(this)
		window.addEventListener('scroll', this.scrollListener, { passive: true })
	}

	private readonly handleScrollDirection = (): void => {
		const position = window.scrollY

		// Skip if position hasn't changed
		if (position === this.currentScrollPosition) return

		let detectedDirection: ScrollDirection = 'initial'

		// Determine current scroll direction
		if (position <= this.initialOffset) {
			detectedDirection = 'initial'
		} else if (position < this.currentScrollPosition) {
			detectedDirection = 'up'
		} else if (position > this.currentScrollPosition) {
			detectedDirection = 'down'
		}

		// Handle direction changes with threshold
		if (detectedDirection !== this.scrollDirection) {
			// If we're entering or leaving 'initial' state, change immediately
			if (
				this.scrollDirection === 'initial' ||
				detectedDirection === 'initial'
			) {
				this.commitDirectionChange(detectedDirection, position)
			}
			// Otherwise, we need to handle the threshold
			else if (this.pendingDirection !== detectedDirection) {
				// New direction detected, start tracking
				this.pendingDirection = detectedDirection
				this.pendingDirectionStartPosition = position
			}
			// Check if we've scrolled enough in the pending direction
			else if (this.pendingDirection === detectedDirection) {
				const scrolledDistance = Math.abs(
					position - this.pendingDirectionStartPosition,
				)

				if (scrolledDistance >= this.threshold) {
					this.commitDirectionChange(detectedDirection, position)
				}
			}
		} else {
			// Direction hasn't changed, clear any pending direction
			this.pendingDirection = null
		}

		// Update current position for next comparison
		this.currentScrollPosition = position
	}

	private readonly commitDirectionChange = (
		newDirection: ScrollDirection,
		position: number,
	): void => {
		this.scrollDirection = newDirection
		this.lastScrollPosition = position
		this.pendingDirection = null
		this.onDirectionChange?.(newDirection)
	}

	/** Get the current scroll direction */
	public getDirection(): ScrollDirection {
		return this.scrollDirection
	}

	/** Get the current scroll position */
	public getScrollPosition(): number {
		return this.currentScrollPosition
	}

	/** Cleanup method to remove scroll listener */
	public dispose(): void {
		if (this.scrollListener) {
			window.removeEventListener('scroll', this.scrollListener)
			this.scrollListener = null
		}
	}
}

/**
 * Watches all [data-section-theme="transparent"] sections and toggles
 * header--over-transparent on the header while any such section is visible.
 */
function watchTransparentSections(header: HTMLElement): void {
	const sections = document.querySelectorAll<HTMLElement>(
		'[data-section-theme="transparent"]',
	)
	if (!sections.length) return

	const logos = document.querySelectorAll<HTMLElement>(
		'.navbar__logo-desktop, .navbar__logo-mobile',
	)

	const setTransparency = (active: boolean): void => {
		header.classList.toggle('header--over-transparent', active)
		logos.forEach((logo) => logo.classList.toggle('white', active))
	}

	// Set initial state immediately based on scroll position. Layout measurements
	// (offsetHeight, getBoundingClientRect) are unreliable this early — Vite dev
	// injects CSS asynchronously, so the header can report wildly wrong heights.
	// At scroll-top the hero is guaranteed to be behind the header.
	if (window.scrollY === 0) {
		setTransparency(true)
	}

	// Create the IntersectionObserver once layout is fully stable (all CSS, fonts,
	// and images loaded). Observers created earlier get wrong rootMargin values
	// from the not-yet-styled header height.
	const onReady = (): void => {
		const headerHeight = header.offsetHeight
		const observer = new IntersectionObserver(
			(entries) => {
				setTransparency(entries.some((e) => e.isIntersecting))
			},
			{ threshold: 0, rootMargin: `-${headerHeight}px 0px 0px 0px` },
		)
		sections.forEach((el) => observer.observe(el))
	}

	if (document.readyState === 'complete') {
		onReady()
	} else {
		window.addEventListener('load', onReady, { once: true })
	}
}

export default function initScroll(): void {
	const header = document.querySelector<HTMLElement>('#header')
	if (!header) return

	new ScrollDirectionManager({
		initialOffset: 145,
		threshold: 50,
		onDirectionChange: (direction) => {
			if (direction === 'initial' || direction === 'up') {
				header.classList.add('header--full')
				header.classList.remove('hide')
			} else if (direction === 'down') {
				header.classList.remove('header--full')
				header.classList.add('hide')
			}
			header.classList.toggle('scrolled', direction !== 'initial')
		},
	})

	watchTransparentSections(header)
}
