import styles from './page.module.css'
import ViewerComponent  from './components/Viewer/Viewer.Component'
export default function Home() {
  return (
    <div className={styles.container}>
        <ViewerComponent />
    </div>
  )
}
