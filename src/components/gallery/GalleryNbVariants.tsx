type Props = {
	nbVariants: number
	nbUnlocked: number
}

const GalleryNbVariants = ({nbVariants, nbUnlocked}: Props) => {
	return (
		<div className="alternative">
			{nbUnlocked}/{nbVariants}
		</div>
	)
}

export default GalleryNbVariants