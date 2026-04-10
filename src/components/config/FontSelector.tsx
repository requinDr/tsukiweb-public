import { useState, useRef, useEffect } from 'react'
import { strings } from '../../translation/lang'
import { Button } from '@tsukiweb-common/ui-core'
import { loadGoogleFont } from 'utils/fonts'
import { DEFAULT_GAME_FONT } from '@tsukiweb-common/utils/settings'

const POPULAR_FONTS = [
	DEFAULT_GAME_FONT,
	'Noto Sans',
	'Noto Serif',
	'Noto Sans JP',
	'Noto Serif JP',
	'Sawarabi Mincho',
	'Kosugi Maru',
	'Playwrite IE',
]

type Props = {
	value: string
	onChange: (font: string) => void
}
const FontSelector = ({ value, onChange }: Props) => {
	const [inputValue, setInputValue] = useState(value)
	const [isLoading, setIsLoading] = useState(false)
	const inputRef = useRef<HTMLInputElement>(null)
	const timeoutRef = useRef<NodeJS.Timeout | null>(null)

	useEffect(() => {
		setInputValue(value)
	}, [value])

	const applyFont = async (fontName: string) => {
		const trimmed = fontName.trim()
		if (!trimmed) return
		
		if (trimmed === DEFAULT_GAME_FONT) {
			onChange(DEFAULT_GAME_FONT)
			return
		}

		setIsLoading(true)
		const success = await loadGoogleFont(trimmed)
		setIsLoading(false)
		
		if (success) {
			onChange(trimmed)
		}
	}

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = e.target.value
		setInputValue(newValue)
		
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current)
		}
		timeoutRef.current = setTimeout(() => {
			applyFont(newValue)
		}, 500)
	}

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current)
			}
			applyFont(inputValue)
		}
	}

	const handleReset = () => {
		setInputValue(DEFAULT_GAME_FONT)
		onChange(DEFAULT_GAME_FONT)
	}

	return (
		<div className="font-selector">
			<div className="config-input-wrapper">
				<input
					ref={inputRef}
					name="font"
					type="text"
					list="google-fonts-list"
					value={inputValue}
					onChange={handleInputChange}
					onKeyDown={handleKeyDown}
					placeholder={strings.config['default']}
					className={`config-input ${isLoading ? 'loading' : ''}`}
					style={{ fontFamily: value }}
					nav-auto={1}
					spellCheck={false}
				/>
				<datalist id="google-fonts-list">
					{POPULAR_FONTS.map(font => (
						<option key={font} value={font} />
					))}
				</datalist>
			</div>
			{value !== DEFAULT_GAME_FONT && (
				<Button
					onClick={handleReset}
					className="font-reset-btn"
					nav-auto={1}
				>
					{strings.config['default']}
				</Button>
			)}
		</div>
	)
}

export default FontSelector
