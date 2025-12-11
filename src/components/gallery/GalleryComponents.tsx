import { MdLock } from "react-icons/md"

type GalleryTotalProps = {
	nbTotal: number
	nbUnlocked: number
}
export const GalleryTotal = ({nbTotal, nbUnlocked}: GalleryTotalProps) => {
	return (
		<div className="alternative">
			{nbUnlocked}/{nbTotal}
		</div>
	)
}

export const GalleryPlaceholderLocked = () => (
	<div className="placeholder">
		<MdLock size={24} />
	</div>
)