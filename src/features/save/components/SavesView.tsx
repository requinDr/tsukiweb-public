import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import SaveListItem from "./SaveListItem"
import { cachedFormat } from "@tsukiweb/common/utils/intl"
import SaveDetails from "./SaveDetails"
import { MdAddCircleOutline, MdWarning } from "react-icons/md"
import { dialog } from "@tsukiweb/common/ui-core/components/ModalPrompt"
import classNames from "classnames"
import { useVirtualizer } from "@tanstack/react-virtual"
import { history } from "engine/history"
import { computeSaveHash, exportGameData, settings } from "engine/settings"
import { useObserver } from "@tsukiweb/common/utils/Observer"
import { Button, PageLayout, PageSection } from "@tsukiweb/common/ui-core"
import { QUICK_SAVE_ID, SaveState, compareSaveStates, savesManager } from "engine/savestates";
import { getLocale, useStrings } from "translation/lang";
import { audio } from "engine/audio";
import { SCREEN, displayMode } from "app/utils/display";


const SAVE_ACTION_ID = 1

type Props = {
	variant: "save"|"load",
	onBack: (saveLoaded: boolean)=>void,
}
const SavesView = ({variant, onBack}: Props) => {
	const strings = useStrings()
	const [saves, setSaves] = useState<Array<SaveState>>([])
	const [focusedId, setFocusedSave] = useState<number>()
	const parentRef = useRef<HTMLElement>(null)
	const focusedIdRef = useRef(focusedId)

	useEffect(() => { focusedIdRef.current = focusedId }, [focusedId])

	useEffect(()=> {
		const onChange = ()=> {
			setSaves(
				savesManager.listSaves()
				.filter(ss => variant === "load" || ss.id !== QUICK_SAVE_ID)
				.sort(compareSaveStates))
		}
		savesManager.addListener(onChange)
		onChange()
		return () => savesManager.removeListener(onChange)
	}, [variant])

	function createSave(name?: string) {
		const ss = history.createSaveState()
		if (name) ss.name = name
		savesManager.add(ss)
	}

	async function onSaveSelect(id: number) {
		const save = savesManager.get(id)!
		if (variant == "save") {
			const confirmed = await dialog.confirm({
				text: strings.saves["overwrite-warning"],
				labelYes: strings.yes,
				labelNo: strings.no,
			})
			if (confirmed) {
				savesManager.remove(id)
				createSave(save.name)
			}
		} else {
			history.loadSaveState(save)
			displayMode.screen = SCREEN.WINDOW
			onBack(true)
		}
	}

	const handleDeleteSave = useCallback(async (id: number) => {
		const confirmed = await dialog.confirm({
			text: strings.saves["delete-warning"],
			labelYes: strings.yes,
			labelNo: strings.no,
			color: "#ab0000"
		})
		if (confirmed) {
			savesManager.remove(id)
			if (id == focusedId) setFocusedSave(undefined)
		}
	}, [focusedId])

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Delete" && focusedIdRef.current !== undefined) {
				handleDeleteSave(focusedIdRef.current)
			}
		}
		window.addEventListener("keydown", onKeyDown)
		return () => window.removeEventListener("keydown", onKeyDown)
	}, [handleDeleteSave])

	const focusedSave = focusedId != undefined ? savesManager.get(focusedId) : undefined
	const title = strings.saves[variant == "save" ? "title-save" : "title-load"]

	const focusHandlers = (id?: number) => ({
		onFocus: () => setFocusedSave(id),
		onPointerEnter: () => setFocusedSave(id),
		onMouseEnter: () => setFocusedSave(id),
		onMouseLeave: () => setFocusedSave(undefined)
	})

	return (
		<PageLayout
			id="saves-layout"
			variant="master-detail"
			title={title}
			onBack={() => onBack(false)}
			secondary={
				<SaveDetails
					id={focusedId}
					saveState={focusedSave}
					deleteSave={handleDeleteSave}
				/>
			}
			actions={<ExportWarning />}
			audio={audio}
		>
			<PageSection className="saves" ref={parentRef}>
				{variant === "save" &&
					<Button
						onClick={createSave.bind(null, undefined)}
						className={classNames("create", {active: focusedId === SAVE_ACTION_ID})}
						{...focusHandlers(SAVE_ACTION_ID)}
						nav-auto={1}
					>
						<MdAddCircleOutline aria-hidden /> {strings.saves.create}
					</Button>
				}

				<SavesList
					onSaveSelect={onSaveSelect}
					focusedId={focusedId}
					setFocusedSave={setFocusedSave}
					parentRef={parentRef}
					saves={saves}
				/>
			</PageSection>
		</PageLayout>
	)
}

export default SavesView


type SavesListProps = {
	onSaveSelect: (id: number)=>void,
	focusedId?: number,
	setFocusedSave: (id: number)=>void,
	parentRef: React.RefObject<HTMLElement | null>,
	saves: Array<SaveState>,
}
type ListEntry =
	| { type: "day", label: string }
	| { type: "save", save: SaveState, navIndex: number }

const relativeDayFormat = cachedFormat(locale =>
	new Intl.RelativeTimeFormat(locale, {numeric: "auto"}))
const dayFormat = cachedFormat(locale =>
	new Intl.DateTimeFormat(locale, {day: "numeric", month: "long"}))
const dayYearFormat = cachedFormat(locale =>
	new Intl.DateTimeFormat(locale, {day: "numeric", month: "long", year: "numeric"}))

function dayLabel(date: Date, locale: string) {
	const today = new Date()
	const days = Math.round((new Date(today.toDateString()).getTime() - new Date(date.toDateString()).getTime()) / 86400000)
	if (days == 0 || days == 1) {
		const label = relativeDayFormat(locale).format(-days, "day")
		return label.charAt(0).toLocaleUpperCase(locale) + label.slice(1)
	}
	const format = date.getFullYear() != today.getFullYear() ? dayYearFormat : dayFormat
	return format(locale).format(date)
}

function groupByDay(saves: SaveState[], locale: string): ListEntry[] {
	const entries: ListEntry[] = []
	let lastDay: string | undefined
	saves.forEach((save, navIndex) => {
		if (save.id !== QUICK_SAVE_ID) {
			const date = new Date(save.date as number)
			const day = date.toDateString()
			if (day != lastDay) {
				entries.push({type: "day", label: dayLabel(date, locale)})
				lastDay = day
			}
		}
		entries.push({type: "save", save, navIndex})
	})
	return entries
}

const SavesList = ({onSaveSelect, focusedId, setFocusedSave, parentRef, saves}: SavesListProps) => {
	const locale = getLocale()
	const entries = useMemo(() => groupByDay(saves, locale), [saves, locale])
	const rowVirtualizer = useVirtualizer({
		count: entries.length,
		getScrollElement: () => parentRef.current,
		estimateSize: (i) => (entries[i].type == "day" ? 2 : 7) * parseFloat(getComputedStyle(document.documentElement).fontSize),
		overscan: 5,
	})

	return (
		<div
			className="virtual-list"
			style={{
				height: `${rowVirtualizer.getTotalSize()}px`,
			}}
		>
			{rowVirtualizer.getVirtualItems()
				.map(({index, start, key}) => {
				const entry = entries[index]
				const style = { transform: `translateY(${start}px)` }
				if (entry.type == "day") {
					return (
						<h3
							key={key}
							ref={rowVirtualizer.measureElement}
							data-index={index}
							className={classNames("saves-day", {first: index == 0})}
							style={style}
						>
							{entry.label}
						</h3>
					)
				}
				const ss = entry.save
				const saveId = ss.id ?? ss.date
				return (
					<SaveListItem
						key={key}
						ref={rowVirtualizer.measureElement}
						data-index={index}
						saveId={saveId}
						saveState={ss}
						onClick={onSaveSelect.bind(null, saveId)}
						isFocused={focusedId === saveId}
						onFocus={setFocusedSave.bind(null, saveId)}
						onPointerEnter={setFocusedSave.bind(null, saveId)}
						onMouseEnter={setFocusedSave.bind(null, saveId)}
						style={style}
						nav-y={entry.navIndex}
					/>
				)
			})}
		</div>
	)
}

const ExportWarning = () => {
	const strings = useStrings()
	const [displayWarning, setDisplayWarning] = useState<boolean>(false)
	const [modalShown, setModalShown] = useState<boolean>(false)

	useObserver(()=> {
		const delay = Date.now() - settings.lastFullExport.date
		if (savesManager.savesCount === 0) {
			setDisplayWarning(false)
		} else if (delay < settings.localStorageWarningDelay) {
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
		const confirmed = await dialog.confirm({
			text: <>
				{strings.saves["local-storage-warning"]}
				<div style={{marginTop: "1em", color: "var(--text-muted)"}}>
					{strings.menu.config} {">"} {strings.config["tab-advanced"]} {">"} {strings.config["data-export"]}
				</div>
			</>,
			labelYes: strings.config["data-export"],
			labelNo: strings.later
		})
		if (confirmed) {
			exportGameData()
		}
		setModalShown(false)
	}

	return (
		<Button
			className={classNames("warning-button", {"active": modalShown})}
			onClick={exportData}
			aria-label={strings.saves["local-storage-warning"]}
		>
			<svg aria-hidden="true" focusable="false" width="0" height="0" style={{position: "absolute"}}>
				<linearGradient id="gradient-vertical" x2="0" y2="1">
					<stop offset="0%" stopColor="var(--color-stop-1)" />
					<stop offset="50%" stopColor="var(--color-stop-2)" />
					<stop offset="100%" stopColor="var(--color-stop-3)" />
				</linearGradient>
			</svg>
			<MdWarning className="warning-icon" aria-hidden />
		</Button>
	)
}