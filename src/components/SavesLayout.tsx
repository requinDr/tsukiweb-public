import { ChangeEvent, MouseEvent, useEffect, useState } from "react"
import { SCREEN, displayMode } from "../utils/display"
import { noBb } from "../utils/Bbcode"
import { SAVE_EXT } from "../utils/constants"
import { SaveState, QUICK_SAVE_ID, deleteSaveState, getSaveState, listSaveStates, loadSaveState, storeCurrentState, addSavesChangeListener, removeSavesChangeListener, loadSaveFiles } from "../utils/savestates"
import { strings } from "../translation/lang"
import { phaseTexts } from "../translation/assets"
import SaveListItem from "./save/SaveListItem"
import SaveDetails from "./save/SaveDetails"
import { MdAddCircleOutline, MdUploadFile } from "react-icons/md"
import MenuButton from "./atoms/MenuButton"

//##############################################################################
//#                               TOOL FUNCTIONS                               #
//##############################################################################

// sort savestates quick save first, then from most recent to oldest
function compareSaveStates([id1, ss1]: [number, SaveState], [id2, ss2]: [number, SaveState]) {
  return id1 == QUICK_SAVE_ID ? -1
      : id2 == QUICK_SAVE_ID ? 1
      : (ss2.date ?? 0) - (ss1.date ?? 0)
}

export function savePhaseTexts(saveState: SaveState) {
  const context = saveState.context
  const {route, routeDay, day} = context.phase || {}
  return phaseTexts(route ?? "", routeDay ?? "", day ?? 0).map(noBb)
}


//##############################################################################
//#                               MAIN COMPONENT                               #
//##############################################################################

type Props = {
  variant: "save"|"load",
  back: (saveLoaded: boolean)=>void,
}
const SavesLayer = ({variant, back}: Props) => {
  const [saves, setSaves] = useState<Array<[number,SaveState]>>([])
  const [focusedId, setFocusedSave] = useState<number>()

  useEffect(()=> {
    const onChange = ()=> {
      setSaves(listSaveStates().sort(compareSaveStates))
    }
    addSavesChangeListener(onChange)
    onChange()
    return removeSavesChangeListener.bind(null, onChange) as VoidFunction
  }, [])

  function createSave() {
    storeCurrentState(new Date().getTime())
  }

  function importSaves(event: ChangeEvent|MouseEvent) {
    console.debug("import saves from file")
    loadSaveFiles((event.target as HTMLInputElement)?.files, event.type == "contextmenu")
  }

  function onSaveSelect(id: number) {
    if (variant == "save") {
      if (confirm("Are you sure you want to overwrite this save?")) {
        /*
        storeCurrentState(id)
        /*/
        deleteSaveState(id)
        storeCurrentState(new Date().getTime())
        //*/
      }
    } else {
      loadSaveState(id)
      displayMode.screen = SCREEN.WINDOW
      back(true)
    }
  }

  function deleteSave(id: number) {
    if (confirm("Are you sure you want to delete this save?")) {
      deleteSaveState(id)
      if (id == focusedId)
        setFocusedSave(undefined)
    }
  }

  const focusedSave = focusedId != undefined ? getSaveState(focusedId) : undefined
  const title = strings.saves[variant == "save" ? "title-save" : "title-load"]

  return (
    <main id="saves-layout">
      <h2 className="page-title">{title}</h2>
      <div className="saves">
        {variant === "save" ?
          <button
            className={`save-container create ${focusedId === 1 ? "active" : ""}`}
            onClick={createSave}
            onFocus={setFocusedSave.bind(null, 1)}
            onPointerEnter={setFocusedSave.bind(null, 1)}
            onMouseEnter={setFocusedSave.bind(null, 1)}
            onMouseLeave={setFocusedSave.bind(null, undefined)}
          >
            <MdAddCircleOutline />
          </button>
        : <>
          <label htmlFor="import"
            className={`save-container import ${focusedId === 2 ? "active" : ""}`}
            tabIndex={0}
            onContextMenu={importSaves}
            onFocus={setFocusedSave.bind(null, 2)}
            onPointerEnter={setFocusedSave.bind(null, 2)}
            onMouseEnter={setFocusedSave.bind(null, 2)}
          >
            <MdUploadFile />
          </label>
          <input type="file" id="import" onChange={importSaves}
            onContextMenu={importSaves}
            accept={`.${SAVE_EXT}`} style={{display: "none"}}/>
        </>}

        {saves.filter(([id, _])=> variant === "load" || id !== QUICK_SAVE_ID)
          .map(([id, ss]) =>
          <SaveListItem key={id} id={id}
            saveState={ss} onSelect={onSaveSelect}
            focusedSave={focusedId}
            onFocus={setFocusedSave.bind(null, id)}
            onPointerEnter={setFocusedSave.bind(null, id)}
            onMouseEnter={setFocusedSave.bind(null, id)}
          />
        )}
      </div>

      <SaveDetails id={focusedId} saveState={focusedSave} deleteSave={deleteSave}/>
      <div className="save-buttons">
        <MenuButton onClick={back.bind(null, false)} className="back-button">
          {strings.back}
        </MenuButton>
      </div>
    </main>
  )
}

export default SavesLayer
