import { Dispatch, SetStateAction } from "react"
import styles from "../styles/tabs.module.scss"

export type Tab = {
	label: string,
	value: string
	disabled?: boolean
}

type TabsProps = {
	tabs: Tab[],
	selected: string,
	setSelected: Dispatch<SetStateAction<any>>
}

/**
 * Tabs with a default style applied
 */
const TabsComponent = ({ tabs, selected, setSelected }: TabsProps) => (
	<div className={styles.tabs}>
		{tabs.map(tab =>
			<TabBtn key={tab.value}
				text={tab.label}
				active={selected === tab.value}
				onClick={() => setSelected(tab.value)}
				disabled={tab.disabled}
			/>
		)}
	</div>
)

export default TabsComponent


type TabBtnProps = {
	text: string,
	active: boolean,
	onClick: ()=> void
	disabled?: boolean
}

const TabBtn = ({text, active, onClick, disabled}: TabBtnProps) => (
	<button className={`${styles.tab} ${active ? styles.active : ''}`}
		onClick={onClick}
		disabled={disabled}
	 >
		{text}
	</button>
)