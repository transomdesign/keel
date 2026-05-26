import Splide from '@splidejs/splide'
import '@splidejs/splide/css/core'

export default function initQuotesCarousel(els: NodeListOf<Element>): void {
	els.forEach((el) => {
		const splide = new Splide(el as HTMLElement, {
			type: 'loop',
			perPage: 1,
			arrows: false,
			pagination: true,
			gap: '2rem',
		})

		const list = el.querySelector<HTMLElement>('.splide__list')

		const realSlides = () => el.querySelectorAll<HTMLElement>('.splide__slide:not(.splide__slide--clone)')

		const setHeight = (index: number) => {
			const target = realSlides()[index]
			if (target && list) {
				list.style.height = `${target.offsetHeight}px`
			}
		}

		splide.on('mounted', () => document.fonts.ready.then(() => setHeight(splide.index)))
		splide.on('move', (newIndex: number) => setHeight(newIndex))

		splide.mount()
	})
}
