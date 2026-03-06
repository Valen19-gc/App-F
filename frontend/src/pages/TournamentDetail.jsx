import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import styles from './TournamentDetail.module.css'

const API = '/api'

export default function TournamentDetail() {
  const { id } = useParams()
  const [tournament, setTournament] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [activeRound, setActiveRound] = useState(0)

  useEffect(() => { fetchTournament(); fetchLeaderboard() }, [id])

  async function fetchTournament() {
    const res = await fetch(`${API}/tournaments/${id}`)
    const data = await res.json()
    setTournament(data)
    const firstIncomplete = data.rounds?.findIndex(r => r.matches.some(m => !m.result))
    setActiveRound(firstIncomplete >= 0 ? firstIncomplete : 0)
  }

  async function fetchLeaderboard() {
    const res = await fetch(`${API}/tournaments/${id}/leaderboard`)
    setLeaderboard(await res.json())
  }

  async function saveResult(matchId, winnerTeam, s1, s2) {
    await fetch(`${API}/tournaments/result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId, winnerTeam, scoreTeam1: parseInt(s1)||0, scoreTeam2: parseInt(s2)||0 })
    })
    fetchTournament(); fetchLeaderboard()
  }

  if (!tournament) return <div className={styles.loading}>Cargando...</div>

  const round = tournament.rounds?.[activeRound]
  const foosMatch = round?.matches.find(m => m.game === 'foosball')
  const billMatch = round?.matches.find(m => m.game === 'billiard')

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <Link to="/tournament" className={styles.back}>← Torneos</Link>
        <h1 className={styles.title}>{tournament.name}</h1>
      </div>
      <div className={styles.layout}>
        <div className={styles.roundsPanel}>
          <div className={styles.panelTitle}>RONDAS</div>
          <div className={styles.roundTabs}>
            {tournament.rounds?.map((r, i) => {
              const done = r.matches.every(m => m.result)
              return (
                <button key={r.id} className={styles.roundTab} data-active={i === activeRound} data-done={done} onClick={() => setActiveRound(i)}>
                  <span>Ronda {r.round_number}</span>
                  {done && <span>✓</span>}
                </button>
              )
            })}
          </div>
          {round && (
            <div className={styles.roundDetail}>
              <div className={styles.restBadge}>Descansa: <strong>{round.resting?.name}</strong></div>
              {foosMatch && <MatchCard match={foosMatch} icon="⚽" label="FUTBOLIN" onSave={(w,s1,s2) => saveResult(foosMatch.id,w,s1,s2)} />}
              {billMatch && <MatchCard match={billMatch} icon="🎱" label="BILLAR" onSave={(w,s1,s2) => saveResult(billMatch.id,w,s1,s2)} />}
            </div>
          )}
        </div>
        <div className={styles.leaderboardPanel}>
          <div className={styles.panelTitle}>CLASIFICACION</div>
          <div className={styles.board}>
            {leaderboard.map((p, i) => (
              <div key={p.id} className={styles.boardRow} data-pos={i+1}>
                <span className={styles.pos}>{i === 0 ? '👑' : i+1}</span>
                <span className={styles.pName}>{p.name}</span>
                <div className={styles.pStats}>
                  <span className={styles.pts}>{p.points}<small>pts</small></span>
                  <span className={styles.stat}>{p.wins}V / {p.played - p.wins}D</span>
                </div>
              </div>
            ))}
            {leaderboard.length === 0 && <p className={styles.empty}>Aun no hay resultados</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

function MatchCard({ match, icon, label, onSave }) {
  const team1 = match.players.filter(p => p.team === 1)
  const team2 = match.players.filter(p => p.team === 2)
  const [s1, setS1] = useState('')
  const [s2, setS2] = useState('')
  const hasResult = !!match.result

  return (
    <div className={styles.matchCard} data-done={hasResult}>
      <div className={styles.matchHeader}>
        <span>{icon}</span>
        <span className={styles.matchLabel}>{label}</span>
        {hasResult && <span className={styles.resultBadge}>Registrado</span>}
      </div>
      <div className={styles.teams}>
        <div className={styles.team} data-winner={hasResult && match.result.winner_team === 1}>
          {team1.map(p => <span key={p.id} className={styles.playerChip}>{p.name}</span>)}
          {hasResult && <span className={styles.teamScore}>{match.result.score_team1}</span>}
        </div>
        <span className={styles.vs}>VS</span>
        <div className={styles.team} data-winner={hasResult && match.result.winner_team === 2}>
          {team2.map(p => <span key={p.id} className={styles.playerChip}>{p.name}</span>)}
          {hasResult && <span className={styles.teamScore}>{match.result.score_team2}</span>}
        </div>
      </div>
      {!hasResult && (
        <div className={styles.resultForm}>
          <div className={styles.scoreInputs}>
            <div className={styles.scoreGroup}>
              <label>{team1.map(p => p.name).join(' + ')}</label>
              <input type="number" min="0" value={s1} onChange={e => setS1(e.target.value)} placeholder="0" className={styles.scoreInput} />
            </div>
            <span className={styles.scoreSep}>—</span>
            <div className={styles.scoreGroup}>
              <label>{team2.map(p => p.name).join(' + ')}</label>
              <input type="number" min="0" value={s2} onChange={e => setS2(e.target.value)} placeholder="0" className={styles.scoreInput} />
            </div>
          </div>
          <div className={styles.winBtns}>
            <button className={styles.winBtn} onClick={() => onSave(1,s1,s2)}>Gana {team1.map(p=>p.name).join('+')}</button>
            <button className={styles.winBtn} onClick={() => onSave(2,s1,s2)}>Gana {team2.map(p=>p.name).join('+')}</button>
          </div>
        </div>
      )}
    </div>
  )
}
