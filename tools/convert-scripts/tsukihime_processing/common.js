import {switch_regex} from "../../../tsukiweb-common/tools/utils/utils.js"
const CONDITION_REGEXP = /^(?<lhs>(%\w+|\d+))(?<op>[=!><]+)(?<rhs>(%\w+|\d+))$/

function isLogicLabel(label) {
	return /^(f|skip)\d\w+?$/.test(label)
}
function isSceneLabel(label) {
	return /^s\d\w+$/.test(label) || ['openning', 'eclipse'].includes(label)
}

function processVarName(varName) {
	return switch_regex(varName, new Map([...Object.entries({
		"%sceneskip"		: null, // ignore sceneskip tests
		"%ark_normalcleared": "%clear_ark_true", // rename ark "normal" clear
		"%ark_regard"		: "%regard_ark", // rename regards
		"%ciel_regard"		: "%regard_cel",
		"%akiha_regard"		: "%regard_aki",
		"%hisui_regard"		: "%regard_his",
		"%kohaku_regard"	: "%regard_koha",
		"%rockending"		: null, // unused in game
	}), [/^%1\d{3}$/        , null], // scene completion
		[/^%([a-z]+)_regard/, (m)=> {
			throw Error(`regard variable ${m[0]} not recognized`)
		}],
		// ignore all other variables
	]), varName)
}


function processCondition(condition) {
	condition = condition.trim()
	/** @type {string[]} */
	let subConditions = condition.split('&&')
	if (subConditions.length > 1)
		return subConditions.map(processCondition).filter(c => c).join(' && ')
	subConditions = condition.split('||')
	if (subConditions.length > 1)
		return subConditions.map(processCondition).filter(c => c).join(' || ')
	let match = CONDITION_REGEXP.exec(condition)
	if (!match) throw Error(
		`Unable to parse condition "${condition}"`)

	let {lhs, op, rhs} = match.groups
	if (lhs.startsWith('%'))
		lhs = processVarName(lhs)
	if (rhs.startsWith('%'))
		rhs = processVarName(rhs)
	if (!lhs || !rhs)
		return null
	return `${lhs}${op}${rhs}`
}

export {
	isLogicLabel,
	isSceneLabel,
    processVarName,
    processCondition
}