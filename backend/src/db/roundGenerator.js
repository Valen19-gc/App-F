function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 7 jugadores, cada ronda:
//   Futbolin: 2 vs 2  (4 jugadores)
//   Billar:   2 vs 1  (3 jugadores)
//   Nadie descansa
function generateRounds(players, numRounds = 99) {
  if (players.length !== 7) throw new Error('Se necesitan exactamente 7 jugadores');

  const rounds = [];
  const pairCount = {};
  const soloCount = Object.fromEntries(players.map(p => [p.id, 0]));

  const pairKey = (a, b) => [a, b].sort().join('-');
  const getPair = (a, b) => pairCount[pairKey(a, b)] || 0;
  const recordPair = (a, b) => { const k = pairKey(a, b); pairCount[k] = (pairCount[k] || 0) + 1; };

  for (let r = 0; r < numRounds; r++) {
    let best = null;
    let bestScore = Infinity;

    for (let attempt = 0; attempt < 60; attempt++) {
      const c = shuffle(players);
      // c[0]+c[1] vs c[2]+c[3] futbolin
      // c[4]+c[5] vs c[6] billar (c[6] es el solo)
      const score =
        getPair(c[0].id, c[1].id) +
        getPair(c[2].id, c[3].id) +
        getPair(c[4].id, c[5].id) +
        soloCount[c[6].id] * 2; // penalizar si ya fue solo muchas veces

      if (score < bestScore) {
        bestScore = score;
        best = c;
      }
    }

    recordPair(best[0].id, best[1].id);
    recordPair(best[2].id, best[3].id);
    recordPair(best[4].id, best[5].id);
    soloCount[best[6].id]++;

    rounds.push({
      roundNumber: r + 1,
      foosball: {
        team1: [best[0], best[1]],
        team2: [best[2], best[3]]
      },
      billiard: {
        team: [best[4], best[5]],
        solo: best[6]
      }
    });
  }

  return rounds;
}

module.exports = { generateRounds };
