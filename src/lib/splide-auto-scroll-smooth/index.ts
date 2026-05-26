/**
 * Modified AutoScroll Extension for Splide
 * Based on @splidejs/splide-extension-auto-scroll v0.5.3
 * 
 * Enhancement: Gradual speed reduction on hover instead of immediate stop
 */

const CLASS_ACTIVE = 'is-active'
const SLIDE = 'slide'
const FADE = 'fade'

const EVENT_MOVE = 'move'
const EVENT_DRAG = 'drag'
const EVENT_SCROLL = 'scroll'
const EVENT_MOVED = 'moved'
const EVENT_DRAGGED = 'dragged'
const EVENT_SCROLLED = 'scrolled'
const EVENT_UPDATED = 'updated'

interface AutoScrollOptions {
	speed: number
	autoStart: boolean
	pauseOnHover: boolean
	pauseOnFocus: boolean
	rewind?: boolean
	useToggleButton?: boolean
	slowdownDuration?: number // NEW: Duration for gradual slowdown (ms)
}

const DEFAULTS: AutoScrollOptions = {
	speed: 1,
	autoStart: true,
	pauseOnHover: true,
	pauseOnFocus: true,
	slowdownDuration: 1000, // NEW: 1 second gradual slowdown
}

const I18N = {
	startScroll: 'Start auto scroll',
	pauseScroll: 'Pause auto scroll',
}

// Helper functions
const { min, max, abs } = Math

function clamp(number: number, x: number, y: number): number {
	const minimum = min(x, y)
	const maximum = max(x, y)
	return min(max(minimum, number), maximum)
}

function RequestInterval(interval: number, onInterval: () => void) {
	const now = Date.now
	let startTime: number
	let rate = 0
	let paused = true

	function update() {
		if (!paused) {
			rate = interval ? min((now() - startTime) / interval, 1) : 1

			if (rate >= 1) {
				onInterval()
				startTime = now()
			}

			requestAnimationFrame(update)
		}
	}

	function start(resume: boolean) {
		startTime = now() - (resume ? rate * interval : 0)
		paused = false
		requestAnimationFrame(update)
	}

	function pause() {
		paused = true
	}

	function isPaused() {
		return paused
	}

	return {
		start,
		pause,
		isPaused,
	}
}

function Throttle(func: () => void, duration: number) {
	let interval: ReturnType<typeof RequestInterval> | null

	function throttled() {
		if (!interval) {
			interval = RequestInterval(duration || 0, function () {
				func()
				interval = null
			})
			interval.start(false)
		}
	}

	return throttled
}

export function AutoScroll(Splide2: any, Components2: any, options: any) {
	const { root } = Splide2
	const { translate, getPosition, toIndex, getLimit } = Components2.Move
	const { setIndex, getIndex } = Components2.Controller
	const { orient } = Components2.Direction
	const { toggle } = Components2.Elements
	const { Live } = Components2
	const { on, off, bind, unbind } = Splide2.event

	const throttledUpdateArrows = Throttle(Components2.Arrows.update, 500)

	let autoScrollOptions: AutoScrollOptions = {} as AutoScrollOptions
	let interval: ReturnType<typeof RequestInterval> | null = null
	let stopped = false
	let hovered = false
	let focused = false
	let busy = false
	let currPosition: number | undefined

	// NEW: Speed modulation for smooth transitions
	let targetSpeedMultiplier = 1.0 // Target speed (0.0 to 1.0)
	let currentSpeedMultiplier = 1.0 // Current speed (smoothly interpolated)
	let slowdownStartTime = 0
	let startSpeedMultiplier = 1.0 // Speed at the start of transition

	function setup() {
		const { autoScroll } = options
		autoScrollOptions = Object.assign({}, DEFAULTS, typeof autoScroll === 'object' ? autoScroll : {})
	}

	function mount() {
		if (!Splide2.is(FADE)) {
			if (!interval && options.autoScroll !== false) {
				interval = RequestInterval(0, move)
				listen()
				autoStart()
			}
		}
	}

	function destroy() {
		if (interval) {
			interval.pause()
			interval = null
			currPosition = undefined
			off([EVENT_MOVE, EVENT_DRAG, EVENT_SCROLL, EVENT_MOVED, EVENT_SCROLLED])
			unbind(root, 'mouseenter mouseleave focusin focusout')
			if (toggle) {
				unbind(toggle, 'click')
			}
		}
	}

	function listen() {
		if (autoScrollOptions.pauseOnHover) {
			bind(root, 'mouseenter mouseleave', (e: MouseEvent) => {
				hovered = e.type === 'mouseenter'
				autoToggle()
			})
		}

		if (autoScrollOptions.pauseOnFocus) {
			bind(root, 'focusin focusout', (e: FocusEvent) => {
				focused = e.type === 'focusin'
				autoToggle()
			})
		}

		if (autoScrollOptions.useToggleButton && toggle) {
			bind(toggle, 'click', () => {
				stopped ? play() : pause()
			})
		}

		on(EVENT_UPDATED, update)
		on([EVENT_MOVE, EVENT_DRAG, EVENT_SCROLL], () => {
			busy = true
			pause(false)
		})
		on([EVENT_MOVED, EVENT_DRAGGED, EVENT_SCROLLED], () => {
			busy = false
			autoToggle()
		})
	}

	function update() {
		const { autoScroll } = options
		if (autoScroll !== false) {
			autoScrollOptions = Object.assign({}, autoScrollOptions, typeof autoScroll === 'object' ? autoScroll : {})
			mount()
		} else {
			destroy()
		}

		if (interval && currPosition !== undefined) {
			translate(currPosition)
		}
	}

	function autoStart() {
		if (autoScrollOptions.autoStart) {
			if (document.readyState === 'complete') {
				play()
			} else {
				bind(window, 'load', play)
			}
		}
	}

	function play() {
		if (isPaused()) {
			interval?.start(true)
			Live.disable(true)
			focused = hovered = stopped = false
			targetSpeedMultiplier = 1.0 // Resume to full speed
			updateButton()
		}
	}

	function pause(stop = true) {
		if (!stopped) {
			stopped = stop
			updateButton()
			if (!isPaused()) {
				interval?.pause()
				Live.disable(false)
			}
		}
	}

	// MODIFIED: Smooth speed transitions instead of immediate pause
	function autoToggle() {
		if (!stopped) {
			if (hovered || focused || busy) {
				// Gradually slow down
				if (targetSpeedMultiplier !== 0.0) {
					startSpeedMultiplier = currentSpeedMultiplier
					targetSpeedMultiplier = 0.0
					slowdownStartTime = Date.now()
				}
			} else {
				// Gradually speed up
				if (targetSpeedMultiplier !== 1.0) {
					startSpeedMultiplier = currentSpeedMultiplier
					targetSpeedMultiplier = 1.0
					slowdownStartTime = Date.now()
				}
				// Restart interval if it was paused (e.g., after drag)
				if (isPaused() && interval) {
					interval.start(true)
					Live.disable(true)
				}
			}
		}
	}

	// MODIFIED: Apply gradual speed changes
	function move() {
		// Smoothly interpolate speed
		if (currentSpeedMultiplier !== targetSpeedMultiplier) {
			const elapsed = Date.now() - slowdownStartTime
			const duration = autoScrollOptions.slowdownDuration || 1000
			const progress = min(elapsed / duration, 1)

			// Ease-out quad for smooth deceleration/acceleration
			const eased = 1 - (1 - progress) * (1 - progress)

			// Lerp from current starting speed to target speed
			currentSpeedMultiplier = startSpeedMultiplier + (targetSpeedMultiplier - startSpeedMultiplier) * eased

			// Snap to target when complete
			if (progress >= 1) {
				currentSpeedMultiplier = targetSpeedMultiplier
			}
		}

		// Even at 0 speed, keep updating (just don't move)
		const position = getPosition()
		const destination = computeDestination(position)

		if (position !== destination && currentSpeedMultiplier > 0.001) {
			translate(destination)
			updateIndex((currPosition = getPosition()))
		} else if (currentSpeedMultiplier <= 0.001 && !hovered && !focused && !busy) {
			// Rewind logic only when fully stopped and not hovering
			if (autoScrollOptions.rewind) {
				Splide2.go(autoScrollOptions.speed > 0 ? 0 : Components2.Controller.getEnd())
			}
		}

		throttledUpdateArrows()
	}

	function computeDestination(position: number): number {
		const baseSpeed = autoScrollOptions.speed || 1
		// Apply the smooth speed multiplier
		const speed = baseSpeed * currentSpeedMultiplier
		position += orient(speed)

		if (Splide2.is(SLIDE)) {
			position = clamp(position, getLimit(false), getLimit(true))
		}

		return position
	}

	function updateIndex(position: number) {
		const { length } = Splide2
		const index = (toIndex(position) + length) % length

		if (index !== getIndex()) {
			setIndex(index)
			Components2.Slides.update()
			Components2.Pagination.update()
			if (options.lazyLoad === 'nearby') {
				Components2.LazyLoad?.check()
			}
		}
	}

	function updateButton() {
		if (toggle) {
			const key = stopped ? 'startScroll' : 'pauseScroll'
			toggle.classList.toggle(CLASS_ACTIVE, !stopped)
			toggle.setAttribute('aria-label', options.i18n?.[key] || I18N[key])
		}
	}

	function isPaused(): boolean {
		return !interval || interval.isPaused()
	}

	return {
		setup,
		mount,
		destroy,
		play,
		pause,
		isPaused,
	}
}
