import { DY, FcOverlayDrawer, POINT_HEAD_CLIP, StyleReader, detailsVisibility, disc, drawHead,
	getHeadImage, headClip, path2D } from "@tsukiweb/common/flowchart"
import { FLAG_BACKGROUND, FLAG_CONTENT, POINT_RADIUS, POINT_SIGN, STRIKE_COLOR }
	from "@tsukiweb/common/icons/badges"
import { CharId } from "app/utils/types"
import { BADGE_PATHS, BADGE_SIZE, ROUTE_HEAD_RADIUS } from "../components/badges"
import { getNodeBadges } from "./badges"
import { FcNode, GameFlowchart } from "./flowchart"


type BadgeFill = 'active' | 'background' | 'flag' | CharId

type BadgeLayout = { x: number, y: number } & (
	| { type: 'regard', char: CharId, value: number }
	| { type: 'flag', flag: string }
	| { type: 'select', link: string, n?: number }
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
const HEAD_ICON = "head"
const COND_HEAD = { raise: 1.3, radius: 2.7 }
const DOTS_ICON = "⋯"
const DOTS_RADIUS = 0.4
const DOTS_GAP = 1.2
const COND_HEAD_CLIP = headClip(disc(COND_HEAD.radius), COND_HEAD.radius)
const ROUTE_HEAD_CLIP = headClip(path2D(BADGE_PATHS.route), ROUTE_HEAD_RADIUS)

const headSrc = (char: CharId) => `./res/chars/${char}.webp`


//##############################################################################
//#region                           LAYOUT
//##############################################################################

function conditionLayout(node: FcNode, condition: Condition): BadgeLayout {
	let x = node.centerX, y = node.top + 0.1
	let angle = 0, iconX = 0, iconY = DY*0.56
	if (typeof condition == 'object') {
		const { above, below } = condition
		const anchorNode = node.flowchart.getNode(above || below || node.id)!
		x = anchorNode.centerX
		y = above || !below ? anchorNode.top - DY : anchorNode.bottom + DY
		const side = Math.sign(x - node.centerX)
		if (side != 0) {
			angle = side * 90
			iconX = -side * DY*0.1
			iconY = DY*0.48
			x -= side * (DY+0.1)
		} else {
			y += DY+0.1
		}
		condition = condition.condition
	}
	let negative = condition.startsWith('!')
	if (negative)
		condition = condition.substring(1)
	let icon = DOTS_ICON, fill: BadgeFill = 'background'
	if (condition.includes('||') || condition.includes('&&')) {
		negative = false
	} else if (condition.startsWith('%flg')) {
		icon = condition[4]
		fill = 'flag'
	} else if (condition.startsWith('%regard')) {
		icon = HEAD_ICON
		fill = condition.match(REGARD_REGEX)![1] as CharId
	} else if (condition.startsWith('%clear')) {
		icon = "★"
		fill = 'active'
	}
	return { type: 'condition', x, y, angle, iconX, iconY, icon, fill, negative }
}

/** Position and content of the badges of a node, in flowchart coordinates */
function getBadgesLayout(node: FcNode, flowchart: GameFlowchart): BadgeLayout[] {
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
	if (select) {
		const linkEnabled = node.children.some(child => !flowchart.isLinkDisabled(node, child))
		layouts.push({ type: 'select', x: node.centerX, y: node.bottom,
			link: linkEnabled ?
				`fc-link enabled${node.group ? ` group-${node.group}` : ''}`
				: "fc-link disabled",
			n: flowchart.getHistoryScene(node.id)?.choice ?? -1 })
	}
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
		case 'flag': return style.color(FLAG_BACKGROUND)
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
		font: string, color = "white", halo?: string) {
	ctx.font = `${TEXT_SIZE}px ${font}`
	if (halo) {
		ctx.strokeStyle = halo
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
function drawFlag(ctx: CanvasRenderingContext2D, fill: string, drawContent: VoidFunction) {
	ctx.fillStyle = "rgb(0 0 0 / 0.5)"
	ctx.translate(SHADOW_OFFSET, SHADOW_OFFSET)
	ctx.fill(path2D(BADGE_PATHS.flag))
	ctx.translate(-SHADOW_OFFSET, -SHADOW_OFFSET)
	ctx.strokeStyle = "white"
	ctx.lineWidth = 0.6
	ctx.stroke(path2D(BADGE_PATHS.flagPole))
	drawShape(ctx, BADGE_PATHS.flag, fill)
	ctx.save()
	ctx.translate(FLAG_CONTENT.x, FLAG_CONTENT.y)
	ctx.scale(FLAG_CONTENT.scale, FLAG_CONTENT.scale)
	drawContent()
	ctx.restore()
}

function drawPoint(ctx: CanvasRenderingContext2D, char: CharId, value: number,
		style: StyleReader, headVisibility: number) {
	const r = POINT_RADIUS
	ctx.beginPath()
	ctx.arc(0, 0, r, 0, 2 * Math.PI)
	ctx.fillStyle = fillStyle(ctx, char, style, [-r, -r, r, r])
	ctx.fill()
	ctx.strokeStyle = "white"
	ctx.lineWidth = 0.6
	ctx.stroke(path2D(BADGE_PATHS.pointArc))
	drawHead(ctx, headSrc(char), r, POINT_HEAD_CLIP, headVisibility)
	ctx.translate(POINT_SIGN.x, POINT_SIGN.y)
	ctx.strokeStyle = value > 0 ? "#00ff00" : "#ff0000"
	ctx.stroke(path2D(value > 0 ? BADGE_PATHS.pointPlus : BADGE_PATHS.pointMinus))
	ctx.translate(-POINT_SIGN.x, -POINT_SIGN.y)
}

function drawBadge(ctx: CanvasRenderingContext2D, badge: BadgeLayout, style: StyleReader,
		font: string, headVisibility: number) {
	ctx.save()
	ctx.translate(badge.x, badge.y)
	switch (badge.type) {
		case 'regard': {
			const n = Math.max(Math.abs(badge.value), 1)
			for (let i = 0; i < n; i++) {
				drawPoint(ctx, badge.char, badge.value, style, headVisibility)
				ctx.translate(-BADGE_SIZE, 0)
			}
			break
		}
		case 'flag': {
			const { flag } = badge
			drawFlag(ctx, style.color(FLAG_BACKGROUND), () => drawText(ctx, flag, 0, 1.6, font))
			break
		}
		case 'select': {
			const { n = -1 } = badge
			ctx.fillStyle = style.stroke(badge.link).color
			ctx.fill(path2D(BADGE_PATHS.select))
			drawText(ctx, n >= 0 ? `${n+1}` : "?", 0, 1.45, font)
			break
		}
		case 'ending':
			drawShape(ctx, BADGE_PATHS.route, fillStyle(ctx, badge.char, style, [-3, -3.5, 3, 3]))
			drawHead(ctx, headSrc(badge.char), ROUTE_HEAD_RADIUS, ROUTE_HEAD_CLIP, headVisibility)
			break
		case 'condition': {
			const c = COND_UNIT
			ctx.save()
			ctx.rotate(badge.angle * Math.PI / 180)
			drawShape(ctx, BADGE_PATHS.cond, fillStyle(ctx, badge.fill, style, [-c, -c, c, c * 1.5]))
			ctx.restore()
			if (badge.negative)
				drawStrike(ctx)
			if (badge.icon == HEAD_ICON) {
				ctx.save()
				ctx.translate(badge.iconX, badge.iconY - COND_HEAD.raise)
				drawHead(ctx, headSrc(badge.fill as CharId), COND_HEAD.radius, COND_HEAD_CLIP,
					headVisibility)
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
				drawText(ctx, badge.icon, badge.iconX, badge.iconY, font, "white",
					badge.negative ? style.color(FLAG_BACKGROUND) : undefined)
			}
			break
		}
	}
	ctx.restore()
}

export function createBadgesDrawer(flowchart: GameFlowchart, nodes: FcNode[]): FcOverlayDrawer {
	const badges = nodes.flatMap(node => getBadgesLayout(node, flowchart))
	for (const badge of badges) {
		if (badge.type == 'regard' || badge.type == 'ending')
			getHeadImage(headSrc(badge.char))
	}
	return (ctx, view, style) => {
		const font = style.property('--ui-font') || 'sans-serif'
		const heads = detailsVisibility(ctx)
		ctx.lineCap = 'round'
		ctx.textAlign = 'center'
		for (const badge of badges) {
			if (badge.x > view.left && badge.x < view.right
					&& badge.y > view.top && badge.y < view.bottom)
				drawBadge(ctx, badge, style, font, heads)
		}
	}
}
