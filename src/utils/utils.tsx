import { JSONObject, JSONPrimitive, RecursivePartial } from "../types"
import { ReactElement, ReactNode, useEffect, useRef } from "react"

//##############################################################################
//#                            OBJECTS MANIPULATION                            #
//##############################################################################

export function objectMatch<T extends Record<PropertyKey, any>>(toTest: T, ref: RecursivePartial<T>, useSymbols=true): boolean {
  const props = [
      ...Object.getOwnPropertyNames(ref),
      ...(useSymbols ? Object.getOwnPropertySymbols(ref) : [])]
	for(const p of props) {
    if (!(p in toTest))
      return false
		if(ref[p] !== toTest[p]) {
      const refType = ref[p]?.constructor
      if (refType != toTest[p]?.constructor)
        return false
      if (refType != Object && refType != Array)
        return false
      if (!objectMatch(toTest[p], ref[p] as Exclude<typeof ref[typeof p], undefined>, useSymbols))
        return false
    }
	}
	return true;
}

export function objectsEqual(obj1: Record<PropertyKey, any>, obj2: Record<PropertyKey, any>, useSymbols=true) {
	return objectMatch(obj1, obj2, useSymbols) && objectMatch(obj2, obj1, useSymbols)
}

const primitiveTypes = [String, Number, BigInt, Symbol, Boolean, null, undefined] as Array<Function|null|undefined>

function isPrimitive(v: any) : v is string|number|BigInt|Symbol|boolean|null|undefined {
  return primitiveTypes.includes(v?.constructor)
}
export function deepAssign<Td extends Record<string,any>, Ts extends Td>(dest: Readonly<Td>, src: Readonly<Ts>,
  opts: {extend?: true, morphTypes?: true, clone: true}): Ts
export function deepAssign<Td extends Record<string,any>, Ts extends RecursivePartial<Td>>(dest: Readonly<Td>, src: Readonly<Ts>,
  opts: {extend?: boolean, morphTypes?: boolean, clone: true}): Td
export function deepAssign<Td extends Record<string,any>, Ts extends Td>(dest: Td, src: Readonly<Ts>,
  opts?: {extend?: true, morphTypes?: true, clone?: false}): Ts; // Td ⊂ Ts
export function deepAssign<Td extends Record<string, any>, Ts = RecursivePartial<Td>>(dest: Td, src: Readonly<Ts>,
  opts?: {extend?: boolean, morphTypes: false, clone?: false}): Td; // Td ⊃ Ts
export function deepAssign<Td extends Record<string,any>, Ts extends Record<string, any>>(dest: Td, src: Readonly<Ts>,
  opts: {extend: false, morphTypes: false, clone?: false}): Td; // only update values
export function deepAssign<Td extends Record<string,any>, Ts extends Record<keyof Td, Ts[keyof Td]>>(dest: Td, src: Readonly<Ts>,
  opts: {extend: false, morphTypes?: true, clone?: false}): {[K in keyof Td] : Ts[K]}; // update values and types

export function deepAssign<Td extends Record<string,any>, Ts extends Record<string, any>>(dest: Td, src: Readonly<Ts>,
  opts?: {extend?: boolean, morphTypes?: boolean, clone?: boolean}): Record<string, any>

export function deepAssign<Td extends Record<string,any>, Ts extends Record<string, any>>(dest: Td, src: Readonly<Ts>,
    {extend = true, morphTypes = true, clone = false} = {}): Record<string, any> {
  const res = clone ? {} : dest as Record<string, any>
  for (const p of Object.getOwnPropertyNames(src)) {
    let create = false
    let exists = Object.hasOwn(dest, p)
    const srcType = src[p]?.constructor
    if (!exists)
      create = extend
    else
      create = morphTypes && srcType != dest[p]?.constructor
    if (create) {
      if (isPrimitive(src[p]))
        res[p] = src[p]
      else if (srcType == Object)
        res[p] = deepAssign({}, src[p])
      else if (srcType == Array)
        res[p] = src[p].slice(0, src[p].length)
      else
        throw Error(`cannot deep-assign ${p as string}:${srcType}`)
    } else if (exists) {
      if (isPrimitive(src[p])) {
        res[p] = src[p]
      } else if (srcType == Object)
        res[p] = deepAssign(dest[p], src[p] as any, {extend, morphTypes, clone})
      else if (srcType == Array) {
        if (clone)
          res[p] = Array.from(src[p])
        else
          dest[p].splice(0, dest[p].length, ...(src[p] as Array<any>))
      }
      else
        throw Error(`cannot deep-assign ${p as string}:${srcType}`)
    }
  }
  if (clone) {
    for (const p of Object.getOwnPropertyNames(dest)) {
      if (!Object.hasOwn(src, p)) {
        if (isPrimitive(dest[p]))
          res[p] = dest[p]
        else if (Array.isArray(dest[p]))
          res[p] = Array.from(dest[p])
        else if (dest[p]?.constructor == Object)
          res[p] = deepAssign({}, dest[p], {extend, morphTypes, clone: false})
        else
          throw Error(`cannot clone ${p as string}:${dest[p].constructor}`)
      }
    }
  }
  return res
}

export function deepFreeze<T extends Record<PropertyKey, any>>(object: T): Readonly<T> {
  const props = Reflect.ownKeys(object)
  for (const p of props) {
    const value = object[p]
    if (value && ["object", "function"].includes(typeof value))
      deepFreeze(value)
  }
  return Object.freeze(object)
}

export function jsonDiff<T extends JSONObject>(obj: T, ref: Readonly<RecursivePartial<T>>) {
  const result: JSONObject = {}
  for (const p of Object.keys(obj)) {
    TSForceType<keyof T>(p)
    if (!Object.hasOwn(ref, p)) {
      if (isPrimitive(obj[p]))
        result[p] = ref[p] as JSONPrimitive
      else if (Array.isArray(obj[p])) {
        result[p] = Array.from(obj[p] as Array<JSONPrimitive|JSONObject>)
      } else {
        result[p] = deepAssign({}, obj[p] as JSONObject)
      }
    } else if (obj[p] == ref[p]) {
      continue
    } else if (isPrimitive(obj[p])) {
      result[p] = obj[p]
    } else if (Array.isArray(obj[p])) {
      const refArray = ref[p] as any[]
      const objArray = obj[p] as any[]
      if (objArray.length != refArray.length ||
          objArray.some((v, i) => v != refArray[i])) {
        result[p] = Array.from(objArray)
      }
    } else {
      const val = jsonDiff(obj[p] as JSONObject, ref[p] as JSONObject) as JSONObject
      if (Object.keys(val).length > 0)
        result[p] = val
    }
  }
  return result as RecursivePartial<T>
}

//##############################################################################
//#                              TEXT CONVERSION                               #
//##############################################################################

export function preprocessText(text: string) {
  text = text.replaceAll('|', '…')
  let m
  let result = ""
  while ((m = /[-―─]{2,}/g.exec(text)) !== null) {
    if (m.index > 0)
      result += text.substring(0, m.index)
    const len = m[0].length
    result += `[line=${len}/]`
    text = text.substring(m.index + len)
  }
  if (text.length > 0)
    result += text
  return result
}

export function innerText(jsx: ReactNode): string {
  switch (typeof jsx) {
    case null :
    case 'undefined' :
    case 'boolean' : return ''
    case 'number' : return (jsx as number).toString()
    case 'string' : return jsx as string
    default :
      if (Array.isArray(jsx))
        return (jsx as Array<ReactNode>).reduce<string>((str, node)=>str + innerText(node), "")
      if ((jsx as ReactElement).props.children) {
        return innerText((jsx as ReactElement).props.children)
      }
      return ""
  }
}

export function splitFirst(text: string, sep: string, position=0) : [string, string|null] {
  const i = text.indexOf(sep, position)
  if (i >= 0)
    return [text.substring(0, i), text.substring(i+1)]
  else
    return [text, null]
}

export function splitLast(text: string, sep: string, position=text.length) : [string, string|null] {
  const i = text.lastIndexOf(sep, position)
  if (i >= 0)
    return [text.substring(0, i), text.substring(i+1)]
  else
    return [text, null]
}

export function subTextCount(full: string, sub: string) : number {
    if (sub.length <= 0) return (full.length + 1)
    const step = sub.length
    let n = 0, pos = 0

    do {
        pos = full.indexOf(sub, pos)
        if (pos < 0)
          break
        n++
        pos += step
    } while (true);
    return n;
}

//##############################################################################
//#                                   OTHERS                                   #
//##############################################################################

export const addEventListener = ({event, handler, element = window}: any) => {
  element.addEventListener(event, handler)
  return () => element.removeEventListener(event, handler)
}

export function listParentNodes(element: Node|null): Array<Node> {
  const result = new Array<Node>()
  while (element) {
    result.unshift(element)
    element = element.parentNode
  }
  return result
}

export function getScrollableParent(element: Node, directions?: Array<"up"|"down"|"left"|"right">): HTMLElement|null {
  const tree = listParentNodes(element) as Array<HTMLElement>
  const up = directions?.includes('up') ?? true
  const down = directions?.includes('down') ?? true
  const left = directions?.includes('left') ?? true
  const right = directions?.includes('right') ?? true
  const y = up || down
  const x = left || right
  for (let i=tree.length-1; i>= 0; i--) {
    const {
      clientWidth: clientW, clientHeight: clientH, clientLeft: clientL, clientTop: clientT,
      scrollWidth: scrollW, scrollHeight: scrollH, scrollLeft: scrollL, scrollTop: scrollT
    } = tree[i]
    if (x && clientW != 0 && clientW < scrollW) {
      if (left && clientL > scrollL)
        return tree[i]
      if (right && clientL + clientW < scrollW - scrollL)
        return tree[i]
    }
    if (y && clientH != 0 && clientH < scrollH) {
      if (up && clientT > scrollT)
        return tree[i]
      if (down && clientT + clientH < scrollH - scrollT)
        return tree[i]
    }
  }
  return null
}

export function isDigit(str: string, index: number = 0) {
  const char = str.charAt(index)
  return char >= '0' && char <= '9'
}

export function negative(n: number) {
  return !Object.is(Math.abs(n), n)
}

/**
 * Let the user download the text in a text file
 * @param text content of the file to download
 * @param fileName default name of the file
 */
export function textFileUserDownload(text: string, fileName: string, contentType="text/plain") {
	let element = document.createElement('a');
	element.setAttribute('href', `data:${contentType};charset=utf-8,${encodeURIComponent(text)}`);
	element.setAttribute('download', fileName);
	element.style.display = 'none';
	document.body.appendChild(element);
	element.click();
	document.body.removeChild(element);
}

/**
 * requests one or multiple files from the user
 * See https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file
 * for more details on the {@link multiple} and {@link accept} parameters
 */
export function requestFilesFromUser({ multiple = false, accept = '' }): Promise<File|File[]|null> {
	return new Promise(((resolve) => {
		const input = document.createElement('input');
		input.setAttribute("type", "file");

		if (accept?.length > 0)
			input.setAttribute("accept", accept);

		if (multiple)
			input.toggleAttribute("multiple", true);

		input.addEventListener("change", ()=> {
			resolve(input.files as File|File[]|null);
		})
		input.click();
	}));
}

export async function requestJSONs({ multiple = false, accept = ''}) : Promise<Record<string,any>[]|null> {
  let files = await requestFilesFromUser(({multiple, accept}))
  if (!files)
    return null; // canceled by user
  if (files instanceof File)
    files = [files]
  const jsons = await Promise.all(Array.from(files).map(file=> {
    return new Promise<string>((resolve,reject) => {
      const reader = new FileReader()
      reader.readAsText(file)
      reader.onload = (evt) => {
        if (evt.target?.result?.constructor == String)
          resolve(evt.target.result)
        else
          reject(`cannot read save file ${file.name}`)
      }
    }).then(
      (text)=>JSON.parse(text),
      (errorMsg)=> {
        throw Error(errorMsg)
    })
  }));
  return jsons
}

export function toggleFullscreen() {
  if (isFullscreen())
    document.exitFullscreen()
  else
    document.documentElement.requestFullscreen()
}

export function isFullscreen() {
  return document.fullscreenElement !== null
}

export function resettable<T extends Record<PropertyKey, any>>(resetValue: Readonly<T>): [T, VoidFunction, Readonly<T>] {
  const value = deepAssign({}, resetValue) as T
  return [value, deepAssign.bind(null, value, resetValue, {}), resetValue]
}

export function isIterable(obj: any): obj is Iterable<any> {
  return typeof obj[Symbol.iterator] === 'function'
}

export function TSForceType<T>(_v: any): asserts _v is T {}

//##############################################################################
//#                                   DEBUG                                    #
//##############################################################################

export function useTraceUpdate(before: string, props: Record<string, any>) {
  const prev = useRef(props);
  useEffect(() => {
    const changedProps = Object.entries(props).reduce((ps, [k, v]) => {
      if (prev.current[k] !== v) {
        ps[k] = [prev.current[k], v];
      }
      return ps;
    }, {} as Record<string, any>);
    if (Object.keys(changedProps).length > 0) {
        console.debug(before, 'Changed props:', changedProps);
      } else {
      console.debug(before, 'No changed props');
    }
    prev.current = props;
  });
}