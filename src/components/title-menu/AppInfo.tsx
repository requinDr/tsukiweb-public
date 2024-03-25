import { Dispatch, useState } from "react"
import { MdInfoOutline, MdLink } from "react-icons/md"
import { toast } from "react-toastify"
import { bb } from "../../utils/Bbcode"
import { APP_VERSION } from "../../utils/constants"
import { strings } from "../../translation/lang"
import MenuButton from "../atoms/MenuButton"
import Modal from "../atoms/Modal"
import tsukiR from "../../assets/images/tsukihime_blue_glass_cover.webp"

const AppInfo = () => {
  const [show, setShow] = useState<boolean>(false)
  return (
    <>
      <button
        className="action-icon" 
        aria-label="show information modal"
        onClick={()=>setShow(true)}>
        <MdInfoOutline />
      </button>
      <ModalInfo show={show} setShow={setShow} />
    </>
  )
}

export default AppInfo


type ModalInfoProps = {
  show: boolean
  setShow: Dispatch<boolean>
}
const ModalInfo = ({show, setShow}: ModalInfoProps) => {
  const copyCurrentUrl = () => {
    navigator.clipboard.writeText(window.location.href)
    toast("Page URL copied to clipboard", {
      toastId: "copy-url",
      type: "info",
      autoClose: 2000,
      closeButton: false,
      pauseOnHover: false,
    })
  }

  return (
    <Modal
      show={show}
      setShow={setShow}
      className="app-info-modale"
    >
      <div className='title-modal'>
        <div className='infos'>
          <div className='top'>
            <div>v{APP_VERSION}</div>
            <a href="https://github.com/requinDr/tsukiweb-public" target="_blank" rel="noreferrer">
              <img src="https://img.shields.io/github/stars/requinDr/tsukiweb-public?style=social" alt="stars" />
            </a>
            <MdLink title='Copy link' className='copy-link'
              onClick={copyCurrentUrl} />
          </div>

          <div className='content'>
            <div>
              {bb(strings.title.about.port)}
            </div>

            <div>
              {bb(strings.title.about.project
                .replace('$0', "[url='https://github.com/requinDr/tsukiweb-public']")
                .replace('$1', "[/url]"))}
            </div>

            <div>
              {bb(strings.title.about.feedback
                .replace('$0', "[url='https://forms.gle/MJorV8oNbnKo22469']")
                .replace('$1', "[/url]"))}
            </div>

            <div>
              {bb(strings.title.about.data
                .replace('$0', "[url='/config?tab=advanced']")
                .replace('$1', "[/url]"))}
            </div>
          </div>
        </div>

        <div className='tsuki-remake'>
          <img src={tsukiR} alt="tsukihime remake logo" className="logo" draggable={false} />
          <div>{bb(strings.title.about.remake
                  .replace('$0', "[url='http://typemoon.com/products/tsukihime/']")
                  .replace('$1', "[/url]"))}</div>
        </div>
      </div>

      <MenuButton onClick={()=>setShow(false)} className="close-btn">
        {strings.title.about.close}
      </MenuButton>
    </Modal>
  )
}