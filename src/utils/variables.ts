import { NumVarName } from "@tsukiweb-common/types"
import { endings } from "./endings"
import { Regard, ScriptPlayer } from "script/ScriptPlayer"

//#endregion ###################################################################
//#region                         GET VARIABLES
//##############################################################################

export function getGameVariable(script: ScriptPlayer, name: NumVarName): number {
	switch (name) {
		// context variables
		case '%flushcount' : return script.flushcount ?? 0
		// endings variables
		case '%ark_normalcleared':
			return +(endings.ark_true.seen)
		case '%clear_ark':
			return +(endings.ark_good.seen) + +(endings.ark_true.seen)
		case '%clear_ciel':
			return +(endings.ciel_good.seen) + +(endings.ciel_true.seen)
		case '%clear_akiha':
			return +(endings.akiha_good.seen) + +(endings.akiha_true.seen)
		case '%clear_hisui':
			return +(endings.hisui_good.seen) + +(endings.hisui_true.seen)
		case '%clear_kohaku':
			return +(endings.kohaku_true.seen)
		case '%cleared':
			return +(endings.ark_good.seen  ) + +(endings.ark_true.seen  ) +
				     +(endings.ciel_good.seen ) + +(endings.ciel_true.seen ) +
				     +(endings.akiha_good.seen) + +(endings.akiha_true.seen) +
				     +(endings.hisui_good.seen) + +(endings.hisui_true.seen) +
				     +(endings.kohaku_true.seen)
		default :
			if (/^%flg[1-9A-Z]$/.test(name)) {
			  // flags
				return script.flags.has(name.substring(3)) ? 1 : 0
      } else if (/regard_\w+/.test(name)) {
		    // regard
        const char = name.substring(name.indexOf('_')+1)
        return script.regard[char as keyof ScriptPlayer["regard"]]
      } else if (/^%clear_[a-z]+_[a-z]+^/.test(name)) {
			  // endings
				const ending = name.substring(6) as keyof typeof endings
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
      script.flags.add(name.substring(3))
    else
      script.flags.delete(name.substring(3))
  } else if (/regard_\w+/.test(name)) {
    // regard
    const char = name.substring(name.indexOf('_')+1)
    script.regard[char as keyof Regard] = value
  } else {
    throw Error(`Unknown or read-only variable ${name}`)
  }
}

//#endregion ###################################################################
//#region                           COMMANDS
//##############################################################################

function processVarCmd(arg: string, cmd: string, script: ScriptPlayer) {
  const [name, v] = arg.split(',') as [NumVarName, string]
  let currVal = 0
  if (!name.startsWith('%'))
    throw Error(`Non-number variable ${name} not supported.`)
  currVal = getGameVariable(script, name as NumVarName)
  if (currVal === null && cmd != 'mov')
    throw Error(`Reading undefined variable. [${cmd} ${arg}]`)

  switch (cmd) {
    case 'mov' : setGameVariable(script, name, parseInt(v)); break
    case 'add' : setGameVariable(script, name, currVal + parseInt(v)); break
    case 'sub' : setGameVariable(script, name, currVal - parseInt(v)); break
    case 'inc' : setGameVariable(script, name, currVal + 1); break
    case 'dec' : setGameVariable(script, name, currVal - 1); break
  }
}

export const commands = {
  'mov': processVarCmd,
  'add': processVarCmd,
  'sub': processVarCmd,
  'inc': processVarCmd,
  'dec': processVarCmd,
}

