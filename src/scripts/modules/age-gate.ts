/**
 * Age Gate Modal Component
 *
 * This component manages an age verification modal using a native HTML `<dialog>` element.
 * It ensures accessibility through focus trapping and proper ARIA attributes.
 *
 * @see https://jaredcunha.com/blog/html-dialog-getting-accessibility-and-ux-right
 */
class AgeGate {
	/** The `<dialog>` element acting as the modal. */
	private modal: HTMLDialogElement
	/** The button used to close the modal. */
	private closeButton: HTMLButtonElement | null
	/** Stores the function to remove the focus trap event listener. */
	private releaseFocusTrap: (() => void) | null = null

	/**
	 * Initializes the AgeGate component.
	 * @param modal - The `<dialog>` element for the age gate.
	 */
	constructor(modal: HTMLDialogElement) {
		this.modal = modal
		this.closeButton = this.modal.querySelector('[data-close-modal]')

		if (!this.closeButton) {
			console.warn('Age gate modal is missing a close button.', this.modal)
			return
		}

		this.init()
	}

	/**
	 * Checks for previous age verification. If not found, sets up event
	 * listeners and opens the modal.
	 */
	private init(): void {
		// Check if the user has already verified their age
		const isVerified = localStorage.getItem('ageGateVerified') === 'true';

		if (isVerified) {
			// User is verified, so we don't need to show the modal.
			return;
		}

		// User is not verified, so show the modal for verification.
		this.open();

		// Add a listener to the confirmation button to set the flag and close.
		this.closeButton?.addEventListener('click', () => {
			localStorage.setItem('ageGateVerified', 'true');
			this.close();
		});

		// Add a listener to handle cleanup after the dialog is closed.
		this.modal.addEventListener('close', () => this.onClose());
	}

	/**
	 * Opens the modal and applies necessary body classes and focus trap.
	 */
	public open(): void {
		if (this.modal.open) return

		const currentVerticalScroll = window.scrollY
		this.modal.showModal()
		document.body.classList.add('age-gate-active')
		// Restore scroll position to prevent jumping
		window.scrollTo(0, currentVerticalScroll)
		this.releaseFocusTrap = this.trapFocus()
	}

	/**
	 * Closes the modal. The 'close' event listener will handle cleanup.
	 */
	public close(): void {
		if (!this.modal.open) return
		this.modal.close()
	}

	/**
	 * Handles cleanup tasks after the modal is closed.
	 */
	private onClose(): void {
		document.body.classList.remove('age-gate-active')
		// Release the focus trap when the modal is closed
		if (this.releaseFocusTrap) {
			this.releaseFocusTrap()
			this.releaseFocusTrap = null
		}
	}

	/**
	 * Traps focus within the modal dialog.
	 * @returns A function to remove the event listener and release the trap.
	 */
	private trapFocus(): () => void {
		const focusableEls = this.modal.querySelectorAll<HTMLElement>(
			'a[href]:not([disabled]), button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([disabled]):not([tabindex="-1"])',
		)
		const firstFocusableEl = focusableEls[0]
		const lastFocusableEl = focusableEls[focusableEls.length - 1]

		const handleKeyDown = (e: KeyboardEvent): void => {
			if (e.key !== 'Tab') return

			if (e.shiftKey) {
				// Shift + Tab
				if (document.activeElement === firstFocusableEl) {
					lastFocusableEl?.focus()
					e.preventDefault()
				}
			} else {
				// Tab
				if (document.activeElement === lastFocusableEl) {
					firstFocusableEl?.focus()
					e.preventDefault()
				}
			}
		}

		this.modal.addEventListener('keydown', handleKeyDown)

		// Set initial focus to the first focusable element
		firstFocusableEl?.focus()

		// Return a function to remove the event listener
		return () => {
			this.modal.removeEventListener('keydown', handleKeyDown)
		}
	}
}

/**
 * Initializes the AgeGate functionality for the provided elements.
 * @param els - A NodeList of `<dialog>` elements with the `data-age-gate` attribute.
 */
export default function initAgeGate(els: NodeListOf<Element>): void {
	console.log(`🔞 Initializing ${els.length} age gate modal(s)`)

	els.forEach((el) => {
		if (el instanceof HTMLDialogElement) {
			new AgeGate(el)
		} else {
			console.warn('Age Gate element is not a <dialog> element:', el)
		}
	})
}