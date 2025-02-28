import { useState } from "react"
import { MdTranslate } from "react-icons/md"
import ModalLanguageSelection from "components/config/ModalLanguageSelection"

const TranslationSwitch = () => {
  const [show, setShow] = useState<boolean>(false)
  return (
    <>
      <button
        className="action-icon" 
        aria-label="show language selection modal"
        onContextMenu={e => e.preventDefault()}
        onClick={()=>setShow(true)}>
        <MdTranslate />
      </button>
      <ModalLanguageSelection show={show} setShow={setShow} />
    </>
  )
}

export default TranslationSwitch