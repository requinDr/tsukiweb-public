import { useState } from "react"
import { MdTranslate } from "react-icons/md"
import ModalLanguageSelection from "components/config/ModalLanguageSelection"

type Props = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'|'onContextMenu'>

const TranslationSwitch = (props?: Props) => {
  const [show, setShow] = useState<boolean>(false)
  return (
    <>
      <button
        {...props}
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