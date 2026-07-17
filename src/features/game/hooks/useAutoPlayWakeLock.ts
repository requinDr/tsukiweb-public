import { useEffect } from "react"
import { useEventState } from "@tsukiweb/common/hooks"
import { useWakeLock } from "@tsukiweb/common/hooks"
import { ScriptPlayer } from "engine/ScriptPlayer"

/**
 * Activates a screen wake lock for as long as auto play is running on `script`.
 */
export function useAutoPlayWakeLock(script: ScriptPlayer): void {
	const [isAutoPlaying, setIsAutoPlaying] = useEventState(script, 'autoPlayStart', 'autoPlayStop')

	useEffect(() => {
		setIsAutoPlaying(script.autoPlay)
	}, [script, setIsAutoPlaying])

	useWakeLock(isAutoPlaying)
}
