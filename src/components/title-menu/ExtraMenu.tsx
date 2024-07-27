import TitleMenuButton from "@tsukiweb-common/components/atoms/TitleMenuButton"
import { strings } from "translation/lang"
import { SCREEN } from "utils/display"
import { playScene } from "utils/savestates"

type ExtraMenuProps = {
	allEndingsSeen: boolean
	eclipseSeen: boolean
}
const ExtraMenu = ({allEndingsSeen, eclipseSeen}: ExtraMenuProps) => {
	function playEClipse() {
		playScene("eclipse", {continueScript: true, viewedOnly: false})
	}
	
	return (
		<>
			<TitleMenuButton to={SCREEN.GALLERY}>
				{strings.extra.gallery}
			</TitleMenuButton>
			<TitleMenuButton to={SCREEN.ENDINGS}>
				{strings.extra.endings}
			</TitleMenuButton>
			<TitleMenuButton to={SCREEN.SCENES}>
				{strings.extra.scenes}
			</TitleMenuButton>
			{allEndingsSeen &&
			<TitleMenuButton onClick={playEClipse}
				attention={!eclipseSeen}>
				{strings.extra.eclipse}
			</TitleMenuButton>
			}
		</>
	)
}

export default ExtraMenu