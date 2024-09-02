import '../styles/endings.scss'
import { SCREEN } from '../utils/display'
import { useLanguageRefresh } from '../components/hooks/useLanguageRefresh'
import { useScreenAutoNavigate } from '../components/hooks/useScreenAutoNavigate'


const PlusDiscScreen = () => {
	useScreenAutoNavigate(SCREEN.PLUS_DISC)
	useLanguageRefresh()

	return (
		<div className="page" id="plus-disc">
			<main>
				
			</main>
		</div>
	)
}

export default PlusDiscScreen