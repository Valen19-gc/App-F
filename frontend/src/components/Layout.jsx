import { Outlet, NavLink } from 'react-router-dom'
import styles from './Layout.module.css'

export default function Layout() {
  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🎮</span>
          <span className={styles.logoText}>PARTY<span>GAMES</span></span>
        </div>
        <nav className={styles.nav}>
          <NavLink to="/" end className={({ isActive }) => isActive ? styles.active : ''}>Inicio</NavLink>
          <NavLink to="/players" className={({ isActive }) => isActive ? styles.active : ''}>Jugadores</NavLink>
          <NavLink to="/tournament" className={({ isActive }) => isActive ? styles.active : ''}>Torneo</NavLink>
        </nav>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
