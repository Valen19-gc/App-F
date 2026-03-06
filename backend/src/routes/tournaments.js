const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { generateRounds } = require('../db/roundGenerator');

router.get('/', (req, res) => {
  res.json(getDb().prepare('SELECT * FROM tournaments ORDER BY created_at DESC').all());
});

router.post('/', (req, res) => {
  const { name, numRounds = 6 } = req.body;
  if (!name) return res.status(400).json({ error: 'Nombre requerido' });
  const db = getDb();
  const players = db.prepare('SELECT * FROM players').all();
  if (players.length !== 7) return res.status(400).json({ error: `Necesitas 7 jugadores, tienes ${players.length}` });

  const rounds = generateRounds(players, numRounds);

  const transaction = db.transaction(() => {
    const { lastInsertRowid: tid } = db.prepare('INSERT INTO tournaments (name) VALUES (?)').run(name);
    rounds.forEach(round => {
      const { lastInsertRowid: rid } = db.prepare('INSERT INTO rounds (tournament_id, round_number) VALUES (?, ?)').run(tid, round.roundNumber);
      db.prepare('INSERT INTO rest_players (round_id, player_id) VALUES (?, ?)').run(rid, round.resting.id);
      const { lastInsertRowid: fid } = db.prepare('INSERT INTO matches (round_id, game) VALUES (?, ?)').run(rid, 'foosball');
      round.foosball.team1.forEach(p => db.prepare('INSERT INTO match_players (match_id, player_id, team) VALUES (?, ?, ?)').run(fid, p.id, 1));
      round.foosball.team2.forEach(p => db.prepare('INSERT INTO match_players (match_id, player_id, team) VALUES (?, ?, ?)').run(fid, p.id, 2));
      const { lastInsertRowid: bid } = db.prepare('INSERT INTO matches (round_id, game) VALUES (?, ?)').run(rid, 'billiard');
      db.prepare('INSERT INTO match_players (match_id, player_id, team) VALUES (?, ?, ?)').run(bid, round.billiard.teamA.id, 1);
      db.prepare('INSERT INTO match_players (match_id, player_id, team) VALUES (?, ?, ?)').run(bid, round.billiard.solo.id, 2);
    });
    return tid;
  });

  try {
    const tid = transaction();
    res.status(201).json({ tournament: db.prepare('SELECT * FROM tournaments WHERE id = ?').get(tid), roundsGenerated: rounds.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const tournament = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(req.params.id);
  if (!tournament) return res.status(404).json({ error: 'No encontrado' });
  const rounds = db.prepare('SELECT * FROM rounds WHERE tournament_id = ? ORDER BY round_number').all(tournament.id);
  const fullRounds = rounds.map(round => {
    const matches = db.prepare('SELECT * FROM matches WHERE round_id = ?').all(round.id);
    const resting = db.prepare('SELECT p.* FROM rest_players rp JOIN players p ON p.id = rp.player_id WHERE rp.round_id = ?').get(round.id);
    const fullMatches = matches.map(match => {
      const players = db.prepare('SELECT mp.team, p.id, p.name FROM match_players mp JOIN players p ON p.id = mp.player_id WHERE mp.match_id = ?').all(match.id);
      const result = db.prepare('SELECT * FROM results WHERE match_id = ?').get(match.id);
      return { ...match, players, result: result || null };
    });
    return { ...round, matches: fullMatches, resting };
  });
  res.json({ ...tournament, rounds: fullRounds });
});

router.post('/result', (req, res) => {
  const { matchId, winnerTeam, scoreTeam1, scoreTeam2 } = req.body;
  if (!matchId || !winnerTeam) return res.status(400).json({ error: 'matchId y winnerTeam requeridos' });
  try {
    getDb().prepare(`
      INSERT INTO results (match_id, winner_team, score_team1, score_team2)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(match_id) DO UPDATE SET
        winner_team = excluded.winner_team,
        score_team1 = excluded.score_team1,
        score_team2 = excluded.score_team2
    `).run(matchId, winnerTeam, scoreTeam1 || 0, scoreTeam2 || 0);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id/leaderboard', (req, res) => {
  const db = getDb();
  const players = db.prepare('SELECT * FROM players').all();
  const leaderboard = players.map(player => {
    const matches = db.prepare(`
      SELECT m.game, mp.team, r.winner_team FROM match_players mp
      JOIN matches m ON m.id = mp.match_id
      JOIN rounds ro ON ro.id = m.round_id
      LEFT JOIN results r ON r.match_id = m.id
      WHERE mp.player_id = ? AND ro.tournament_id = ?
    `).all(player.id, req.params.id);
    let points = 0, wins = 0, played = 0;
    matches.forEach(m => { if (m.winner_team !== null) { played++; if (m.team === m.winner_team) { points += 3; wins++; } } });
    const rests = db.prepare('SELECT COUNT(*) as c FROM rest_players rp JOIN rounds ro ON ro.id = rp.round_id WHERE rp.player_id = ? AND ro.tournament_id = ?').get(player.id, req.params.id).c;
    return { ...player, points, wins, played, rests };
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
      db.prepare('DELETE FROM rest_players WHERE round_id = ?').run(round.id);
    });
    db.prepare('DELETE FROM rounds WHERE tournament_id = ?').run(req.params.id);
    db.prepare('DELETE FROM tournaments WHERE id = ?').run(req.params.id);
  });
  del();
  res.json({ success: true });
});

module.exports = router;
