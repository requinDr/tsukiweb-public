import { useObserved } from "../../utils/Observer";

type BeforeInstallPromptEvent = Event & { prompt: ()=>Promise<{outcome: any}> }

let sync = {
  installPWAEvent: undefined as BeforeInstallPromptEvent|undefined
}
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault()
  sync.installPWAEvent = event as BeforeInstallPromptEvent;
})

async function installPWA() {
  if (!sync.installPWAEvent) {
    return
  }
  const result = await sync.installPWAEvent.prompt()
  if (result.outcome == "accepted")
    sync.installPWAEvent = undefined
}

function usePWA() {
	const [hasPWAcapability] = useObserved(sync, 'installPWAEvent', e=>e!=undefined)
	return {hasPWAcapability, installPWA}
}

export default usePWA