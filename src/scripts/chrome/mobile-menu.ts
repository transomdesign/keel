/**
 * Mobile Menu Module
 *
 * Handles the mobile navigation menu functionality including:
 * - Opening/closing the menu
 * - Body scroll locking when menu is open
 * - Focus trapping for accessibility
 * - Keyboard navigation (ESC to close)
 * - Click away to close when open
 * - Viewport height handling for mobile browsers
 * - Navbar offset calculation
 *
 * This module is loaded globally in main.ts as it's needed on every page.
 */

// eslint-disable-next-line import/no-duplicates -- Side-effect import needed to register web component
import '@a11y/focus-trap'
// eslint-disable-next-line import/no-duplicates -- Type import for TypeScript
import { type FocusTrap } from '@a11y/focus-trap'
import { disableBodyScroll, clearAllBodyScrollLocks } from 'body-scroll-lock'

/**
 * Menu State Manager
 *
 * Encapsulates all menu-related functionality in a class for better organization
 * and state management.
 */
class MobileMenu {
	private burgerButton: HTMLElement | null = null
	private closeButton: HTMLElement | null = null
	private mobileMenu: HTMLElement | null = null
	private focusTrap: FocusTrap | null = null

	constructor() {
		this.initElements()
		this.attachEventListeners()
		this.initViewportHandlers()
	}

	/**
	 * Initialize DOM element references with null checks
	 */
	private initElements(): void {
		this.burgerButton = document.querySelector('.burger-button')
		this.closeButton = document.querySelector('.close-menu')
		this.mobileMenu = document.querySelector('.mobile-menu')
		this.focusTrap = document.querySelector<FocusTrap>('focus-trap')

		// Warn if critical elements are missing
		if (!this.burgerButton) {
			console.warn('Mobile menu: burger button not found')
		}
		if (!this.closeButton) {
			console.warn('Mobile menu: close button not found')
		}
		if (!this.mobileMenu) {
			console.warn('Mobile menu: mobile menu element not found')
		}
		if (!this.focusTrap) {
			console.warn('Mobile menu: focus trap not found')
		}
	}

	/**
	 * Attach all event listeners
	 */
	private attachEventListeners(): void {
		// Menu toggle click handler
		if (this.burgerButton) {
			this.burgerButton.addEventListener('click', (event) => {
				event.preventDefault()
				this.toggleMenu()
			})
		}

		// Close button click handler
		if (this.closeButton) {
			this.closeButton.addEventListener('click', (event) => {
				event.preventDefault()
				this.closeMenu()
			})
		}

		// ESC key handler
		window.addEventListener('keydown', (event) => {
			if (event.code === 'Escape') {
				this.closeMenu()
			}
		})

		// Click away to close handler
		document.addEventListener('click', (event) => {
			this.handleClickAway(event)
		})
	}

	/**
	 * Initialize viewport-related event handlers
	 */
	private initViewportHandlers(): void {
		window.addEventListener('resize', () => {
			this.refreshNavOffset()
		})

		window.addEventListener('load', () => {
			this.refreshNavOffset()
		})
	}

	/**
	 * Toggle menu open/closed state
	 */
	private toggleMenu(): void {
		if (!this.burgerButton) return

		const isOpen = this.burgerButton.classList.contains('menu--open')
		isOpen ? this.closeMenu() : this.openMenu()
	}

	/**
	 * Open the mobile menu
	 */
	private openMenu(): void {
		if (!this.burgerButton || !this.mobileMenu) return

		this.burgerButton.classList.add('menu--open')
		this.mobileMenu.classList.add('mobile-menu--open')
		this.mobileMenu.setAttribute('aria-expanded', 'true')
		this.burgerButton.setAttribute('aria-expanded', 'true')

		// Disable body scroll when menu is open
		disableBodyScroll(this.mobileMenu)

		// Activate focus trap and focus first element
		if (this.focusTrap) {
			this.focusTrap.inactive = false
			this.focusTrap.focusFirstElement()
		}
	}

	/**
	 * Close the mobile menu
	 */
	private closeMenu(): void {
		if (!this.burgerButton || !this.mobileMenu) return

		this.burgerButton.classList.remove('menu--open')
		this.mobileMenu.classList.remove('mobile-menu--open')
		this.mobileMenu.setAttribute('aria-expanded', 'false')
		this.burgerButton.setAttribute('aria-expanded', 'false')

		// Re-enable body scroll
		clearAllBodyScrollLocks()

		// Deactivate focus trap
		if (this.focusTrap) {
			this.focusTrap.inactive = true
		}
	}

	/**
	 * Handle click away from menu
	 *
	 * Closes the menu if user clicks outside of it while it's open
	 */
	private handleClickAway(event: MouseEvent): void {
		if (!this.mobileMenu || !this.burgerButton) return

		// Only handle if menu is open
		const isMenuOpen = this.burgerButton.classList.contains('menu--open')
		if (!isMenuOpen) return

		const target = event.target as Node

		// Close menu if click is outside both the menu and burger button
		const isClickInsideMenu = this.mobileMenu.contains(target)
		const isClickOnBurger = this.burgerButton.contains(target)

		if (!isClickInsideMenu && !isClickOnBurger) {
			this.closeMenu()
		}
	}

	/**
	 * Calculate and set navbar offset CSS variable
	 *
	 * Useful for positioning elements below the navbar
	 */
	private refreshNavOffset(): void {
		const navbar = document.querySelector('.navbar')

		if (navbar) {
			const navbarTopOffset = navbar.getBoundingClientRect().bottom
			document.documentElement.style.setProperty(
				'--navbar-top-offset',
				`${navbarTopOffset.toFixed(2)}px`,
			)
		}
	}
}

/**
 * Initialize the mobile menu
 *
 * This is called from main.ts to set up the menu functionality
 */
export default function initMenu(): void {
	console.log('📱 Initializing mobile menu')
	new MobileMenu()
}
