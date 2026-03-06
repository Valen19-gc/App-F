const express = require('express');
const cors = require('cors');
const path = require('path');
const playersRouter = require('./routes/players');
const tournamentsRouter = require('./routes/tournaments');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.use('/api/players', playersRouter);
app.use('/api/tournaments', tournamentsRouter);

if (process.env.NODE_ENV === 'production') {
  const staticPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(staticPath));
  app.get('*', (req, res) => res.sendFile(path.join(staticPath, 'index.html')));
}

app.listen(PORT, '0.0.0.0', () => console.log(`Party Games running on port ${PORT}`));
