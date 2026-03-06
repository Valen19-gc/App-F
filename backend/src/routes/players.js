const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');

router.get('/', (req, res) => {
  const db = getDb();
  res.json(db.prepare('SELECT * FROM players ORDER BY name').all());
});

router.post('/', (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name required' });
  const db = getDb();
  try {
    const result = db.prepare('INSERT INTO players (name) VALUES (?)').run(name.trim());
    res.status(201).json(db.prepare('SELECT * FROM players WHERE id = ?').get(result.lastInsertRowid));
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Jugador ya existe' });
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', (req, res) => {
  getDb().prepare('DELETE FROM players WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
