import { ComponentProps } from 'react';
import classNames from 'classnames';
import styles from './fixedfooter.module.scss';
import Ornament from "@assets/images/ornament.webp"

const FixedFooterOrnaments = ({ children, className, ...props }: ComponentProps<'footer'>) => {
	return (<>
		<img src={Ornament} alt="" className={styles.leftOrnament} />
		<img src={Ornament} alt="" className={styles.rightOrnament} />
		<footer className={classNames(styles.footer, className)} {...props}>
			<div className={styles.footerContent}>
				{children}
			</div>
		</footer>
		</>
	)
}

export default FixedFooterOrnaments