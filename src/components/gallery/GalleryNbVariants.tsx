import { MdPhotoLibrary } from "react-icons/md"

type Props = {
	nbVariants: number
	nbUnlocked: number
}

const GalleryNbVariants = ({nbVariants, nbUnlocked}: Props) => {
	return (
		<div className="alternative">
			{nbUnlocked}/{nbVariants} <MdPhotoLibrary />
		</div>
	)
}

export default GalleryNbVariants