import { Dispatch, useState } from "react"
import { MdTranslate } from "react-icons/md"
import strings, { languages } from "../../utils/lang"
import MenuButton from "../atoms/MenuButton"
import Modal from "../atoms/Modal"
import { settings } from "../../utils/variables"
import { deepAssign } from "../../utils/utils"

const TranslationSwitch = () => {
  const [show, setShow] = useState<boolean>(false)
  return (
    <>
      <button
        className="action-icon" 
        aria-label="show information modal"
        onClick={()=>setShow(true)}>
        <MdTranslate />
      </button>
      <ModalInfo show={show} setShow={setShow} />
    </>
  )
}

export default TranslationSwitch


type ModalInfoProps = {
  show: boolean
  setShow: Dispatch<boolean>
}
const ModalInfo = ({show, setShow}: ModalInfoProps) => {
  const selectLanguage = (id: string) => {
    deepAssign(settings, {language: id})
  }

  return (
    <Modal
      show={show}
      setShow={setShow}
      className="translation-switch-modale"
    >
      <div className="content">
        <div className="languages">
          {...Object.entries(languages).map(([id, {"display-name": dispName}])=> {
            const selected = settings.language === id
            
            return (
              <button key={id}
                className={`language ${selected ? 'selected' : ''}`}
                onClick={()=>selectLanguage(id)}
              >
                <div>{dispName}</div>
              </button>
            )
          })}
        </div>
      </div>

      <MenuButton onClick={()=>setShow(false)} className="close-btn">
        {strings.title.about.close}
      </MenuButton>
    </Modal>
  )
}