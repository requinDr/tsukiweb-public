import { Link } from "react-router-dom"
import { TSForceType, innerText } from "./utils"
import { Fragment, PropsWithoutRef, ReactNode, cloneElement, memo, useEffect, useReducer, useRef } from "react"
import Timer from "./timer"


type TagTranslator<T=string|undefined> = (tag: string, content: Array<string|JSX.Element>, arg: T, props?: Record<string, any>)=> JSX.Element

//[/?<tag>(=<arg>)?/?]
const bbcodeTagRegex = /\[(?<tag>\/?\w*)(=(?<arg>([^\/\]]|\/(?!\]))+))?(?<leaf>\/)?\]/g

//##############################################################################
//#                             BBCODE TAG TO JSX                              #
//##############################################################################

const simple: TagTranslator = (tag, content, _, props?)=> {
  const Tag = tag as 'b'|'i'|'s'|'sup'|'sub'
  return <Tag {...(props ?? {})}>{content}</Tag>
}

const leaf: TagTranslator = (tag, content, _, props?)=> {
  const Tag = tag as 'br'|'wbr'
  const {key, ...attrs} = props as PropsWithoutRef<any>
  if (content.length == 0)
    return <Tag {...props}/>
  else if (attrs && Object.getOwnPropertyNames(attrs).length > 0)
    return <span {...props}><Tag/>{content}</span>
  else
    return <Fragment key={key}><Tag/>{content}</Fragment>
}

const styled: TagTranslator<Record<string, any>> = (tag, content, style, props?)=> {
  const Tag = tag as 'span'
  let {style: _s, ...attrs} = props || {}
  style = {
    ...style,
    ...(_s || {})
  }
  return <Tag {...(attrs ?? {})} style={style}>{content}</Tag>
}

const align: TagTranslator = (tag, content, arg, props?)=> {
  const width = arg ? `${arg}em` : "100%"
  return styled('span', content,
    { textAlign: tag, display: "inline-block", width },
    props)
}

const url: TagTranslator = (_, content, arg, props?)=> {
  if (!arg)
    arg = innerText(content)
  if (arg?.startsWith("'") && arg.endsWith("'"))
    arg = arg.substring(1, arg.length-1)
  if (arg.lastIndexOf('.') > arg.lastIndexOf('/') || arg.startsWith("http"))
    return <a href={arg} target="_blank" {...(props || {})}>{...content}</a>
  else
    return <Link to={arg} {...(props || {})}>{...content}</Link>
}

const line: TagTranslator = (_, content, arg, props?)=> {
  const n = parseInt(arg || "1")
  const {key, className: insertClass, ...attrs} = props ?? {}
  let className = 'dash'
  if (insertClass) className += insertClass
  return <Fragment key={key}>
    {simple('span', ["\u{2002}".repeat(n)/*en-dash-sized space*/], "",
            {className, ...attrs})}
    {content}
  </Fragment>
}

/**
 * The default bbcode dictionary used to convert bbcode to JSX.
 * New dictionaries should extend it.
 */
export const defaultBBcodeDict: Record<string, TagTranslator> = {
  '': (_, content, _a, props)=> simple('span', content, _, props),
  'br' : leaf,
  'wbr' : leaf,
  'b' : simple,
  'i' : simple,
  's' : simple,
  'sup' : simple,
  'sub' : simple,
  'u' : (_, content, _a, props)=> styled('span', content, {textDecoration: "underline"}, props),
  'size' : (_, content, arg, props)=> styled('span', content, {fontSize: arg}, props),
  'font': (_, content, arg, props)=> styled('span', content, {fontFamily: arg}, props),
  'color' : (_, content, arg, props)=> styled('span', content, {color: arg, textShadow: "none"}, props),
  'opacity': (_, content, arg, props)=> styled('span', content, {opacity: arg}, props),
  'hide': (_, content, _a, props)=> styled('span', content, {visibility: "hidden"}, props),
  'center': align,
  'left': align,
  'right': align,
  'url': url,
  'line': line,
  'copy': (_, content, _a, props)=> <span {...props}>&copy;{content}</span>,
  'class': (_, content, arg, props)=> <span className={arg} {...props}>{content}</span>,
}

//##############################################################################
//#                            TEXT TO BBCODE TREE                             #
//##############################################################################

type BbNode = {tag: string, arg: string, content: (BbNode|string)[]}

function tagToJSX({tag, arg, content}: BbNode, dict: typeof defaultBBcodeDict,
                  props?: Record<string, any>): JSX.Element {
  const transform = dict[tag]
  if (!transform)
    throw Error(`Unknown bbcode tag ${tag}`)
  const children = content.map((n, i)=>
      n.constructor == String ?
        <Fragment key={i}>{n}</Fragment>
      : tagToJSX(n as BbNode, dict, {key: i})
  )
  return transform(tag, children, arg, props)
}

function createTree(text: string): BbNode {
  const nodes = [{tag:"", arg: "", content:[]} as BbNode]
  let lastIndex = 0
  text = text.replaceAll("\n", "[br/]")
  let m
  while ((m = bbcodeTagRegex.exec(text)) !== null) {
    let {tag, arg, leaf} = m.groups ?? {}
    const currNode = nodes[nodes.length-1]
    if (m.index != lastIndex) {
      const subText = text.substring(lastIndex, m.index)
      currNode.content.push(subText)
    }
    lastIndex = bbcodeTagRegex.lastIndex
    if (tag.startsWith('/')) {
      if ((tag.length > 1 && tag.substring(1) != currNode?.tag) || nodes.length == 1)
        throw Error(`Unmatched [${tag}] in "${text}"`)
      nodes.pop()
    } else {
      const node = {tag, arg, content: []}
      currNode.content.push(node)
      if (!leaf)
        nodes.push(node)
    }
  }
  if (lastIndex < text.length) // unclosed tag
    nodes[nodes.length-1].content.push(text.substring(lastIndex))
  return (nodes.length > 1 && nodes[0].content.length == 1) ? nodes[1] : nodes[0]
}

/**
 * Check if the texts has unclosed bbcode tags.
 * If it has, add as many '[/]' as required at the end of the text
 * to close them.
 * @param text string with bbcode tags
 * @returns the input text with all bbcode tags closed
 */
export function closeBB(text: string): string {
  const openCount = Array.from(text.matchAll(/\[\w+(=(\/?[^\]\/]+)+)?\]/g)).length
  const closeCount = Array.from(text.matchAll(/\[\/\w*\]/g)).length
  if (openCount == closeCount)
    return text
  else return text + '[/]'.repeat(openCount-closeCount)
}

/**
 * Convert the text to JSX components by extracting and converting bbcode tags.
 * @param text string with bbcode tags
 * @param props props to add to the root component
 * @param dict dictionary of translation functions from bbcode tags to JSX components.
 * @see {@link defaultBBcodeDict}.
 * @returns the JSX component made from converting the bbcode text
 */
export function bb(text: string, props?: Record<string, any>, dict=defaultBBcodeDict) {
  const root = createTree(text)
  return tagToJSX(root, dict, props)
}

function innerBbText(node: BbNode): string {
  if (node.tag == "hide")
    return " "
  if (node.tag == "line")
    return "-".repeat(parseInt(node.arg))
  return node.content.reduce<string>((str, child)=> {
    if (child.constructor == String)
      return str + child
    return str + innerBbText(child as BbNode)
  }, "")
}

/**
 * Extract the visible text from the string with bbcode tags.
 * Remove hidden content (with [hide]), and converts [line=n] to n times '-'.
 * @param text string with bbcode tags to extract visible text from
 * @returns the extracted text
 */
export function noBb(text: string): string {
  if (text)
    return innerBbText(createTree(text))
  else
    return ""
}

//##############################################################################
//#                                 COMPONENTS                                 #
//##############################################################################

//___________________________________<Bbcode>___________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

type Props = {
  text: string,
  dict?: typeof defaultBBcodeDict,
  rootPrefix?: ReactNode,
  rootSuffix?: ReactNode
} & React.ComponentPropsWithoutRef<"span">

export const Bbcode = memo(({text, dict = defaultBBcodeDict, rootPrefix: prefix, rootSuffix: suffix, ...props}: Props)=> {
  let root = bb(text, props, dict)
  if (prefix || suffix) {
    root = cloneElement(root, undefined, [prefix, ...root.props.children, suffix])
  }
  return root
})

//________________________________<BBTypeWriter>________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function hideTree(root: Readonly<BbNode>, indices: number[], hideTag: string|undefined, hideArg: string) : BbNode|undefined {
  let i = indices[0]
  if (i == root.content.length)
    return root
  if (i == 0 && indices.length == 1)
    return hideTag ? {tag: hideTag, arg: hideArg, content: [root]} : undefined
  const content = root.content.slice(0, i)
  let cutIdx = i
  if (indices.length > 1) {
    const current = root.content[i]
    if (current.constructor == String) {
      i = indices[1]
      if (i > 0)
        content.push(current.substring(0,i))
      if (hideTag && i < current.length) {
        const hiddenTxt = current.substring(i)
        content.push({tag: hideTag, arg: hideArg, content: [hiddenTxt]})
      }
    } else {
      const partial = hideTree(current as BbNode, indices.slice(1), hideTag, hideArg)
      if (partial)
        content.push(partial)
    }
    cutIdx++
  }
  if (hideTag && cutIdx < root.content.length) {
    content.push({tag: hideTag, arg: hideArg, content: root.content.slice(cutIdx)})
  }
  return {...root, content}
}

//....... tree-walking functions .......

function moveCursors(path: (BbNode|string)[], indices: number[], level: number) {
  const node = path[level]
  const index = indices[level]
  const content = (node.constructor == String) ? node : (node as BbNode).content
  if (index >= content.length) {
    return true
  } else if (content.constructor == String) {
    indices[level]++
  } else {
    TSForceType<(string|BbNode)[]>(content)
    if (level == path.length-1) {
      path.push(content[index])
      indices.push(0)
    }
    if (moveCursors(path, indices, level+1)) {
      indices[level]++
      path.splice(level+1)
      indices.splice(level+1)
    }
  }
  return false
}

function atEnd(path: (BbNode|string)[], cursors: number[]) {
  const lastNode = path[path.length-1]
  if (lastNode.constructor == String) {
    if (cursors[cursors.length-1] < lastNode.length)
      return false
  } else if (cursors[cursors.length-1] < (lastNode as BbNode).content.length)
    return false
  for (let i=0; i < path.length; i++) {
    const node = path[i]
    const content = (node.constructor == String) ? node : (node as BbNode).content
    const end = (i < path.length) ? content.length-1 : content.length
    if (cursors[i] < end)
      return false
  }
  return true
}

function pathToEnd(root: BbNode): [(string|BbNode)[], number[]] {
  const path: (string|BbNode)[] = [root]
  const cursors: number[] = []
  while (path[path.length-1].constructor != String && (path[path.length-1] as BbNode).content.length > 0) {
    const node = path[path.length-1] as BbNode
    const i = node.content.length-1
    cursors.push(i)
    path.push(node.content[i])
  }
  const lastNode = path[path.length-1]
  if (lastNode.constructor == String)
    cursors.push(lastNode.length)
  else
    cursors.push((lastNode as BbNode).content.length)
  return [path, cursors]
}

function pathFromCursors(root: BbNode, cursors: number[]): (string|BbNode)[] {
  const path: (string|BbNode)[] = [root]
  let lastNode: string|BbNode = root
  for (let i=0; i < cursors.length-1; i++) {
    if (lastNode.constructor == String)
      throw Error("Error while retrieving path in bbcode: Unexpected string")
    lastNode = (lastNode as BbNode).content[cursors[i]]
    path.push(lastNode)
  }
  return path
}

//............. component ..............

type TWProps = Props & {
  charDelay: number,
  startIndex?: number,
  restartOnAppend?: boolean,
  hideTag?: string,
  hideTagArg?: string
  onFinish?: VoidFunction
}

export const BBTypeWriter = memo(({text, dict = defaultBBcodeDict, charDelay, rootPrefix,
    rootSuffix, restartOnAppend=false, hideTag=undefined, hideTagArg="",
    onFinish, ...props}: TWProps)=> {
  const root = useRef<BbNode>()
  const prevText = useRef<string>("")
  const cursors = useRef<number[]>([0])
  const path = useRef<(BbNode|string)[]>([])
  const [tree, updateTree] = useReducer(()=>
    root.current ? hideTree(root.current, cursors.current, hideTag, hideTagArg) : undefined, undefined)
  const finishCallback = useRef<VoidFunction>()

  //useTraceUpdate("[BBTW] "+ text, {text, dict, charDelay, restartOnAppend, hideTag, hideTagArg, onFinish, hideTree, ...props})
  
  const timer = useRef<Timer>(new Timer(charDelay, ()=> {
    if (atEnd(path.current, cursors.current)) {
      finishCallback.current?.()
      timer.current.stop()
    } else {
      moveCursors(path.current, cursors.current, 0)
      updateTree()
    }
  }, true))

  useEffect(()=> { finishCallback.current = onFinish }, [onFinish])

  useEffect(()=> {
    if (text == prevText.current)
      return
    root.current = createTree(text)
    if (charDelay == 0) {
      [path.current, cursors.current] = pathToEnd(root.current)
      finishCallback.current?.()
    } else {
      if (restartOnAppend || prevText.current == "" || !text.startsWith(prevText.current)) {
        cursors.current = [0]
        path.current = [root.current]
      } else {
        path.current = pathFromCursors(root.current, cursors.current)
      }
      timer.current.start()
    }
    prevText.current = text
    updateTree()
  }, [text])

  useEffect(()=> {
    if (charDelay == 0) {
      if (root.current)
        [path.current, cursors.current] = pathToEnd(root.current)
      updateTree()
      timer.current.stop()
      finishCallback.current?.()
    }
  }, [charDelay])

  let resultNode = (tree) ? tagToJSX(tree, dict, props) : undefined
  if (rootPrefix || rootSuffix) {
    rootPrefix = <Fragment key="prefix">{rootPrefix}</Fragment>
    rootSuffix = <Fragment key="suffix">{rootSuffix}</Fragment>
    resultNode = resultNode ? cloneElement(resultNode, undefined, [rootPrefix, ...resultNode.props.children, rootSuffix])
               : <>{rootPrefix}{rootSuffix}</>
  }
  return resultNode
  
})
