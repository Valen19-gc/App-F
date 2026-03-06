import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import styles from './TournamentDetail.module.css'

const API = '/api'

export default function TournamentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tournament, setTournament] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])

  useEffect(() => { fetchTournament(); fetchLeaderboard() }, [id])

  async function fetchTournament() {
    const res = await fetch(`${API}/tournaments/${id}`)
    setTournament(await res.json())
  }

  async function fetchLeaderboard() {
    const res = await fetch(`${API}/tournaments/${id}/leaderboard`)
    setLeaderboard(await res.json())
  }

  async function saveResult(matchId, winnerTeam) {
    await fetch(`${API}/tournaments/result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId, winnerTeam })
    })
    fetchTournament(); fetchLeaderboard()
  }

  async function finishTournament() {
    if (!confirm('Finalizar el torneo? Se mostrara el resultado final.')) return
    await fetch(`${API}/tournaments/${id}/finish`, { method: 'POST' })
    fetchTournament(); fetchLeaderboard()
  }

  if (!tournament) return <div className={styles.loading}>Cargando...</div>

  const isFinished = tournament.status === 'finished'
  const rounds = tournament.rounds || []
  const currentRoundIdx = tournament.currentRound ?? rounds.length - 1
  const currentRound = rounds[currentRoundIdx]

  // La ronda actual esta completa cuando todos sus matches tienen resultado
  const currentRoundDone = currentRound?.matches.every(m => m.result)

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <Link to="/tournament" className={styles.back}>← Torneos</Link>
        <div className={styles.headerRow}>
          <h1 className={styles.title}>{tournament.name}</h1>
          {!isFinished && (
            <button className={styles.finishBtn} onClick={finishTournament}>
              🏁 Finalizar Torneo
            </button>
          )}
          {isFinished && <span className={styles.finishedBadge}>🏆 Torneo Finalizado</span>}
        </div>
      </div>

      <div className={styles.layout}>
        <div className={styles.roundsPanel}>
          {/* Historial de rondas completadas */}
          {rounds.length > 1 && (
            <div className={styles.history}>
              <div className={styles.panelTitle}>RONDAS JUGADAS</div>
              <div className={styles.roundTabs}>
                {rounds.map((r, i) => {
                  const done = r.matches.every(m => m.result)
                  const isCurrent = i === currentRoundIdx
                  return (
                    <div key={r.id} className={styles.roundPill} data-done={done} data-current={isCurrent}>
                      R{r.round_number} {done ? '✓' : ''}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Ronda actual */}
          {currentRound && !isFinished && (
            <div className={styles.currentRound}>
              <div className={styles.panelTitle}>
                RONDA {currentRound.round_number}
                {currentRoundDone && <span className={styles.roundDoneBadge}>Completa</span>}
              </div>

              {currentRound.matches.map(match => (
                <MatchCard
                  key={match.id}
                  match={match}
                  icon={match.game === 'foosball' ? '⚽' : '🎱'}
                  label={match.game === 'foosball' ? 'FUTBOLIN' : 'BILLAR'}
                  onSave={(winnerTeam) => saveResult(match.id, winnerTeam)}
                />
              ))}

              {currentRoundDone && (
                <div className={styles.nextRoundMsg}>
                  ✅ Ronda completada — los resultados se han guardado.<br/>
                  La siguiente ronda se desbloqueara automaticamente.
                </div>
              )}
            </div>
          )}

          {isFinished && (
            <div className={styles.finishedMsg}>
              🏁 El torneo ha finalizado. Mira la clasificacion final.
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className={styles.leaderboardPanel}>
          <div className={styles.panelTitle}>{isFinished ? 'RESULTADO FINAL' : 'CLASIFICACION'}</div>
          <div className={styles.board}>
            {leaderboard.map((p, i) => (
              <div key={p.id} className={styles.boardRow} data-pos={i + 1}>
                <span className={styles.pos}>{i === 0 ? '👑' : i + 1}</span>
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
  const hasResult = !!match.result
  const isBilliard = label === 'BILLAR'

  return (
    <div className={styles.matchCard} data-done={hasResult}>
      <div className={styles.matchHeader}>
        <span>{icon}</span>
        <span className={styles.matchLabel}>{label}</span>
        {hasResult && <span className={styles.resultBadge}>✓ Listo</span>}
      </div>

      <div className={styles.teams}>
        <div className={styles.team} data-winner={hasResult && match.result.winner_team === 1}>
          <div className={styles.teamPlayers}>
            {team1.map(p => <span key={p.id} className={styles.playerChip}>{p.name}</span>)}
          </div>
          {isBilliard && <span className={styles.teamTag}>EQUIPO</span>}
        </div>
        <span className={styles.vs}>VS</span>
        <div className={styles.team} data-winner={hasResult && match.result.winner_team === 2}>
          <div className={styles.teamPlayers}>
            {team2.map(p => <span key={p.id} className={styles.playerChip}>{p.name}</span>)}
          </div>
          {isBilliard && <span className={styles.teamTag}>SOLO</span>}
        </div>
      </div>

      {!hasResult && (
        <div className={styles.winBtns}>
          <button className={styles.winBtn} data-team="1" onClick={() => onSave(1)}>
            🏆 Gana {team1.map(p => p.name).join(' + ')}
          </button>
          <button className={styles.winBtn} data-team="2" onClick={() => onSave(2)}>
            🏆 Gana {team2.map(p => p.name).join(' + ')}
          </button>
        </div>
      )}

      {hasResult && (
        <div className={styles.resultSummary}>
          🏆 Ganador: <strong>{match.players.filter(p => p.team === match.result.winner_team).map(p => p.name).join(' + ')}</strong>
        </div>
      )}
    </div>
  )
}
