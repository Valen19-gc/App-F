import { Link } from 'react-router-dom'
import styles from './Home.module.css'

export default function Home() {
  return (
    <div className={styles.wrap}>
      <div className={styles.hero}>
        <div className={styles.badge}>GENERADOR DE TORNEOS</div>
        <h1 className={styles.title}>LA NOCHE<br /><span>MAS EPICA</span></h1>
        <p className={styles.subtitle}>Organiza tu fiesta con futbolin y billar.<br />Equipos aleatorios, rondas equilibradas, ranking automatico.</p>
        <div className={styles.actions}>
          <Link to="/players" className={styles.btnPrimary}>Añadir Jugadores</Link>
          <Link to="/tournament" className={styles.btnSecondary}>Ver Torneos</Link>
        </div>
      </div>
      <div className={styles.cards}>
        <div className={styles.card}><div className={styles.cardIcon}>⚽</div><h3>Futbolin</h3><p>2 vs 2 — equipos aleatorios rotando cada ronda</p></div>
        <div className={styles.card}><div className={styles.cardIcon}>🎱</div><h3>Billar</h3><p>2 vs 1 — un valiente contra el equipo</p></div>
        <div className={styles.card}><div className={styles.cardIcon}>🏆</div><h3>Ranking</h3><p>Puntuacion automatica y clasificacion en tiempo real</p></div>
      </div>
      <div className={styles.howto}>
        <h2>Como funciona</h2>
        <div className={styles.steps}>
          {['Añade los 7 jugadores','Crea el torneo','Genera las rondas','Apunta resultados','Celebra al campeon'].map((s,i) => (
            <div className={styles.step} key={i}><span className={styles.stepNum}>{i+1}</span><span>{s}</span></div>
          ))}
        </div>
      </div>
    </div>
  )
}
