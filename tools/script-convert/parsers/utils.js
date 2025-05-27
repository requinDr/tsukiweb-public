
//##############################################################################
//#region                            TOKENS
//##############################################################################

class Token {
	/**
	 * @param {number} lineIndex
	 */
	constructor(lineIndex) {
		/** @type {number} */
		this.lineIndex = lineIndex
	}

	toString() {
		throw Error(`Unimplemented method 'toString'`)
	}
}

class TextToken extends Token {
	/**
	 * @param {number} lineIndex
	 * @param {string} text
	 */
	constructor(lineIndex, text) {
		super(lineIndex)
		/** @type {string} */
		this.text = text
	}

	toString() {
		return `\`${this.text}`
	}
}

class CommandToken extends Token {
	/**
	 * @param {number} lineIndex 
	 * @param {string} cmd 
	 * @param {(string|number)[]} args 
	 */
	constructor(lineIndex, cmd, args = []) {
		super(lineIndex)
		/** @type {string} */
		this.cmd = cmd
		/** @type {(string|number)[]} */
		this.args = args
	}

	toString() {
		let argsString
		if (this.args instanceof Map) {
			if (this.args.size == 0)
				argsString = ''
			else
				argsString = ` {${[...this.args.entries()].map(([k, v])=> `${k}=${v}`).join(',')}}`
		} else {
			if (this.cmd.startsWith('!'))
				argsString = `${this.args[0]}`
			else if (this.args.length == 0)
				argsString = ''
			else
				argsString = ' ' + [...this.args].join(',')
		}
		return `${this.cmd}${argsString}`
	}
}

class LabelToken extends Token {
	/**
	 * @param {number} lineIndex 
	 * @param {string} label 
	 */
	constructor(lineIndex, label) {
		super(lineIndex)
		/** @type {string} */
		this.label = label
	}

	toString() {
		return `*${this.label}`
	}
}

class ReturnToken extends Token {

	toString() {
		return 'return'
	}
}

class ConditionToken extends Token {
	/**
	 * @param {number} lineIndex 
	 * @param {boolean} not 
	 * @param {string} condition 
	 * @param {Token} command 
	 */
	constructor(lineIndex, not, condition, command) {
		super(lineIndex)
		/** @type {boolean} */
		this.not = not
		/** @type {string} */
		this.condition = condition // TODO normalize operators and spaces around them
		/** @type {Token} */
		this.command = command
	}
	toString() {
		return `${this.not? 'not':''}if (${this.condition}) ${this.command.toString()}`
	}
}

class ErrorToken extends Token {
	/**
	 * @param {number} lineIndex 
	 * @param {string} txt 
	 */
	constructor(lineIndex, txt) {
		super(lineIndex)
		/** @type {string} */
		this.txt = txt
	}
}
//#endregion ###################################################################
//#region                            READER
//##############################################################################

class StrReader {
	
	/**
	 * @param {string} str 
	 * @param {number} start 
	 */
	constructor(str, start = 0) {
		this._text = str
		this._index = start
		this._lineIndex = 0
	}

	get charIndex() {
		return this._index
	}

	get lineIndex() {
		return this._lineIndex
	}

//__________________________________movements___________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    /**
     * @returns {boolean}
     */
	atEnd() {
		return this._index >= this._text.length
	}

	/**
     * @param {number} position
     */
	moveTo(position) {
		if (position < 0)
			position = Math.max(0, this._text.length + position)
		else if (position > this._text.length)
			position = this._text.length

		if (position < this._index) {
			const subText = this._text.substring(position, this._index)
			const nbLineBreaks = (subText.match(/\n/g) || []).length
			this._lineIndex -= nbLineBreaks
		} else {
			const subText = this._text.substring(this._index, position)
			const nbLineBreaks = (subText.match(/\n/g) || []).length
			this._lineIndex += nbLineBreaks
		}
		this._index = position
	}

    /**
     * @param {number} offset
     */
	moveBy(offset) {
		// avoid negative indices that would loop to end of text.
		// going further than text length already handled by moveTo()
		this.moveTo(Math.max(0, this._index + offset))
	}

//_____________________________________peek_____________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    /**
     * @param {number} length
     * @returns {string}
     */
	peek(length) {
		const stop = Math.min(this._index + length, this._text.length)
		return this._text.substring(this._index, stop)
	}

    /**
     * @param {string|Regexp} strOrRegexp
     * @param {boolean} includeMatch
     * @returns {string}
     */
	peekUntil(strOrRegexp, includeMatch = false) {
		let index
		if (strOrRegexp.constructor == String) {
			index = this._text.indexOf(strOrRegexp, this._index)
			if (includeMatch)
				index += strOrRegexp.length
		} else {
			const text = this._text.substring(this._index)
			if (includeMatch) {
				const match = text.match(strOrRegexp)
				if (match)
					index = match.index + match[0].length
				else
					index = -1
			} else {
				index = text.search(strOrRegexp) + this._index
			}
		}

		if (index == -1)
			return this._text.substring(this._index)
		return this._text.substring(this._index, index)
	}
	
    /**
     * @param {string|Regexp} strOrRegexp
     * @returns {string|null}
     */
	peekMatch(strOrRegexp) {
		if (strOrRegexp.constructor == String) {
			const len = strOrRegexp.length
			if (this._text.substring(this._index, this._index + len) == strOrRegexp)
				return strOrRegexp
			else
				return null
		} else {
			const match = this._text.substring(this._index).match(strOrRegexp)
			if (match)
				return match[0]
			return null
		}
	}

    /**
     * @param {boolean} includeEnd
     * @returns {string}
     */
	peekLine(includeEnd = true) {
		const index = this._text.indexOf('\n', this._index)
		if (index == -1)
			return this._text.substring(this._index)
		if (includeEnd) {
			return this._text.substring(this._index, index+1)
		} else {
			if (this._text.charAt(index-1) == '\r')
				index -= 1 // also remove \r
			return this._text.substring(this._index, index)
		}
	}

    /**
     * @param {string|Regexp} strOrRegexp 
     * @param {boolean} includeMatch 
     * @param {boolean} includeEnd 
     * @returns 
     */
	peekLineUntil(strOrRegexp, includeMatch = false, includeEnd = true) {
		const line = this.peekLine(includeEnd)
		const r = StrReader(line)
		return r.peekUntil(strOrRegexp, includeMatch)
	}

//_____________________________________read_____________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    /**
     * @param {number} length
     * @returns {string}
     */
	read(length = this._text.length - this._index) {
		const result = this.peek(length)
		this.moveBy(result.length)
		return result
	}

    /**
     * @param {string|Regexp} strOrRegexp
     * @param {boolean} includeMatch
     * @returns {string}
     */
	readUntil(strOrRegexp, includeMatch = false) {
		const result = this.peekUntil(strOrRegexp, includeMatch)
		this.moveBy(result.length)
		return result
	}

	/**
	 * @param {string|RegExp} strOrRegexp 
	 * @return {string|null}
	 */
	readMatch(strOrRegexp) {
		const result = this.peekMatch(strOrRegexp)
		if (result)
			this.moveBy(result.length)
		return result
	}

    /**
     * @param {boolean} includeEnd 
     * @returns 
     */
	readLine(includeEnd = true) {
		const result = this.peekLine(True) // move index to next line even if not included
		this.moveBy(result.length)

		if (includeEnd || !result.endsWith('\n'))
			return result
		if (result.endsWith('\r\n'))
			return result.substring(0, result.length-2)
		else
			return result.substring(0, result.length-1)
	}

    /**
     * @param {string|Regexp} strOrRegexp 
     * @param {boolean} includeMatch 
     * @param {boolean} includeEnd 
     * @returns 
     */
	readLineUntil(strOrRegexp, includeMatch = False, includeEnd = True) {
		const result = this.peekLineUntil(strOrRegexp, includeMatch, includeEnd)
		this.moveBy(result.length)
		return result
	}
}

//#endregion ###################################################################
//#region                            EXPORTS
//##############################################################################

export {
	Token,
	TextToken,
	CommandToken,
	ConditionToken,
	ErrorToken,
	LabelToken,
	ReturnToken,
    StrReader
}