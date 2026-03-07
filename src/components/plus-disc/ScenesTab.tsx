import { PlusDiscSceneName } from "types"
import { playScene } from "utils/savestates"
import { viewedScene } from "utils/settings"
import { strings } from "translation/lang"
import { SceneShortcut } from "@tsukiweb-common/ui-core"

const ScenesTab = () => {

	const play = (id: PlusDiscSceneName)=> {
		playScene(id, {viewedOnly: false, continueScript: true})
	}

	return (
		<div className="scenes-list">
			<SceneShortcut
				unlocked={true}
				images={{
					"bg": "bg/bg_59",
					"r": "tachi/akira_02"
				}}
				title={strings.plus_disc_scenario.pd_alliance}
				subtitle={viewedScene("pd_alliance") ? strings.plus_disc.viewed : "\u00A0"}
				onClick={play.bind(undefined, "pd_alliance")}
				onKeyDown={e => e.key === "Enter" && play("pd_alliance")}
				nav-auto={1}
			/>
			<SceneShortcut
				unlocked={true}
				images={{
					"bg": "bg/bg_59",
					"l": "tachi/ark_t01",
					"c": "tachi/aki_t04b",
					"r": "tachi/cel_t01a",
				}}
				title={strings.plus_disc_scenario.pd_geccha}
				subtitle={viewedScene("pd_geccha") ? strings.plus_disc.viewed : "\u00A0"}
				onClick={play.bind(undefined, "pd_geccha")}
				onKeyDown={e => e.key === "Enter" && play("pd_geccha")}
				nav-auto={1}
			/>
			<SceneShortcut
				unlocked={true}
				images={{
					"bg": "bg/s07",
					"l": "tachi/stk_t11",
					"r": "tachi/neko_t01a",
				}}
				title={strings.plus_disc_scenario.pd_geccha2}
				subtitle={viewedScene("pd_geccha2") ? strings.plus_disc.viewed : "\u00A0"}
				onClick={play.bind(undefined, "pd_geccha2")}
				onKeyDown={e => e.key === "Enter" && play("pd_geccha2")}
				nav-auto={1}
			/>
			<SceneShortcut
				unlocked={true}
				images={{
					"bg": "bg/bg_40a",
					"c": "tachi/koha_t06",
				}}
				title={strings.plus_disc_scenario.pd_experiment}
				subtitle={viewedScene("pd_experiment") ? strings.plus_disc.viewed : "\u00A0"}
				onClick={play.bind(undefined, "pd_experiment")}
				onKeyDown={e => e.key === "Enter" && play("pd_experiment")}
				nav-auto={1}
			/>
		</div>
	)
}

export default ScenesTab