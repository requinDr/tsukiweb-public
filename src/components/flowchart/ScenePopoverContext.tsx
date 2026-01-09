import { createContext, useContext, useState, useCallback, useRef, ReactNode, useMemo } from "react"
import { autoUpdate, flip, useFloating, offset, shift } from "@floating-ui/react"
import { createPortal } from "react-dom"
import * as m from "motion/react-m"
import { AnimatePresence } from "motion/react"
import ScenePopover from "./ScenePopover"
import { SCENE_ATTRS } from "utils/constants"

const FLOATING_MIDDLEWARE = [flip(), shift(), offset(8)]

type ScenePopoverActionsType = {
	openPopover: (nodeId: string, element: Element) => void
	closePopover: () => void
	closePopoverIfNode: (nodeId: string) => void
	togglePopover: (nodeId: string, element: Element) => void
}

// Separate context for actions only (stable references, never causes re-renders)
const ScenePopoverActionsContext = createContext<ScenePopoverActionsType | null>(null)

let rootElement: HTMLElement | null = null
const getRootElement = () => {
	if (!rootElement) {
		rootElement = document.getElementById("root")
	}
	return rootElement!
}

type ProviderProps = {
	children: ReactNode
}

export const ScenePopoverProvider = ({ children }: ProviderProps) => {
	const [currentNode, setCurrentNode] = useState<string | null>(null)
	const currentNodeIdRef = useRef<string | null>(null)

	const { refs, floatingStyles } = useFloating({
		placement: "right",
		whileElementsMounted: (reference, floating, update) => 
			autoUpdate(reference, floating, update, {
				animationFrame: false,
				ancestorScroll: false,
				ancestorResize: false,
				elementResize: false,
				layoutShift: false,
			}),
		open: currentNode !== null,
		middleware: FLOATING_MIDDLEWARE
	})

	const openPopover = useCallback((nodeId: string, element: Element) => {
		refs.setReference(element)
		currentNodeIdRef.current = nodeId
		setCurrentNode(nodeId)
	}, [refs])

	const closePopover = useCallback(() => {
		currentNodeIdRef.current = null
		setCurrentNode(null)
	}, [])

	// Close only if the specified node is currently open
	const closePopoverIfNode = useCallback((nodeId: string) => {
		if (currentNodeIdRef.current === nodeId) {
			currentNodeIdRef.current = null
			setCurrentNode(null)
		}
	}, [])

	const togglePopover = useCallback((nodeId: string, element: Element) => {
		if (currentNodeIdRef.current === nodeId) {
			closePopover()
		} else {
			openPopover(nodeId, element)
		}
	}, [openPopover, closePopover])

	const actionsValue = useMemo(() => ({
		openPopover,
		closePopover,
		closePopoverIfNode,
		togglePopover,
	}), [openPopover, closePopover, closePopoverIfNode, togglePopover])

	return (
		<ScenePopoverActionsContext.Provider value={actionsValue}>
			{children}
			{createPortal(
				<AnimatePresence mode="wait">
					{currentNode && (
						<div
							className="scene-popover-container"
							ref={refs.setFloating}
							style={floatingStyles}
							id="scene-popover"
						>
							<m.div
								key={currentNode}
								className="scene-popover"
								initial={{ opacity: 0, y: 0 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: 6 }}
								transition={{ type: "tween", duration: 0.15 }}
							>
								<ScenePopover
									nodeId={currentNode}
									displayName={currentNode}
									graphics={SCENE_ATTRS.scenes[currentNode as keyof typeof SCENE_ATTRS.scenes]?.thumb}
								/>
							</m.div>
						</div>
					)}
				</AnimatePresence>,
				getRootElement()
			)}
		</ScenePopoverActionsContext.Provider>
	)
}

export const useScenePopover = () => {
	const context = useContext(ScenePopoverActionsContext)
	if (!context) {
		throw new Error("useScenePopover must be used within a ScenePopoverProvider")
	}
	return context
}

const HOVER_DELAY_OPEN = 200
const HOVER_DELAY_CLOSE = 50

/**
 * Hook to attach hover/focus behavior to a scene element.
 * Returns stable props to spread on the reference element.
 * Does NOT cause re-renders when popover state changes.
 */
export const useScenePopoverTrigger = (nodeId: string) => {
	const { openPopover, closePopoverIfNode, togglePopover } = useScenePopover()
	const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const elementRef = useRef<Element | null>(null)

	const clearTimeouts = useCallback(() => {
		if (hoverTimeoutRef.current) {
			clearTimeout(hoverTimeoutRef.current)
			hoverTimeoutRef.current = null
		}
		if (closeTimeoutRef.current) {
			clearTimeout(closeTimeoutRef.current)
			closeTimeoutRef.current = null
		}
	}, [])

	const handleMouseEnter = useCallback((e: React.MouseEvent) => {
		elementRef.current = e.currentTarget
		clearTimeouts()
		hoverTimeoutRef.current = setTimeout(() => {
			if (elementRef.current) {
				openPopover(nodeId, elementRef.current)
			}
		}, HOVER_DELAY_OPEN)
	}, [nodeId, openPopover, clearTimeouts])

	const handleMouseLeave = useCallback(() => {
		clearTimeouts()
		closeTimeoutRef.current = setTimeout(() => {
			closePopoverIfNode(nodeId)
		}, HOVER_DELAY_CLOSE)
	}, [nodeId, closePopoverIfNode, clearTimeouts])

	const handleFocus = useCallback((e: React.FocusEvent) => {
		elementRef.current = e.currentTarget
		clearTimeouts()
		openPopover(nodeId, e.currentTarget)
	}, [nodeId, openPopover, clearTimeouts])

	const handleBlur = useCallback(() => {
		clearTimeouts()
		closeTimeoutRef.current = setTimeout(() => {
			closePopoverIfNode(nodeId)
		}, HOVER_DELAY_CLOSE)
	}, [nodeId, closePopoverIfNode, clearTimeouts])

	const handleContextMenu = useCallback((e: React.MouseEvent) => {
		e.preventDefault()
		togglePopover(nodeId, e.currentTarget)
	}, [nodeId, togglePopover])

	const setRef = useCallback((el: HTMLElement | SVGGElement | null) => {
		elementRef.current = el
	}, [])

	return {
		ref: setRef,
		onMouseEnter: handleMouseEnter,
		onMouseLeave: handleMouseLeave,
		onFocus: handleFocus,
		onBlur: handleBlur,
		onContextMenu: handleContextMenu,
	}
}
