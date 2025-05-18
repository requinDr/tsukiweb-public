import { ScriptPlayer } from "script/ScriptPlayer";
import { TsukihimeSceneName } from "types";
import { History } from "./history";

class GameController {
    _script: ScriptPlayer | undefined = undefined
    _history: History = new History({restore: true})
    _continueScript: boolean = true
    

    /**
     * Play a scene without continuing tthe scenario
     * @param label label of the scene to play
     */
    playScene(label: TsukihimeSceneName) {

    }

    /**
     * Open the settings, either in game or in title menu
     */
    openSettings() {

    }

    /**
     * Launch a new game from the intro
     */
    newGame() {

    }

    /**
     * Continue the current game or reload the last save
     */
    continueGame() {

    }

}
