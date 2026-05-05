import { useEffect } from "react"

const REPEAT_DELAY = 400
const REPEAT_INTERVAL = 80
const STICK_DEADZONE = 0.5

type SynthKey = { key: string; code?: string }

// Standard Gamepad button index → synthesized keyboard event.
// Mapping mirrors src/utils/keybind.ts so the existing useKeyMap consumers
// (game inputs, menu navigation, per-screen Escape handlers) react with no
// further changes.
const BUTTON_KEYS: Record<number, SynthKey> = {
	0: { key: "Enter" },                 // A / Cross   — confirm
	1: { key: "Escape" },                // B / Circle  — back
	2: { key: "h" },                     // X / Square  — history
	3: { key: " ", code: "Space" },      // Y / Triangle — graphics
	4: { key: "PageUp" },                // LB / L1     — prev page
	5: { key: "PageDown" },              // RB / R1     — next page
	9: { key: "m" },                     // Start       — toggle menu
}

type Dir = "Up" | "Down" | "Left" | "Right"
const DIR_KEYS: Record<Dir, string> = {
	Up: "ArrowUp",
	Down: "ArrowDown",
	Left: "ArrowLeft",
	Right: "ArrowRight",
}

function isClickable(el: Element | null): el is HTMLElement {
	if (!(el instanceof HTMLElement)) return false
	const tag = el.tagName
	if (tag === "BUTTON" || tag === "A") return true
	if (el.getAttribute("role") === "button") return true
	return false
}

function dispatchKey(key: string, code: string, repeat: boolean) {
	document.dispatchEvent(
		new KeyboardEvent("keydown", {
			key,
			code,
			repeat,
			bubbles: true,
			cancelable: true,
		})
	)
}

// Browser default click-on-Enter doesn't fire for synthetic events, so
// handle confirm explicitly when the focused element is a leaf button.
function pressConfirm() {
	const focused = document.activeElement
	if (isClickable(focused)) focused.click()
	else dispatchKey("Enter", "Enter", false)
}

export function useGamepad() {
	useEffect(() => {
		let connectedCount = 0
		let raf = 0
		const prevButtons: boolean[] = []
		const prevDir: Record<Dir, boolean> = {
			Up: false, Down: false, Left: false, Right: false,
		}
		const dirNextRepeat: Record<Dir, number> = {
			Up: 0, Down: 0, Left: 0, Right: 0,
		}

		const tick = () => {
			const pads = navigator.getGamepads()
			for (const gp of pads) {
				if (!gp || !gp.connected) continue
				const now = performance.now()

				for (const idxStr in BUTTON_KEYS) {
					const idx = +idxStr
					const pressed = gp.buttons[idx]?.pressed ?? false
					if (pressed && !prevButtons[idx]) {
						if (idx === 0) pressConfirm()
						else {
							const { key, code } = BUTTON_KEYS[idx]
							dispatchKey(key, code ?? key, false)
						}
					}
					prevButtons[idx] = pressed
				}

				const ax = gp.axes[0] ?? 0
				const ay = gp.axes[1] ?? 0
				const dirState: Record<Dir, boolean> = {
					Up: (gp.buttons[12]?.pressed ?? false) || ay < -STICK_DEADZONE,
					Down: (gp.buttons[13]?.pressed ?? false) || ay > STICK_DEADZONE,
					Left: (gp.buttons[14]?.pressed ?? false) || ax < -STICK_DEADZONE,
					Right: (gp.buttons[15]?.pressed ?? false) || ax > STICK_DEADZONE,
				}
				for (const d of ["Up", "Down", "Left", "Right"] as Dir[]) {
					const k = DIR_KEYS[d]
					if (dirState[d]) {
						if (!prevDir[d]) {
							dispatchKey(k, k, false)
							dirNextRepeat[d] = now + REPEAT_DELAY
						} else if (now >= dirNextRepeat[d]) {
							dispatchKey(k, k, true)
							dirNextRepeat[d] = now + REPEAT_INTERVAL
						}
					}
					prevDir[d] = dirState[d]
				}

				break // only handle the first connected gamepad
			}
			raf = requestAnimationFrame(tick)
		}

		const startPolling = () => {
			if (raf) return
			raf = requestAnimationFrame(tick)
		}
		const stopPolling = () => {
			if (raf) cancelAnimationFrame(raf)
			raf = 0
		}

		const onConnect = () => {
			connectedCount++
			if (connectedCount === 1) startPolling()
		}
		const onDisconnect = () => {
			connectedCount = Math.max(0, connectedCount - 1)
			if (connectedCount === 0) stopPolling()
		}

		// A gamepad already plugged in before mount won't fire the connect
		// event; check now and start polling if any pad reports connected.
		const initial = navigator.getGamepads?.() ?? []
		for (const gp of initial) {
			if (gp?.connected) {
				connectedCount++
			}
		}
		if (connectedCount > 0) startPolling()

		window.addEventListener("gamepadconnected", onConnect)
		window.addEventListener("gamepaddisconnected", onDisconnect)
		return () => {
			window.removeEventListener("gamepadconnected", onConnect)
			window.removeEventListener("gamepaddisconnected", onDisconnect)
			stopPolling()
		}
	}, [])
}
