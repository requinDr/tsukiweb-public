import { memo, useEffect, useRef } from "react"
import styles from "./particles.module.scss"

const PARTICLE_COUNT = 40
const PARTICLE_BASE_SIZE = 3
const COLOR = "153, 255, 255"
const MOUSE_RADIUS = 100
const MOUSE_RADIUS_SQ = MOUSE_RADIUS * MOUSE_RADIUS

interface Particle {
	x: number; y: number; vx: number; vy: number;
	baseSize: number; life: number; vLife: number;
}

/**
 * Interactive particles that react to the mouse
 */
const Particles = () => {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const pointer = useRef({ x: -1000, y: -1000 })
	const particles = useRef<Particle[]>([])
	const dimensions = useRef({ width: 0, height: 0 })
	const raf = useRef<number>(0)

	useEffect(() => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

		const canvas = canvasRef.current
		if (!canvas) return
		const ctx = canvas.getContext("2d", { alpha: true })
		if (!ctx) return

		const initParticle = (first = false): Particle => ({
			x: Math.random() * dimensions.current.width,
			y: dimensions.current.height + (first ? Math.random() * 600 : 20),
			vx: (Math.random() - 0.5) * 0.4,
			vy: -(Math.random() * 0.4 + 0.2),
			baseSize: Math.random() * PARTICLE_BASE_SIZE + 1,
			life: 0,
			vLife: 0.001 + Math.random() * 0.002,
		})

		const resize = () => {
			const dpr = Math.min(window.devicePixelRatio || 1, 2)
			const rect = canvas.getBoundingClientRect()
			dimensions.current.width = rect.width
			dimensions.current.height = rect.height
			canvas.width = Math.floor(rect.width * dpr)
			canvas.height = Math.floor(rect.height * dpr)
			ctx.setTransform(1, 0, 0, 1, 0, 0)
			ctx.scale(dpr, dpr)
			particles.current = Array.from({ length: PARTICLE_COUNT }, () => initParticle(true))
		}

		const onPointerMove = (e: PointerEvent) => {
			pointer.current.x = e.clientX
			pointer.current.y = e.clientY
		}

		resize()
		window.addEventListener("resize", resize, { passive: true })
		window.addEventListener("pointermove", onPointerMove, { passive: true })

		const draw = () => {
			ctx.clearRect(0, 0, dimensions.current.width, dimensions.current.height)
			ctx.fillStyle = `rgb(${COLOR})`

			for (let i = 0; i < particles.current.length; i++) {
				const p = particles.current[i]
				const dx = pointer.current.x - p.x
				const dy = pointer.current.y - p.y
				const distSq = dx * dx + dy * dy

				if (distSq < MOUSE_RADIUS_SQ) {
					const force = (MOUSE_RADIUS - Math.sqrt(distSq)) / MOUSE_RADIUS
					p.x -= dx * force * 0.05
					p.y -= dy * force * 0.05
				}

				p.x += p.vx
				p.y += p.vy
				p.life += p.vLife

				if (p.y < -20 || p.life > 1) {
					particles.current[i] = initParticle()
					continue
				}

				let alpha = 1
				if (p.life < 0.1) alpha = p.life / 0.1
				else if (p.life > 0.8) alpha = 1 - (p.life - 0.8) / 0.2

				const size = p.baseSize * (Math.sin(p.life * 10) * 0.4 + 1)

				ctx.globalAlpha = Math.max(0, alpha * 0.3)
				ctx.beginPath()
				ctx.arc(p.x, p.y, size, 0, Math.PI * 2)
				ctx.fill()
			}

			ctx.globalAlpha = 1
			raf.current = requestAnimationFrame(draw)
		}

		raf.current = requestAnimationFrame(draw)

		return () => {
			cancelAnimationFrame(raf.current)
			window.removeEventListener("resize", resize)
			window.removeEventListener("pointermove", onPointerMove)
		}
	}, [])

	return <canvas ref={canvasRef} className={styles.particles} />
}

export default memo(Particles)