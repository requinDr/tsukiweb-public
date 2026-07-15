import { SceneShortcut } from "@tsukiweb-common/ui-core"
import { LabelName } from "app/utils/types"
import { playScene } from "engine/savestates"

type Props = {
	unlocked: boolean
	ending: {
		id: string
		char: string
		images: Parameters<typeof SceneShortcut>[0]['images']
		name: string
		type: string
		scene: LabelName
	},
	continueScript?: boolean
	attention?: boolean
} & React.HTMLAttributes<HTMLDivElement>

const MainEnding = ({unlocked, ending, continueScript = false, attention, ...props}: Props) => {
	const {id, char, images, name, type, scene} = ending
	const startScene = () => playScene(scene, {continueScript: continueScript, viewedOnly: !unlocked})

	return (
		<SceneShortcut
			{...props}
			unlocked={unlocked}
			className={id}
			images={images}
			title={unlocked ? name : "???"}
			subtitle={unlocked && char
				? <>{char} <span className="separator">{`\u2022`}</span> {type}</>
	 			: undefined
			}
			onClick={startScene}
			onKeyDown={e => e.key === "Enter" && startScene()}
			attention={attention}
			nav-auto={1}
		/>
	)
}

export default MainEnding