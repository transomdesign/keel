import '@splidejs/splide/css'
import Splide from '@splidejs/splide'
import { AutoScroll } from '#src/lib/splide-auto-scroll-smooth'

export default (elements: NodeListOf<HTMLElement>): void => {
	elements.forEach((element) => {
		new Splide(element, {
			type: 'loop',
			autoWidth: true,
			height: '36dvh', // Fixed height for the carousel
			pagination: false,
			arrows: false,
			gap: 12,
			autoScroll: {
				speed: 0.5,
				slowdownDuration: 1000,
			},
		}).mount({ AutoScroll })
	})
}
