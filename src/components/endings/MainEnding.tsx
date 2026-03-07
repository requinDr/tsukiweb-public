import { SceneShortcut } from "@tsukiweb-common/ui-core"
import { LabelName } from "types"
import { playScene } from "utils/savestates"

type Props = {
	unlocked: boolean
	ending: {
		id: string
		char: string
		image?: string
		name: string
		type: string
		scene: LabelName
	},
	continueScript?: boolean
	attention?: boolean
} & React.HTMLAttributes<HTMLDivElement>

const MainEnding = ({unlocked, ending, continueScript = false, attention, ...props}: Props) => {
	const {id, char, image, name, type, scene} = ending
	const startScene = () => playScene(scene, {continueScript: continueScript, viewedOnly: !unlocked})

	return (
		<SceneShortcut
			{...props}
			id={id}
			unlocked={unlocked}
			className={id}
			images={image ? {bg: image} : {}}
			title={unlocked ? name : "???"}
			subtitle={unlocked && char
				? <>{char} <span className="separator">{`\u2022`}</span> {type}</>
	 			: (unlocked && !char)
					? "" : "???"
			}
			onClick={startScene}
			onKeyDown={e => e.key === "Enter" && startScene()}
			attention={attention}
			nav-auto={1}
		/>
	)
}

export default MainEnding