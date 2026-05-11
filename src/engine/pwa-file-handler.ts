import { dialog } from "@tsukiweb-common/ui-core/components/ModalPrompt"
import { strings } from "../translation/lang"
import { toast } from "react-toastify"
import { importGameDataFromJSON } from "./settings"


export async function importGameDataFromFile(file: File): Promise<void> {
	const confirmText = (strings.config as Record<string, any>)?.["file-import-confirm"]?.replace?.('%0', file.name) 
		?? `Import data from "${file.name}"? This will replace your current saves and settings.`
	
	const confirmed = await dialog.confirm({
		text: confirmText,
		labelYes: strings.config["data-import"] ?? "Import",
		labelNo: strings.no ?? "Cancel",
	})

	if (!confirmed) return

	try {
		const text = await file.text()
		const json = JSON.parse(text)
		await importGameDataFromJSON(json)
		
		toast.success(strings.game?.["toast-load"] ?? "Data loaded successfully")
	} catch (error) {
		console.error('Failed to import game data:', error)
		const errorText = (strings.config as Record<string, any>)?.["file-import-error"] ?? "Failed to import data"
		toast.error(errorText)
	}
}
