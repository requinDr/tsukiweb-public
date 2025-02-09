import { NumVarName } from "@tsukiweb-common/types"
import { getGameVariable } from "./variables"
import Timer from "@tsukiweb-common/utils/timer"


export const commands = {
  'resettimer': null, // all 'waittimer' are immediately after 'resettimer'
  'waittimer' : processTimerCmd,
  'wait'      : processTimerCmd, // short for 'resettimer' + 'waittimer', user by mm
  'delay'     : processTimerCmd, // same as 'wait', used for credits
  '!w'        : processTimerCmd, // used for inline waits
}

function processTimerCmd(arg: string, _: string, onFinish: VoidFunction) {
  const time_to_wait = arg.startsWith('%') ?
      getGameVariable(arg as NumVarName)
      : parseInt(arg)
  const timer = new Timer(time_to_wait, onFinish)
  timer.start()
  return {next: timer.skip.bind(timer)}
}