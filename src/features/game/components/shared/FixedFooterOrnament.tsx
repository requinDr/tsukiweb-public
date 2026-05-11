import { ComponentProps } from 'react';
import styles from './fixedfooter.module.scss';
import { FixedFooter } from '@tsukiweb-common/ui-core';
import Ornament from "@assets/images/ornament.webp"

type Props = {
	children?: React.ReactNode
} & ComponentProps<typeof FixedFooter>
const FixedFooterOrnaments = ({ children, ...props }: Props) => {
	return (<>
		<img src={Ornament} alt="ornament" className={styles.leftOrnament} />
		<img src={Ornament} alt="ornament" className={styles.rightOrnament} />
		<FixedFooter className={styles.footer} {...props}>
			{children}
		</FixedFooter>
		</>
	)
}

export default FixedFooterOrnaments