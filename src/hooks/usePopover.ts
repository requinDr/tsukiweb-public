import { autoUpdate, flip, useFloating, useFocus, useHover, useInteractions, offset, shift } from "@floating-ui/react"
import { useState } from "react"

const FLOATING_MIDDLEWARE = [flip(), shift(), offset(8)]
export const usePopover = () => {
	const [isOpen, setIsOpen] = useState(false)
	const { refs, floatingStyles, context } = useFloating({
		placement: "right",
		whileElementsMounted: autoUpdate,
		open: isOpen,
		onOpenChange: setIsOpen,
		middleware: FLOATING_MIDDLEWARE
	})
	const hover = useHover(context, {
		delay: { open: 200, close: 50 },
	})
	const focus = useFocus(context)
	const { getReferenceProps } = useInteractions([hover, focus])

	return { isOpen, setIsOpen, refs, floatingStyles, context, getReferenceProps }
}