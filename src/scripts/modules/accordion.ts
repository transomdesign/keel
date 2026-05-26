/**
 * Animated Accordion Component
 *
 * A TypeScript accordion implementation using HTML <details> elements and Web Animations API.
 * Provides smooth expand/collapse transitions instead of the default abrupt toggle.
 *
 * Features:
 * - Uses semantic HTML <details> elements
 * - Smooth animations via Web Animations API
 * - TypeScript support with proper typing
 * - Prevents animation conflicts
 * - Accessible by default (details/summary)
 *
 * HTML Structure:
 * ```html
 * <details data-accordion>
 *   <summary>Question</summary>
 *   <div>Answer content</div>
 * </details>
 * ```
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API
 */

interface AccordionConfig {
	duration?: number
	easing?: string
}

class Accordion {
	private el: HTMLDetailsElement
	private summary: HTMLElement | null = null
	private content: HTMLElement | null = null
	private animation: Animation | null = null
	private isClosing: boolean = false
	private isExpanding: boolean = false
	private config: AccordionConfig

	constructor(el: HTMLDetailsElement, config: AccordionConfig = {}) {
		this.el = el
		this.config = {
			duration: 400,
			easing: 'ease-in-out',
			...config,
		}

		// Find required elements
		const summary = el.querySelector('summary')
		const content = el.querySelector('summary + div')

		if (!summary) {
			console.warn('Accordion missing <summary> element:', el)
			return
		}

		this.summary = summary
		this.content = content as HTMLElement

		// Set up event listener
		this.summary.addEventListener('click', (e) => this.onClick(e))
	}

	/**
	 * Handle click events on the summary element
	 */
	private onClick(e: Event): void {
		// Type guard to ensure summary exists
		if (!this.summary) return

		e.preventDefault() // Prevent default toggle behavior
		this.el.style.overflow = 'hidden' // Prevent content overflow during animation

		if (this.isClosing || !this.el.open) {
			this.open()
		} else if (this.isExpanding || this.el.open) {
			this.shrink()
		}
	}

	/**
	 * Animate the accordion to closed state
	 */
	private shrink(): void {
		if (!this.summary) return

		this.isClosing = true

		const startHeight = `${this.el.offsetHeight}px`
		const endHeight = `${this.summary.offsetHeight}px`

		// Cancel any running animation before starting a new one
		if (this.animation) {
			this.animation.cancel()
		}

		// Animate from current height to summary-only height
		this.animation = this.el.animate(
			{
				height: [startHeight, endHeight],
			},
			{
				duration: this.config.duration,
				easing: this.config.easing,
			},
		)

		this.animation.onfinish = () => this.onAnimationFinish(false)
		this.animation.oncancel = () => (this.isClosing = false)
	}

	/**
	 * Prepare accordion for opening animation
	 */
	private open(): void {
		if (!this.summary) return

		// Set initial height before changing open state to prevent jump
		this.el.style.height = `${this.el.offsetHeight}px`

		// Set details to open state
		this.el.open = true
		this.isExpanding = true

		// Wait for next frame to ensure DOM updates before animating
		window.requestAnimationFrame(() => this.expand())
	}

	/**
	 * Animate the accordion to open state
	 */
	private expand(): void {
		this.isExpanding = true

		// Get the height immediately after setting open attribute
		const startHeight = `${this.el.offsetHeight}px`

		// Force the details content to be visible for accurate height calculation
		this.el.style.height = 'auto'
		// Get the full expanded height
		const endHeight = `${this.el.offsetHeight}px`
		// Set back to startHeight for animation
		this.el.style.height = startHeight

		if (this.animation) {
			this.animation.cancel()
		}

		// Animate from summary-only to full content height
		this.animation = this.el.animate(
			{
				height: [startHeight, endHeight],
			},
			{
				duration: this.config.duration,
				easing: 'ease-out',
			},
		)

		this.animation.onfinish = () => this.onAnimationFinish(true)
		this.animation.oncancel = () => (this.isExpanding = false)
	}

	/**
	 * Clean up after animation completes
	 */
	private onAnimationFinish(open: boolean): void {
		this.el.open = open // Update the open attribute
		this.animation = null
		this.isClosing = false
		this.isExpanding = false

		// Remove temporary styling applied during animation
		this.el.style.height = this.el.style.overflow = ''
	}
}

/**
 * Initialize accordion functionality for the provided elements
 *
 * @param accordions - NodeList of details elements with data-accordion attribute
 */
export default function initAccordion(accordions: NodeListOf<Element>): void {
	console.log(`🪗 Initializing ${accordions.length} animated accordion(s)`)

	accordions.forEach((el) => {
		if (el instanceof HTMLDetailsElement) {
			new Accordion(el)
		} else {
			console.warn('Accordion element is not a <details> element:', el)
		}
	})
}
