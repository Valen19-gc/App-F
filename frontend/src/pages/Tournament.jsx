import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styles from './Tournament.module.css'

const API = '/api'

export default function Tournament() {
  const [tournaments, setTournaments] = useState([])
  const [players, setPlayers] = useState([])
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetch(`${API}/players`).then(r => r.json()).then(setPlayers)
    fetchTournaments()
  }, [])

  async function fetchTournaments() {
    const res = await fetch(`${API}/tournaments`)
    setTournaments(await res.json())
  }

  async function createTournament(e) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API}/tournaments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      navigate(`/tournament/${data.tournament.id}`)
    } catch (e) { setError(e.message); setLoading(false) }
  }

  async function deleteTournament(id, e) {
    e.preventDefault(); e.stopPropagation()
    if (!confirm('Eliminar este torneo?')) return
    await fetch(`${API}/tournaments/${id}`, { method: 'DELETE' })
    fetchTournaments()
  }

  const canCreate = players.length === 7

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>TORNEOS</h1>
      {!canCreate && (
        <div className={styles.warning}>
          Necesitas 7 jugadores. Actualmente tienes {players.length}.{' '}
          <Link to="/players">Ir a Jugadores</Link>
        </div>
      )}
      {canCreate && (
        <div className={styles.createBox}>
          <h2 className={styles.createTitle}>Nuevo Torneo</h2>
          <p className={styles.createHint}>Las rondas se generan automaticamente. Tu decides cuando terminar.</p>
          <form onSubmit={createTournament} className={styles.form}>
            <input className={styles.input} value={name} onChange={e => setName(e.target.value)} placeholder="Nombre del torneo (ej. Fiesta de Samu)" maxLength={50} />
            <button className={styles.createBtn} type="submit" disabled={loading || !name.trim()}>
              {loading ? 'Generando...' : '🎲 Empezar Torneo'}
            </button>
          </form>
          {error && <p className={styles.error}>⚠ {error}</p>}
        </div>
      )}
      {tournaments.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Torneos anteriores</h2>
          <div className={styles.list}>
            {tournaments.map(t => (
              <Link key={t.id} to={`/tournament/${t.id}`} className={styles.tournamentCard}>
                <div>
                  <div className={styles.tName}>{t.name}</div>
                  <div className={styles.tDate}>{new Date(t.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                </div>
                <div className={styles.tActions}>
                  <span className={styles.tStatus} data-status={t.status}>{t.status === 'finished' ? 'Finalizado' : 'Activo'}</span>
                  <button className={styles.deleteBtn} onClick={(e) => deleteTournament(t.id, e)}>✕</button>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
