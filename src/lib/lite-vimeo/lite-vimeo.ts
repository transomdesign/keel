/**
 * A lightweight Vimeo embed. Still should feel the same to the user, just
 * MUCH faster to initialize and paint.
 *
 * Based on @slightlyoff/lite-vimeo but updated for latest Vimeo API
 */

interface VimeoOEmbedResponse {
	type: string
	version: string
	provider_name: string
	provider_url: string
	title: string
	author_name: string
	author_url: string
	is_plus: string
	account_type: string
	html: string
	width: number
	height: number
	duration: number
	description: string
	thumbnail_url: string
	thumbnail_width: number
	thumbnail_height: number
	thumbnail_url_with_play_button: string
	upload_date: string
	video_id: number
	uri: string
}

export class LiteVimeoEmbed extends HTMLElement {
	private iframeLoaded = false
	private domRefFrame!: HTMLElement
	private domRefImg!: {
		fallback: HTMLImageElement
		webp: HTMLSourceElement
		jpeg: HTMLSourceElement
	}
	private domRefPlayButton!: HTMLButtonElement
	private static preconnected = false

	constructor() {
		super()
		this.setupDom()
	}

	static get observedAttributes() {
		return ['videoid']
	}

	connectedCallback() {
		this.addEventListener('pointerover', LiteVimeoEmbed.warmConnections, {
			once: true,
		})
		this.addEventListener('click', () => this.addIframe())
	}

	get videoId() {
		return encodeURIComponent(this.getAttribute('videoid') || '')
	}

	set videoId(id: string) {
		this.setAttribute('videoid', id)
	}

	get videoTitle() {
		return this.getAttribute('videotitle') || 'Video'
	}

	set videoTitle(title: string) {
		this.setAttribute('videotitle', title)
	}

	get videoPlay() {
		return this.getAttribute('videoPlay') || 'Play'
	}

	set videoPlay(name: string) {
		this.setAttribute('videoPlay', name)
	}

	get videoStartAt() {
		return this.getAttribute('start') || '0s'
	}

	set videoStartAt(time: string) {
		this.setAttribute('start', time)
	}

	get videoHash() {
		return encodeURIComponent(this.getAttribute('videohash') || '')
	}

	set videoHash(hash: string) {
		this.setAttribute('videohash', hash)
	}

	get autoLoad() {
		return this.hasAttribute('autoload')
	}

	set autoLoad(value: boolean) {
		if (value) {
			this.setAttribute('autoload', '')
		} else {
			this.removeAttribute('autoload')
		}
	}

	get autoPlay() {
		return this.hasAttribute('autoplay')
	}

	set autoPlay(value: boolean) {
		if (value) {
			this.setAttribute('autoplay', 'autoplay')
		} else {
			this.removeAttribute('autoplay')
		}
	}

	get muted() {
		return this.hasAttribute('muted')
	}

	set muted(value: boolean) {
		if (value) {
			this.setAttribute('muted', 'muted')
		} else {
			this.removeAttribute('muted')
		}
	}

	get loop() {
		return this.hasAttribute('loop')
	}

	set loop(value: boolean) {
		if (value) {
			this.setAttribute('loop', 'loop')
		} else {
			this.removeAttribute('loop')
		}
	}

	/**
	 * Define our shadowDOM for the component
	 */
	private setupDom() {
		const shadowDom = this.attachShadow({ mode: 'open' })
		shadowDom.innerHTML = `
      <style>
        :host {
          contain: content;
          display: block;
          position: relative;
          width: 100%;
          padding-bottom: calc(100% / (16 / 9));
        }

        #frame, #fallbackPlaceholder, iframe {
          position: absolute;
          width: 100%;
          height: 100%;
          left: 0;
        }

        #frame {
          cursor: pointer;
        }

        #fallbackPlaceholder {
          object-fit: cover;
        }

        #frame::before {
          content: '';
          display: block;
          position: absolute;
          top: 0;
          background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAADGCAYAAAAT+OqFAAAAdklEQVQoz42QQQ7AIAgEF/T/D+kbq/RWAlnQyyazA4aoAB4FsBSA/bFjuF1EOL7VbrIrBuusmrt4ZZORfb6ehbWdnRHEIiITaEUKa5EJqUakRSaEYBJSCY2dEstQY7AuxahwXFrvZmWl2rh4JZ07z9dLtesfNj5q0FU3A5ObbwAAAABJRU5ErkJggg==);
          background-position: top;
          background-repeat: repeat-x;
          height: 60px;
          padding-bottom: 50px;
          width: 100%;
          transition: all 0.2s cubic-bezier(0, 0, 0.2, 1);
          z-index: 1;
        }
        /* play button */
        .lvo-playbtn {
          width: 70px;
          height: 46px;
          background-color: #212121;
          z-index: 1;
          opacity: 0.8;
          border-radius: 10%;
          transition: all 0.2s cubic-bezier(0, 0, 0.2, 1);
          border: 0;
          cursor: pointer;
        }
        #frame:hover .lvo-playbtn {
          background-color: rgb(98, 175, 237);
          opacity: 1;
        }
        /* play button triangle */
        .lvo-playbtn:before {
          content: '';
          border-style: solid;
          border-width: 11px 0 11px 19px;
          border-color: transparent transparent transparent #fff;
        }
        .lvo-playbtn,
        .lvo-playbtn:before {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate3d(-50%, -50%, 0);
        }

        /* Post-click styles */
        .lvo-activated {
          cursor: unset;
        }

        #frame.lvo-activated::before,
        .lvo-activated .lvo-playbtn {
          display: none;
        }
      </style>
      <div id="frame">
        <picture>
          <source id="webpPlaceholder" type="image/webp">
          <source id="jpegPlaceholder" type="image/jpeg">
          <img id="fallbackPlaceholder"
               referrerpolicy="origin"
               width="1100"
               height="619"
               decoding="async"
               loading="lazy">
        </picture>
        <button class="lvo-playbtn"></button>
      </div>
    `
		this.domRefFrame = this.shadowRoot!.querySelector('#frame')!
		this.domRefImg = {
			fallback: this.shadowRoot!.querySelector(
				'#fallbackPlaceholder',
			) as HTMLImageElement,
			webp: this.shadowRoot!.querySelector(
				'#webpPlaceholder',
			) as HTMLSourceElement,
			jpeg: this.shadowRoot!.querySelector(
				'#jpegPlaceholder',
			) as HTMLSourceElement,
		}
		this.domRefPlayButton = this.shadowRoot!.querySelector('.lvo-playbtn')!
	}

	/**
	 * Parse our attributes and fire up some placeholders
	 */
	private setupComponent() {
		this.initImagePlaceholder()
		this.domRefPlayButton.setAttribute(
			'aria-label',
			`${this.videoPlay}: ${this.videoTitle}`,
		)
		this.setAttribute('title', `${this.videoPlay}: ${this.videoTitle}`)
		if (this.autoLoad) {
			this.initIntersectionObserver()
		}
	}

	/**
	 * Lifecycle method that we use to listen for attribute changes
	 */
	attributeChangedCallback(name: string, oldVal: string, newVal: string) {
		switch (name) {
			case 'videoid': {
				if (oldVal !== newVal) {
					this.setupComponent()
					// if we have a previous iframe, remove it and the activated class
					if (this.domRefFrame.classList.contains('lvo-activated')) {
						this.domRefFrame.classList.remove('lvo-activated')
						this.shadowRoot!.querySelector('iframe')?.remove()
					}
				}
				break
			}
		}
	}

	/**
	 * Inject the iframe into the component body
	 */
	private addIframe() {
		if (!this.iframeLoaded) {
			const srcUrl = new URL(`https://player.vimeo.com/video/${this.videoId}`)
			srcUrl.searchParams.set('dnt', '1')
			if (this.autoLoad && this.autoPlay) {
				srcUrl.searchParams.set('autoplay', '1')
			}
			if (this.muted) {
				srcUrl.searchParams.set('muted', '1')
			}
			if (this.loop) {
				srcUrl.searchParams.set('loop', '1')
			}
			if (this.videoHash) {
				srcUrl.searchParams.set('h', this.videoHash)
			}
			if (this.videoStartAt) {
				srcUrl.hash = `t=${this.videoStartAt}`
			}

			const iframeHTML = `
<iframe frameborder="0"
  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
  allowfullscreen src="${srcUrl}"></iframe>`
			this.domRefFrame.insertAdjacentHTML('beforeend', iframeHTML)
			this.domRefFrame.classList.add('lvo-activated')
			this.iframeLoaded = true
		}
	}

	/**
	 * Setup the placeholder image for the component using Vimeo oEmbed API
	 */
	private async initImagePlaceholder() {
		try {
			// Warm the connection to Vimeo CDN
			LiteVimeoEmbed.addPrefetch('preconnect', 'https://i.vimeocdn.com/')

			// Use Vimeo oEmbed API to get video information
			const apiUrl = `https://vimeo.com/api/oembed.json?url=https://vimeo.com/${this.videoId}`

			// Fetch video data from Vimeo API
			const response = await fetch(apiUrl)
			if (!response.ok) {
				throw new Error(`Vimeo API error: ${response.status}`)
			}

			const apiResponse = (await response.json()) as VimeoOEmbedResponse

			// Use the thumbnail URL directly from the API
			const thumbnailUrl = apiResponse.thumbnail_url

			// Vimeo provides high-quality thumbnails, we can construct WebP and JPEG versions
			// Extract the base URL and parameters
			const thumbUrl = new URL(thumbnailUrl)

			// Create high-quality versions
			const posterUrlJpeg = thumbnailUrl
			// Vimeo may support WebP, try to get it by changing extension or use JPEG as fallback
			const posterUrlWebp = thumbnailUrl.replace(/\.jpe?g/, '.webp')

			this.domRefImg.webp.srcset = posterUrlWebp
			this.domRefImg.jpeg.srcset = posterUrlJpeg
			this.domRefImg.fallback.src = posterUrlJpeg
			this.domRefImg.fallback.setAttribute(
				'aria-label',
				`${this.videoPlay}: ${apiResponse.title || this.videoTitle}`,
			)
			this.domRefImg.fallback.setAttribute(
				'alt',
				`${this.videoPlay}: ${apiResponse.title || this.videoTitle}`,
			)

			// Update title if not set
			if (!this.hasAttribute('videotitle') && apiResponse.title) {
				this.videoTitle = apiResponse.title
			}
		} catch (error) {
			console.error('Failed to load Vimeo thumbnail:', error)
			// Fallback to a solid color background if API fails
			this.domRefImg.fallback.style.backgroundColor = '#000'
		}
	}

	/**
	 * Setup the Intersection Observer to load the iframe when scrolled into view
	 */
	private initIntersectionObserver() {
		if (
			'IntersectionObserver' in window &&
			'IntersectionObserverEntry' in window
		) {
			const options = {
				root: null,
				rootMargin: '0px',
				threshold: 0,
			}

			const observer = new IntersectionObserver((entries, observer) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting && !this.iframeLoaded) {
						LiteVimeoEmbed.warmConnections()
						this.addIframe()
						observer.unobserve(this)
					}
				})
			}, options)

			observer.observe(this)
		}
	}

	/**
	 * Add a <link rel={preload | preconnect} ...> to the head
	 */
	private static addPrefetch(kind: string, url: string, as?: string) {
		const linkElem = document.createElement('link')
		linkElem.rel = kind
		linkElem.href = url
		if (as) {
			linkElem.as = as
		}
		linkElem.crossOrigin = 'true'
		document.head.append(linkElem)
	}

	/**
	 * Begin preconnecting to warm up the iframe load
	 */
	static warmConnections() {
		if (LiteVimeoEmbed.preconnected) return

		// Host that Vimeo uses to serve JS needed by player
		LiteVimeoEmbed.addPrefetch('preconnect', 'https://f.vimeocdn.com')
		// The iframe document comes from player.vimeo.com
		LiteVimeoEmbed.addPrefetch('preconnect', 'https://player.vimeo.com')
		// Image for placeholder comes from i.vimeocdn.com
		LiteVimeoEmbed.addPrefetch('preconnect', 'https://i.vimeocdn.com')

		LiteVimeoEmbed.preconnected = true
	}
}

// Register custom element
customElements.define('lite-vimeo', LiteVimeoEmbed)
