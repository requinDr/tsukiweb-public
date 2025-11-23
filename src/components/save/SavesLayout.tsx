import { ChangeEvent, MouseEvent, useEffect, useRef, useState } from "react"
import { SCREEN, displayMode } from "../../utils/display"
import { SaveState, QUICK_SAVE_ID, savesManager } from "../../utils/savestates"
import { strings } from "../../translation/lang"
import { phaseTexts } from "../../translation/assets"
import SaveListItem from "./SaveListItem"
import SaveDetails from "./SaveDetails"
import { MdAddCircleOutline, MdUploadFile, MdWarning } from "react-icons/md"
import { modalPromptService } from "@tsukiweb-common/ui-core/components/ModalPrompt"
import classNames from "classnames"
import { noBb } from "@tsukiweb-common/utils/Bbcode"
import { useVirtualizer } from "@tanstack/react-virtual"
import { toast } from "react-toastify"
import history from "utils/history"
import { requestFilesFromUser } from "@tsukiweb-common/utils/utils"
import { SAVE_EXT } from "utils/constants"
import { computeSaveHash, exportGameData, settings } from "utils/settings"
import { useObserver } from "@tsukiweb-common/utils/Observer"
import { Button, TitleMenuButton, PageSection, PageTitle } from "@tsukiweb-common/ui-core"
import { audio } from "utils/audio"


//##############################################################################
//#                               TOOL FUNCTIONS                               #
//##############################################################################

// sort savestates quick save first, then from most recent to oldest
function compareSaveStates(ss1: SaveState, ss2: SaveState) {
	return ss1.id == QUICK_SAVE_ID ? -1 : ss2.id == QUICK_SAVE_ID ? 1
		: (ss2.date ?? 0) - (ss1.date ?? 0)
}

export function savePhaseTexts(saveState: SaveState) {
	const lastPage = saveState.pages.at(-1) as Exclude<SaveState['pages'][0], undefined>
	if (lastPage.phase) {
		const {route, routeDay, day} = lastPage.phase
		return phaseTexts(route, routeDay, day)?.map(noBb)
	} else {
		//TODO retrieve route, routeDay and day from SCENE_ATTRS
		return ["", ""]
	}
}


//##############################################################################
//#                               MAIN COMPONENT                               #
//##############################################################################

type Props = {
	variant: "save"|"load",
	back: (saveLoaded: boolean)=>void,
}
const SavesLayer = ({variant, back}: Props) => {
	const [saves, setSaves] = useState<Array<SaveState>>([])
	const [focusedId, setFocusedSave] = useState<number>()

	useEffect(()=> {
		const onChange = ()=> {
			setSaves(
				savesManager.listSaves()
				.filter((ss)=> variant === "load" || ss.id !== QUICK_SAVE_ID)
				.sort(compareSaveStates))
		}
		savesManager.addListener(onChange)
		onChange()
		return savesManager.removeListener.bind(savesManager, onChange)
	}, [variant])

	const parentRef = useRef<HTMLDivElement>(null)

	const rowVirtualizer = useVirtualizer({
		count: saves.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 110,
		overscan: 5,
	})

	function createSave(name?: string) {
		const ss = history.createSaveState()
		if (name)
			ss.name = name
		savesManager.add(ss)
	}

	async function importSaves(event: ChangeEvent|MouseEvent) {
		console.debug("import saves from file")
		let files = (event.target as HTMLInputElement)?.files
			?? await requestFilesFromUser({multiple: true, accept: `.${SAVE_EXT}`})
		if (files) {
			if (files instanceof File)
				files = [files]
			try {
				savesManager.importSaveFiles(files)
				toast.success(strings.game["toast-load"])
			} catch(error) {
				toast.error(strings.game["toast-load-fail"])
			}
		}
	}

	async function onSaveSelect(id: number) {
		if (variant == "save") {
			const confirmed = await modalPromptService.confirm({
				text: strings.saves["overwrite-warning"],
				labelYes: strings.yes,
				labelNo: strings.no,
			})
			if (confirmed) {
				const ss = savesManager.get(id)!
				savesManager.remove(id)
				createSave(ss.name)
			}
		} else {
			history.loadSaveState(savesManager.get(id)!)
			displayMode.screen = SCREEN.WINDOW
			back(true)
		}
	}

	async function deleteSave(id: number) {
		const confirmed = await modalPromptService.confirm({
			text: strings.saves["delete-warning"],
			labelYes: strings.yes,
			labelNo: strings.no,
		})
		if (confirmed) {
			savesManager.remove(id)
			if (id == focusedId)
				setFocusedSave(undefined)
		}
	}

	const focusedSave = focusedId != undefined ? savesManager.get(focusedId) : undefined
	const title = strings.saves[variant == "save" ? "title-save" : "title-load"]

	return (
		<main id="saves-layout">
			<PageTitle>{title}</PageTitle>
			<PageSection className="saves" ref={parentRef}>
				{variant === "save" ?
					<Button
						onClick={createSave.bind(null, undefined)}
						className={classNames("create", {active: focusedId === 1})}
						onFocus={setFocusedSave.bind(null, 1)}
						onPointerEnter={setFocusedSave.bind(null, 1)}
						onMouseEnter={setFocusedSave.bind(null, 1)}
						onMouseLeave={setFocusedSave.bind(null, undefined)}
					>
						<MdAddCircleOutline /> {strings.saves.create}
					</Button>
				:
					<Button
						onClick={importSaves}
						className={classNames("import", {active: focusedId === 2})}
						onFocus={setFocusedSave.bind(null, 2)}
						onPointerEnter={setFocusedSave.bind(null, 2)}
						onMouseEnter={setFocusedSave.bind(null, 2)}
						onMouseLeave={setFocusedSave.bind(null, undefined)}
					>
						<MdUploadFile /> {strings.saves.import}
					</Button>
				}

				<div
					className="virtual-list"
					style={{
						height: `${rowVirtualizer.getTotalSize()}px`,
					}}
				>
					{rowVirtualizer.getVirtualItems()
						.map(({index, start, key}) => {
						const ss = saves[index]
						const id = ss.id ?? ss.date
						return (
							<SaveListItem
								key={key}
								id={id}
								saveState={ss}
								onSelect={onSaveSelect}
								focusedSave={focusedId}
								buttonProps={{
									onFocus: setFocusedSave.bind(null, id),
									onPointerEnter: setFocusedSave.bind(null, id),
									onMouseEnter: setFocusedSave.bind(null, id),
									style: {
										transform: `translateY(${start}px)`,
									}
								}}
							/>
						)
					})}
				</div>
			</PageSection>

			<SaveDetails id={focusedId} saveState={focusedSave} deleteSave={deleteSave}/>
			
			<div className="save-buttons">
				<TitleMenuButton audio={audio} onClick={back.bind(null, false)} className="back-button">
					{`<<`} {strings.back}
				</TitleMenuButton>
				
				<ExportWarning />
			</div>
		</main>
	)
}

export default SavesLayer


const ExportWarning = () => {
	const [displayWarning, setDisplayWarning] = useState<boolean>(false)
	const [modalShown, setModalShown] = useState<boolean>(false)

	useObserver(()=> {
		const delay = Date.now() - settings.lastFullExport.date
		if (delay < settings.localStorageWarningDelay) {
			setDisplayWarning(false)
		} else {
			computeSaveHash().then(hash=> {
				setDisplayWarning(settings.lastFullExport.hash != hash)
			})
		}
	}, settings.lastFullExport, 'date')

	if (!displayWarning) {
		return null
	}

	const exportData = async () => {
		setModalShown(true)
		const confirmed = await modalPromptService.confirm({
			text: <>
				{strings.saves["local-storage-warning"]}
				<div style={{marginTop: "1em", color: "var(--text-muted)"}}>
					{strings.menu.config} {">"} {strings.config["tab-advanced"]} {">"} {strings.config["data-export"]}
				</div>
			</>,
			labelYes: strings.config["data-export"],
			labelNo: "Later"
		})
		if (confirmed) {
			exportGameData()
		}
		setModalShown(false)
	}

	return (
		<button className={classNames("warning-button", {"active": modalShown})} onClick={exportData}>
			<svg aria-hidden="true" focusable="false" className="gradient-icon" width="0" height="0">
				<linearGradient id="gradient-vertical" x2="0" y2="1">
					<stop offset="0%" stopColor="var(--color-stop-1)" />
					<stop offset="50%" stopColor="var(--color-stop-2)" />
					<stop offset="100%" stopColor="var(--color-stop-3)" />
				</linearGradient>
			</svg>
			<MdWarning className="warning-icon"/>
		</button>
	)
}