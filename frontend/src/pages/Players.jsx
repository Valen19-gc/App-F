import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import styles from './Players.module.css'

const API = '/api'

export default function Players() {
  const [players, setPlayers] = useState([])
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetchPlayers() }, [])

  async function fetchPlayers() {
    const res = await fetch(`${API}/players`)
    setPlayers(await res.json())
  }

  async function addPlayer(e) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API}/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() })
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      setName(''); fetchPlayers()
    } catch (e) { setError(e.message) }
    setLoading(false)
  }

  async function removePlayer(id) {
    await fetch(`${API}/players/${id}`, { method: 'DELETE' })
    fetchPlayers()
  }

  const count = players.length
  const ready = count === 7

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>JUGADORES</h1>
          <p className={styles.sub}>Necesitas exactamente 7 jugadores para empezar</p>
        </div>
        <div className={styles.counter} data-ready={ready}>
          <span className={styles.countNum}>{count}</span>
          <span className={styles.countOf}>/7</span>
        </div>
      </div>
      <form onSubmit={addPlayer} className={styles.form}>
        <input className={styles.input} value={name} onChange={e => setName(e.target.value)} placeholder="Nombre del jugador..." maxLength={30} disabled={count >= 7} />
        <button className={styles.btn} type="submit" disabled={loading || count >= 7}>{loading ? '...' : '+ Añadir'}</button>
      </form>
      {error && <p className={styles.error}>⚠ {error}</p>}
      <div className={styles.list}>
        {players.map((p, i) => (
          <div key={p.id} className={styles.player}>
            <span className={styles.playerIdx}>{i + 1}</span>
            <span className={styles.playerName}>{p.name}</span>
            <button className={styles.removeBtn} onClick={() => removePlayer(p.id)}>✕</button>
          </div>
        ))}
        {Array.from({ length: Math.max(0, 7 - count) }).map((_, i) => (
          <div key={`empty-${i}`} className={styles.playerEmpty}>
            <span className={styles.playerIdx}>{count + i + 1}</span>
            <span className={styles.playerName} style={{ color: 'var(--border)' }}>— vacio —</span>
          </div>
        ))}
      </div>
      {ready && <Link to="/tournament" className={styles.startBtn}>🎮 Crear Torneo</Link>}
    </div>
  )
}
