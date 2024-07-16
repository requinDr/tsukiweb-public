import { NumVarName } from "@tsukiweb-common/types"
import { getGameVariable } from "./variables"
import Timer from "@tsukiweb-common/utils/timer"


export const commands = {
  'resettimer': null, // all 'waittimer' are immediately after 'resettimer'
  'waittimer' : processTimerCmd,
  'delay'     : processTimerCmd,
  '!w'        : processTimerCmd,
}

function processTimerCmd(arg: string, _: string, onFinish: VoidFunction) {
  const time_to_wait = arg.startsWith('%') ?
      getGameVariable(arg as NumVarName)
      : parseInt(arg)
  const timer = new Timer(time_to_wait, onFinish)
  timer.start()
  return {next: timer.skip.bind(timer)}
}