import classNames from "classnames"
import { ComponentProps } from "react"
import { TitleMenuButton } from "@tsukiweb/common/ui-core"
import { audio } from "engine/audio"
import { useStrings } from "translation/lang"
import styles from "./page-back-button.module.scss"

type Props = Omit<ComponentProps<typeof TitleMenuButton>, "audio" | "children">

const PageBackButton = ({ className, ...props }: Props) => {
	const strings = useStrings()

	return (
		<TitleMenuButton
			{...props}
			audio={audio}
			className={classNames(styles.backButton, className)}
			nav-auto={1}
		>
			{`<<`} {strings.back}
		</TitleMenuButton>
	)
}

export default PageBackButton
