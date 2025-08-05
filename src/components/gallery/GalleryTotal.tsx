type Props = {
	nbTotal: number
	nbUnlocked: number
}

const GalleryTotal = ({nbTotal, nbUnlocked}: Props) => {
	return (
		<div className="alternative">
			{nbUnlocked}/{nbTotal}
		</div>
	)
}

export default GalleryTotal