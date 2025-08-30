import { avif } from "@tsukiweb-common/utils/images"
import GalleryImage from "components/gallery/GalleryImage"
import { imageSrc } from "translation/assets"
import { CHARACTERS_DATA, CharactersTabs, getImgBonus } from "utils/characters-data"

type Props = {
	char: CharactersTabs
}
const CharacterPanel = ({ char }: Props) => {
	const charData = CHARACTERS_DATA[char]
	const gallery = charData.images

	return (
		<div className="character-panel">
			<div className="header">
				<picture>
					<source srcSet={avif.replaceExtension(imageSrc(charData.sprite, "hd"))} type="image/avif"/>
					<img
						src={charData.sprite}
						alt={charData.name}
						draggable={false}
						className="illustration"
					/>
				</picture>

				<div className="infos">
					<h2>{charData.fullname}</h2>
					<table>
						<tbody>
							<tr>
								<th>Height</th>
								<td>{charData.height}</td>
							</tr>
							<tr>
								<th>Weight</th>
								<td>{charData.weight}</td>
							</tr>
							<tr>
								<th>Sex</th>
								<td>{charData.sex}</td>
							</tr>
							<tr>
								<th>Birthday</th>
								<td>{charData.birthday}</td>
							</tr>
							{charData.bloodType && (
								<tr>
									<th>Blood Type</th>
									<td>{charData.bloodType}</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>

			<div className="gallery-container">
				{gallery.map(img => {
					return (
						<GalleryImage
							key={img}
							image={img}
							gallery={gallery}
							galleryUnlocked={gallery}
							blurred={false}
							getGalleryImg={getImgBonus}
						/>
					)
				})}
			</div>
		</div>
	)
}

export default CharacterPanel