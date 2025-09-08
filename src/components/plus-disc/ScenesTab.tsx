import { PlusDiscSceneName } from "types"
import SceneShortcut from "./SceneShortcut"
import { playScene } from "utils/savestates"
import { viewedScene } from "utils/settings"
import { strings } from "translation/lang"
import { MessageContainer } from "@tsukiweb-common/ui-core"
import { MdBuild } from "react-icons/md"

const ScenesTab = () => {

	const play = (id: PlusDiscSceneName)=> {
		playScene(id, {viewedOnly: false, continueScript: false})
	}

	return (
		<div className="scenes-list">
			<SceneShortcut
				title={strings.plus_disc_scenario.pd_alliance}
				images={{
					"bg": "bg/bg_59",
					"r": "tachi/akira_02"
				}}
				viewed={viewedScene("pd_alliance")}
				onClick={play.bind(undefined, "pd_alliance")}
			/>

			<SceneShortcut
				title={strings.plus_disc_scenario.pd_geccha}
				images={{
					"bg": "bg/bg_59",
					"l": "tachi/ark_t01",
					"c": "tachi/aki_t04b",
					"r": "tachi/cel_t01a",
				}}
				viewed={viewedScene("pd_geccha")}
				onClick={play.bind(undefined, "pd_geccha")}
			/>

			<SceneShortcut
				title={<>{strings.plus_disc_scenario.pd_geccha2} <MessageContainer style={{fontSize: ".6em",  marginLeft: 4, float: "right", display: "flex", alignItems: "center"}}><MdBuild style={{marginRight: 4}} /> WIP</MessageContainer></>}
				images={{
					"bg": "bg/s07",
					"l": "tachi/stk_t11",
					"r": "tachi/neko_t01a",
				}}
				viewed={viewedScene("pd_geccha2")}
				onClick={play.bind(undefined, "pd_geccha2")}
			/>

			<SceneShortcut
				title={strings.plus_disc_scenario.pd_experiment}
				images={{
					"bg": "bg/bg_40a",
					"c": "tachi/koha_t06",
				}}
				viewed={viewedScene("pd_experiment")}
				onClick={play.bind(undefined, "pd_experiment")}
			/>
		</div>
	)
}

export default ScenesTab