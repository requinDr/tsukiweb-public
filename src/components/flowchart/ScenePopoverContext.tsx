import { createContext, useContext, useState, useCallback, useRef, ReactNode, useMemo } from "react"
import { autoUpdate, flip, useFloating, offset, shift } from "@floating-ui/react"
import { createPortal } from "react-dom"
import * as m from "motion/react-m"
import { AnimatePresence } from "motion/react"
import { FcNode } from "utils/flowchart"
import ScenePopover from "./ScenePopover"

const FLOATING_MIDDLEWARE = [flip(), shift(), offset(8)]

type ScenePopoverActionsType = {
	openPopover: (node: FcNode, element: Element) => void
	closePopover: () => void
	closePopoverIfNode: (nodeId: string) => void
	togglePopover: (node: FcNode, element: Element) => void
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
	const [currentNode, setCurrentNode] = useState<FcNode | null>(null)
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

	const openPopover = useCallback((node: FcNode, element: Element) => {
		refs.setReference(element)
		currentNodeIdRef.current = node.id
		setCurrentNode(node)
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

	const togglePopover = useCallback((node: FcNode, element: Element) => {
		if (currentNodeIdRef.current === node.id) {
			closePopover()
		} else {
			openPopover(node, element)
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
				<AnimatePresence>
					{currentNode && (
						<div
							className="scene-popover-container"
							ref={refs.setFloating}
							style={floatingStyles}
							id="scene-popover"
						>
							<m.div
								className="scene-popover"
								initial={{ opacity: 0, y: -4 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: 4 }}
								transition={{ type: "tween", duration: 0.15 }}
							>
								<ScenePopover node={currentNode} />
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
export const useScenePopoverTrigger = (node: FcNode) => {
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
				openPopover(node, elementRef.current)
			}
		}, HOVER_DELAY_OPEN)
	}, [node, openPopover, clearTimeouts])

	const handleMouseLeave = useCallback(() => {
		clearTimeouts()
		closeTimeoutRef.current = setTimeout(() => {
			closePopoverIfNode(node.id)
		}, HOVER_DELAY_CLOSE)
	}, [node.id, closePopoverIfNode, clearTimeouts])

	const handleFocus = useCallback((e: React.FocusEvent) => {
		elementRef.current = e.currentTarget
		clearTimeouts()
		openPopover(node, e.currentTarget)
	}, [node, openPopover, clearTimeouts])

	const handleBlur = useCallback(() => {
		clearTimeouts()
		closeTimeoutRef.current = setTimeout(() => {
			closePopoverIfNode(node.id)
		}, HOVER_DELAY_CLOSE)
	}, [node.id, closePopoverIfNode, clearTimeouts])

	const handleContextMenu = useCallback((e: React.MouseEvent) => {
		e.preventDefault()
		togglePopover(node, e.currentTarget)
	}, [node, togglePopover])

	const setRef = useCallback((el: SVGGElement | null) => {
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
