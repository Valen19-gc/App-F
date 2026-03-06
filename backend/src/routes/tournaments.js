const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { generateRounds } = require('../db/roundGenerator');

router.get('/', (req, res) => {
  res.json(getDb().prepare('SELECT * FROM tournaments ORDER BY created_at DESC').all());
});

router.post('/', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Nombre requerido' });
  const db = getDb();
  const players = db.prepare('SELECT * FROM players').all();
  if (players.length !== 7) return res.status(400).json({ error: `Necesitas 7 jugadores, tienes ${players.length}` });

  // Generamos muchas rondas de golpe (el torneo se acaba cuando el usuario pulse Finalizar)
  const rounds = generateRounds(players, 20);

  const transaction = db.transaction(() => {
    const { lastInsertRowid: tid } = db.prepare('INSERT INTO tournaments (name, status) VALUES (?, ?)').run(name, 'active');
    rounds.forEach(round => {
      const { lastInsertRowid: rid } = db.prepare('INSERT INTO rounds (tournament_id, round_number) VALUES (?, ?)').run(tid, round.roundNumber);

      // Futbolin
      const { lastInsertRowid: fid } = db.prepare('INSERT INTO matches (round_id, game) VALUES (?, ?)').run(rid, 'foosball');
      round.foosball.team1.forEach(p => db.prepare('INSERT INTO match_players (match_id, player_id, team) VALUES (?, ?, ?)').run(fid, p.id, 1));
      round.foosball.team2.forEach(p => db.prepare('INSERT INTO match_players (match_id, player_id, team) VALUES (?, ?, ?)').run(fid, p.id, 2));

      // Billar 2v1
      const { lastInsertRowid: bid } = db.prepare('INSERT INTO matches (round_id, game) VALUES (?, ?)').run(rid, 'billiard');
      round.billiard.team.forEach(p => db.prepare('INSERT INTO match_players (match_id, player_id, team) VALUES (?, ?, ?)').run(bid, p.id, 1));
      db.prepare('INSERT INTO match_players (match_id, player_id, team) VALUES (?, ?, ?)').run(bid, round.billiard.solo.id, 2);
    });
    return tid;
  });

  try {
    const tid = transaction();
    res.status(201).json({ tournament: db.prepare('SELECT * FROM tournaments WHERE id = ?').get(tid) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const tournament = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(req.params.id);
  if (!tournament) return res.status(404).json({ error: 'No encontrado' });

  const rounds = db.prepare('SELECT * FROM rounds WHERE tournament_id = ? ORDER BY round_number').all(tournament.id);

  // Solo devolvemos hasta la primera ronda incompleta + 1 (la actual)
  // Las siguientes quedan ocultas
  let currentRoundIdx = rounds.findIndex(round => {
    const matches = db.prepare('SELECT COUNT(*) as c FROM matches WHERE round_id = ?').get(round.id).c;
    const results = db.prepare(`
      SELECT COUNT(*) as c FROM results r
      JOIN matches m ON m.id = r.match_id
      WHERE m.round_id = ?
    `).get(round.id).c;
    return results < matches;
  });
  if (currentRoundIdx === -1) currentRoundIdx = rounds.length - 1;

  const visibleRounds = rounds.slice(0, currentRoundIdx + 1);

  const fullRounds = visibleRounds.map(round => {
    const matches = db.prepare('SELECT * FROM matches WHERE round_id = ?').all(round.id);
    const fullMatches = matches.map(match => {
      const players = db.prepare('SELECT mp.team, p.id, p.name FROM match_players mp JOIN players p ON p.id = mp.player_id WHERE mp.match_id = ?').all(match.id);
      const result = db.prepare('SELECT * FROM results WHERE match_id = ?').get(match.id);
      return { ...match, players, result: result || null };
    });
    return { ...round, matches: fullMatches };
  });

  res.json({ ...tournament, rounds: fullRounds, currentRound: currentRoundIdx });
});

// Finalizar torneo
router.post('/:id/finish', (req, res) => {
  const db = getDb();
  db.prepare('UPDATE tournaments SET status = ? WHERE id = ?').run('finished', req.params.id);
  res.json({ success: true });
});

router.post('/result', (req, res) => {
  const { matchId, winnerTeam } = req.body;
  if (!matchId || !winnerTeam) return res.status(400).json({ error: 'matchId y winnerTeam requeridos' });
  try {
    getDb().prepare(`
      INSERT INTO results (match_id, winner_team, score_team1, score_team2)
      VALUES (?, ?, 0, 0)
      ON CONFLICT(match_id) DO UPDATE SET winner_team = excluded.winner_team
    `).run(matchId, winnerTeam);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id/leaderboard', (req, res) => {
  const db = getDb();
  const players = db.prepare('SELECT * FROM players').all();
  const leaderboard = players.map(player => {
    const matches = db.prepare(`
      SELECT mp.team, r.winner_team FROM match_players mp
      JOIN matches m ON m.id = mp.match_id
      JOIN rounds ro ON ro.id = m.round_id
      LEFT JOIN results r ON r.match_id = m.id
      WHERE mp.player_id = ? AND ro.tournament_id = ?
    `).all(player.id, req.params.id);
    let points = 0, wins = 0, played = 0;
    matches.forEach(m => {
      if (m.winner_team !== null) {
        played++;
        if (m.team === m.winner_team) { points += 3; wins++; }
      }
    });
    return { ...player, points, wins, played };
  });
  res.json(leaderboard.sort((a, b) => b.points - a.points || b.wins - a.wins));
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  const del = db.transaction(() => {
    const rounds = db.prepare('SELECT id FROM rounds WHERE tournament_id = ?').all(req.params.id);
    rounds.forEach(round => {
      const matches = db.prepare('SELECT id FROM matches WHERE round_id = ?').all(round.id);
      matches.forEach(match => {
        db.prepare('DELETE FROM results WHERE match_id = ?').run(match.id);
        db.prepare('DELETE FROM match_players WHERE match_id = ?').run(match.id);
      });
      db.prepare('DELETE FROM matches WHERE round_id = ?').run(round.id);
    });
    db.prepare('DELETE FROM rounds WHERE tournament_id = ?').run(req.params.id);
    db.prepare('DELETE FROM tournaments WHERE id = ?').run(req.params.id);
  });
  del();
  res.json({ success: true });
});

module.exports = router;
