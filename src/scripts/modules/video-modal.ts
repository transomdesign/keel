/**
 * Video Modal Module
 *
 * Opens a shared <dialog> with an iframe video when any [data-video-trigger]
 * element is clicked. Clears the iframe src on close to stop video playback.
 *
 * Usage in templates:
 *   <button data-video-trigger data-video-url="https://www.youtube.com/embed/VIDEO_ID">
 *     Play video
 *   </button>
 */
export default function initVideoModal(triggers: NodeListOf<Element>): void {
	const dialog = document.querySelector<HTMLDialogElement>('#video-modal')
	if (!dialog) return

	const iframe = dialog.querySelector<HTMLIFrameElement>('.video-modal__iframe')
	const closeButton = dialog.querySelector<HTMLButtonElement>('.video-modal__close')

	function openModal(url: string): void {
		if (iframe) iframe.src = url
		dialog!.showModal()
	}

	function closeModal(): void {
		dialog!.close()
	}

	// Wire each trigger
	triggers.forEach((trigger) => {
		trigger.addEventListener('click', (e) => {
			e.preventDefault()
			const url = trigger.getAttribute('data-video-url')
			if (url) openModal(url)
		})
	})

	// Close button
	closeButton?.addEventListener('click', closeModal)

	// Backdrop click (click on dialog element itself, not children)
	dialog.addEventListener('click', (e) => {
		if (e.target === dialog) closeModal()
	})

	// Clear src on close to stop video playback
	dialog.addEventListener('close', () => {
		if (iframe) iframe.src = ''
	})
}
