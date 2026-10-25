import { DY, FcOverlayDrawer, path2D, StyleReader } from "@tsukiweb/common/flowchart"
import { CharId } from "app/utils/types"
import { BADGE_PATHS, FLAG_BACKGROUND, FLAG_CONTENT, STRIKE_COLOR } from "../components/badges"
import { getNodeBadges } from "./badges"
import { FcNode } from "./flowchart"


type BadgeFill = 'active' | 'background' | 'flag' | CharId

type BadgeLayout = { x: number, y: number } & (
	| { type: 'regard', char: CharId, value: number }
	| { type: 'flag', flag: string }
	| { type: 'select', link: string }
	| { type: 'ending', char: CharId }
	| { type: 'condition', angle: number, iconX: number, iconY: number,
		icon: string, fill: BadgeFill, negative: boolean }
)

type Condition = NonNullable<NonNullable<ReturnType<typeof getNodeBadges>>['condition']>

type BBox = [left: number, top: number, right: number, bottom: number]

const REGARD_REGEX = /^%regard_(\w+)/
const BADGE_RIGHT_INSET = 3
const FLAG_RIGHT_INSET = 3.5
const FLAG_SPACING = DY * 2.6
const SHADOW_OFFSET = 0.4
const COND_UNIT = DY * 0.8
const TEXT_SIZE = 4
const HEART_ICON = "heart"
const HEART_ICON_SCALE = 0.68
const HEART_ICON_RAISE = 1.05
const DOTS_ICON = "⋯"
const DOTS_RADIUS = 0.4
const DOTS_GAP = 1.2


//##############################################################################
//#region                           LAYOUT
//##############################################################################

function conditionLayout(node: FcNode, condition: Condition): BadgeLayout {
	let x, y, angle, iconX, iconY, icon, fill: BadgeFill
	if (typeof condition == 'object') {
		let above, below
		({condition, above, below} = condition)
		if (above) {
			const anchorNode = node.flowchart.getNode(above)
			x = anchorNode!.centerX
			y = anchorNode!.top - DY
		} else if (below) {
			const anchorNode = node.flowchart.getNode(below)
			x = anchorNode!.centerX
			y = anchorNode!.bottom + DY
		} else {
			x = node.centerX
			y = node.top - DY
		}
		if (x < node.centerX) {
			angle = -90
			iconX = DY*0.1
			iconY = DY*0.48
			x += DY+0.1
		} else if (x > node.centerX) {
			angle = 90
			iconX = -DY*0.1
			iconY = DY*0.48
			x -= DY+0.1
		} else {
			angle = 0
			iconX = 0
			iconY = DY*0.56
			y += DY+0.1
		}
	} else {
		angle = 0
		iconX = 0
		iconY = DY*0.56
		x = node.centerX
		y = node.top + 0.1
	}
	let negative = condition.startsWith('!')
	if (negative)
		condition = condition.substring(1)
	if (condition.includes('||') || condition.includes('&&')) {
		icon = DOTS_ICON
		fill = 'background'
		negative = false
	} else if (condition.startsWith('%flg')) {
		icon = condition[4]
		fill = 'flag'
	} else if (condition.startsWith('%regard')) {
		icon = HEART_ICON
		fill = condition.match(REGARD_REGEX)![1] as CharId
	} else if (condition.startsWith('%clear')) {
		icon = "★"
		fill = 'active'
	} else {
		icon = DOTS_ICON
		fill = 'background'
	}
	return { type: 'condition', x, y, angle, iconX, iconY, icon, fill, negative }
}

/** Position and content of the badges of a node, in flowchart coordinates */
function getBadgesLayout(node: FcNode, isLinkEnabled: (node: FcNode) => boolean): BadgeLayout[] {
	const badge = getNodeBadges(node.id)
	if (!badge) return []

	const { flag, char, value, select, condition, ending } = badge
	const cornerX = node.right - (node.width > 0 ? BADGE_RIGHT_INSET : 0)
	const cornerY = node.bottom - (node.height > 0 ? DY / 2 : 0)
	const layouts: BadgeLayout[] = []

	if (char)
		layouts.push({ type: 'regard', x: cornerX, y: cornerY, char, value: value! })
	if (flag) {
		const flagX = node.right - (node.width > 0 ? FLAG_RIGHT_INSET : 0)
		layouts.push({ type: 'flag', x: flagX, y: cornerY - (char ? FLAG_SPACING : 0), flag })
	}
	if (select)
		layouts.push({ type: 'select', x: node.centerX, y: node.bottom, link: isLinkEnabled(node)
			? `fc-link enabled${node.group ? ` group-${node.group}` : ''}`
			: "fc-link disabled" })
	if (condition)
		layouts.push(conditionLayout(node, condition))
	if (ending)
		layouts.push({ type: 'ending', x: cornerX, y: cornerY, char: ending.char })
	return layouts
}


//#endregion ###################################################################
//#region                           DRAWING
//##############################################################################

function fillStyle(ctx: CanvasRenderingContext2D, fill: BadgeFill, style: StyleReader, bbox: BBox) {
	switch (fill) {
		case 'active': return style.color("var(--active-connection)")
		case 'background': return style.color("var(--badge-background)")
		case 'flag': return FLAG_BACKGROUND
	}
	const [left, top, right, bottom] = bbox
	const gradient = ctx.createLinearGradient(left, bottom, right, top)
	gradient.addColorStop(0, style.color(`color-mix(in oklch, var(--route-${fill}) 80%, white)`))
	gradient.addColorStop(1, style.color(`color-mix(in oklch, var(--route-${fill}) 80%, black)`))
	return gradient
}

function drawShape(ctx: CanvasRenderingContext2D, d: string, fill: string | CanvasGradient) {
	ctx.fillStyle = fill
	ctx.fill(path2D(d))
	ctx.strokeStyle = "white"
	ctx.lineWidth = 0.6
	ctx.stroke(path2D(d))
}

function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number,
		font: string, color = "white", halo = false) {
	ctx.font = `${TEXT_SIZE}px ${font}`
	if (halo) {
		ctx.strokeStyle = FLAG_BACKGROUND
		ctx.lineWidth = 0.7
		ctx.strokeText(text, x, y)
	}
	ctx.fillStyle = color
	ctx.fillText(text, x, y)
}

function drawStrike(ctx: CanvasRenderingContext2D) {
	ctx.strokeStyle = STRIKE_COLOR
	ctx.lineWidth = 1
	ctx.stroke(path2D(BADGE_PATHS.strike))
}

/** Pennant, with its content drawn in the flag part */
function drawFlag(ctx: CanvasRenderingContext2D, drawContent: VoidFunction) {
	ctx.fillStyle = "rgb(0 0 0 / 0.5)"
	ctx.translate(SHADOW_OFFSET, SHADOW_OFFSET)
	ctx.fill(path2D(BADGE_PATHS.flag))
	ctx.translate(-SHADOW_OFFSET, -SHADOW_OFFSET)
	ctx.strokeStyle = "white"
	ctx.lineWidth = 0.6
	ctx.stroke(path2D(BADGE_PATHS.flagPole))
	drawShape(ctx, BADGE_PATHS.flag, FLAG_BACKGROUND)
	ctx.save()
	ctx.translate(FLAG_CONTENT.x, FLAG_CONTENT.y)
	ctx.scale(FLAG_CONTENT.scale, FLAG_CONTENT.scale)
	drawContent()
	ctx.restore()
}

function drawBadge(ctx: CanvasRenderingContext2D, badge: BadgeLayout, style: StyleReader,
		font: string) {
	ctx.save()
	ctx.translate(badge.x, badge.y)
	switch (badge.type) {
		case 'regard': {
			const n = Math.abs(badge.value)
			const bbox: BBox = [-2.5 - 5 * (n - 1), -3.3, 2.5, 2.5]
			drawShape(ctx, BADGE_PATHS.regard(badge.value), fillStyle(ctx, badge.char, style, bbox))
			ctx.strokeStyle = badge.value > 0 ? "#00ff00" : "#ff0000"
			ctx.stroke(path2D(badge.value > 0 ? BADGE_PATHS.regardPlus : BADGE_PATHS.regardMinus))
			break
		}
		case 'flag': {
			const { flag } = badge
			drawFlag(ctx, () => drawText(ctx, flag, 0, 1.6, font))
			break
		}
		case 'select':
			ctx.fillStyle = style.stroke(badge.link).color
			ctx.fill(path2D(BADGE_PATHS.select))
			drawText(ctx, "?", 0, 1.45, font)
			break
		case 'ending':
			drawShape(ctx, BADGE_PATHS.route, fillStyle(ctx, badge.char, style, [-3, -3.5, 3, 3]))
			break
		case 'condition': {
			const c = COND_UNIT
			ctx.save()
			ctx.rotate(badge.angle * Math.PI / 180)
			drawShape(ctx, BADGE_PATHS.cond, fillStyle(ctx, badge.fill, style, [-c, -c, c, c * 1.5]))
			ctx.restore()
			if (badge.negative)
				drawStrike(ctx)
			if (badge.icon == HEART_ICON) {
				ctx.save()
				ctx.translate(badge.iconX, badge.iconY - HEART_ICON_RAISE)
				ctx.scale(HEART_ICON_SCALE, HEART_ICON_SCALE)
				ctx.fillStyle = "white"
				ctx.fill(path2D(BADGE_PATHS.heart))
				ctx.restore()
			} else if (badge.icon == DOTS_ICON) {
				ctx.fillStyle = "white"
				ctx.beginPath()
				for (const x of [-DOTS_GAP, 0, DOTS_GAP]) {
					ctx.moveTo(x + DOTS_RADIUS, 0)
					ctx.arc(x, 0, DOTS_RADIUS, 0, 2 * Math.PI)
				}
				ctx.fill()
			} else {
				drawText(ctx, badge.icon, badge.iconX, badge.iconY, font, "white", badge.negative)
			}
			break
		}
	}
	ctx.restore()
}

/** @param isLinkEnabled whether the links below `node` are drawn as enabled */
export function createBadgesDrawer(nodes: FcNode[],
		isLinkEnabled: (node: FcNode) => boolean): FcOverlayDrawer {
	const badges = nodes.flatMap(node => getBadgesLayout(node, isLinkEnabled))
	return (ctx, view, style) => {
		const font = style.property('--ui-font') || 'sans-serif'
		ctx.lineCap = 'round'
		ctx.textAlign = 'center'
		for (const badge of badges) {
			if (badge.x > view.left && badge.x < view.right
					&& badge.y > view.top && badge.y < view.bottom)
				drawBadge(ctx, badge, style, font)
		}
	}
}
