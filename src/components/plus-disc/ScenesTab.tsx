import { PlusDiscSceneName } from "types"
import SceneShortcut from "./SceneShortcut"
import { playScene } from "utils/savestates"

const ScenesTab = () => {

	const play = (id: PlusDiscSceneName)=> {
		playScene(id, {viewedOnly: false})
	}
	
	return (
		<div className="scenes-list">
			<SceneShortcut
				title="Alliance of Illusionary Eyes"
				images={{
					"bg": "bg/bg_59",
					"r": "tachi/akira_02"
				}}
				onClick={play.bind(undefined, "pd_alliance")}
			/>

			<SceneShortcut
				title="Geccha"
				images={{
					"bg": "bg/bg_59",
					"l": "tachi/ark_t01",
					"c": "tachi/aki_t04b",
					"r": "tachi/cel_t01a",
				}}
				onClick={play.bind(undefined, "pd_geccha")}
			/>

			<SceneShortcut
				title="Geccha 2"
				images={{
					"bg": "bg/s07",
					"l": "tachi/stk_t11",
					"r": "tachi/neko_t01a",
				}}
				onClick={play.bind(undefined, "pd_geccha2")}
			/>

			<SceneShortcut
				title="Kinoko's Masterpiece Experimental Theater"
				images={{
					"bg": "bg/bg_40a",
					"c": "tachi/koha_t06",
				}}
				onClick={play.bind(undefined, "pd_experiment")}
			/>
		</div>
	)
}

export default ScenesTab