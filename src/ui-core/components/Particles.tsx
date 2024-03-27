import { memo } from "react"
import styles from "../styles/particles.module.scss"

const Particles = () => {
  return (
    <div className={styles.particles}>
      {Array.from({ length: 100 }, (_, index) =>
        <div className={styles.circleContainer} key={index}>
          <div className={styles.circle} />
        </div>
      )}
    </div>
  )
}

export default memo(Particles)