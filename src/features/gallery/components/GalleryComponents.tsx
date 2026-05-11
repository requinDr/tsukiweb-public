import { MdLock } from "react-icons/md"

type GalleryTotalProps = {
	nbUnlocked: number
	nbTotal: number
}
export const GalleryTotal = ({nbUnlocked, nbTotal}: GalleryTotalProps) => {
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