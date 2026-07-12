import { NumVarName } from "@tsukiweb-common/script/types"
import { endings } from "../features/endings/utils/endings"
import { ScriptPlayer } from "engine/ScriptPlayer"
import { CharId } from "app/utils/types";

//#endregion ###################################################################
//#region                         GET VARIABLES
//##############################################################################

export function getGameVariable(script: ScriptPlayer, name: NumVarName): number {
	switch (name) {
		// context variables
		case '%flushcount': return script.flushcount ?? 0
		// endings variables
		case '%ark_normalcleared':
			return +(endings.ark_true.seen)
		case '%clear_ark':
			return +(endings.ark_good.seen) + +(endings.ark_true.seen)
		case '%clear_cel':
			return +(endings.ciel_good.seen) + +(endings.ciel_true.seen)
		case '%clear_aki':
			return +(endings.akiha_good.seen) + +(endings.akiha_true.seen)
		case '%clear_his':
			return +(endings.hisui_good.seen) + +(endings.hisui_true.seen)
		case '%clear_koha':
			return +(endings.kohaku_true.seen)
		case '%cleared':
			return +(endings.ark_good.seen  ) + +(endings.ark_true.seen  ) +
				     +(endings.ciel_good.seen ) + +(endings.ciel_true.seen ) +
				     +(endings.akiha_good.seen) + +(endings.akiha_true.seen) +
				     +(endings.hisui_good.seen) + +(endings.hisui_true.seen) +
				     +(endings.kohaku_true.seen)
		default:
			if (/^%flg[1-9A-Z]$/.test(name)) {
			  // flags
				return script.flags.has(name.substring(4)) ? 1 : 0
      } else if (/regard_\w+/.test(name)) {
		// regard
        const char = name.substring(name.indexOf('_')+1)
        return script.getPoints(char as CharId)
      } else if (/^%clear_[a-z]+_[a-z]+$/.test(name)) {
			  // endings
				const ending = name.substring(name.indexOf('_')+1) as keyof typeof endings
				return endings[ending].seen ? 1 : 0
			} else {
				throw Error(`Unknown variable ${name}`)
			}
	}
}
//#endregion ###################################################################
//#region                         SET VARIABLES
//##############################################################################

export function setGameVariable(script: ScriptPlayer, name: NumVarName,
                                value: number) {
  if (name == '%flushcount') {
    if (script.currentBlock)
      script.flushcount = value
  } else if (/^%flg[1-9A-Z]$/.test(name)) {
    if (value > 0)
      script.flags.add(name.substring(4))
    else
      script.flags.delete(name.substring(4))
  } else if (/regard_\w+/.test(name)) {
    // regard
    const char = name.substring(name.indexOf('_')+1) as CharId
    script.setPoints(char, value)
  } else {
    throw Error(`Unknown or read-only variable ${name}`)
  }
}
