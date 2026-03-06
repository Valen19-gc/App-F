function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateRounds(players, numRounds = 6) {
  if (players.length !== 7) throw new Error('Se necesitan exactamente 7 jugadores');

  const rounds = [];
  const restCount = Object.fromEntries(players.map(p => [p.id, 0]));
  const pairCount = {};

  const pairKey = (a, b) => [a, b].sort().join('-');
  const getPairScore = (a, b) => pairCount[pairKey(a, b)] || 0;
  const recordPair = (a, b) => { const k = pairKey(a, b); pairCount[k] = (pairCount[k] || 0) + 1; };

  for (let r = 0; r < numRounds; r++) {
    const minRest = Math.min(...players.map(p => restCount[p.id]));
    const restCandidates = shuffle(players.filter(p => restCount[p.id] === minRest));
    const resting = restCandidates[0];
    restCount[resting.id]++;

    const active = shuffle(players.filter(p => p.id !== resting.id));

    let best = null;
    let bestScore = Infinity;

    for (let attempt = 0; attempt < 40; attempt++) {
      const c = shuffle(active);
      const score = getPairScore(c[0].id, c[1].id) + getPairScore(c[2].id, c[3].id);
      if (score < bestScore) { bestScore = score; best = c; }
    }

    recordPair(best[0].id, best[1].id);
    recordPair(best[2].id, best[3].id);

    const billPlayers = shuffle([best[4], best[5]]);

    rounds.push({
      roundNumber: r + 1,
      resting,
      foosball: { team1: [best[0], best[1]], team2: [best[2], best[3]] },
      billiard: { teamA: billPlayers[0], solo: billPlayers[1] }
    });
  }

  return rounds;
}

module.exports = { generateRounds };
