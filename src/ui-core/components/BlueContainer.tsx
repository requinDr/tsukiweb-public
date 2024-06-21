import { HTMLAttributes, PropsWithChildren } from 'react';
import styles from '../styles/smallcomponents.module.scss';

type BlueContainerProps = {

}

const BlueContainer = ({ children, ...props }: HTMLAttributes<HTMLDivElement> & PropsWithChildren<BlueContainerProps>) => {
	const { className } = props

	return (
		<div {...props} className={`${styles.blueContainer} ${className}`}>
			{children}
		</div>
	)
}

export default BlueContainer