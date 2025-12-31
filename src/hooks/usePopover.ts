import { autoUpdate, flip, useFloating, useHover, useInteractions } from "@floating-ui/react"
import { useState } from "react"

const FLOATING_MIDDLEWARE = [flip()]
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
	const { getReferenceProps } = useInteractions([hover])

	return { isOpen, setIsOpen, refs, floatingStyles, context, getReferenceProps }
}