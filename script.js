// script.js
document.addEventListener('DOMContentLoaded', () => {
  // UI references
  const setupScreen    = document.getElementById('setup-screen');
  const gameScreen     = document.getElementById('game-screen');
  const roundPopup     = document.getElementById('round-popup');
  const endPopup       = document.getElementById('end-popup');
  const namesContainer = document.getElementById('names-container');
  const teamCountSel   = document.getElementById('team-count');
  const roundsInput    = document.getElementById('rounds-input');
  const startBtn       = document.getElementById('start-button');
  const promptEls      = [
    document.getElementById('prompt-0'),
    document.getElementById('prompt-1'),
    document.getElementById('prompt-2')
  ];
  const teamsContainer = document.getElementById('teams-container');
  const submitBtn      = document.getElementById('submit-guesses');
  const roundStartBtn  = document.getElementById('round-start');
  const scoreboardDiv  = document.getElementById('scoreboard');
  const roundPlayers   = document.getElementById('round-players');
  const roundBoard     = document.getElementById('round-scoreboard');
  const rankingList    = document.getElementById('ranking-list');
  const restartBtn     = document.getElementById('restart');

  // State
  let prompts = [];
  let teams   = [];
  let rounds  = 5;
  let currentRound = 0;

  // Load & shuffle prompts
  fetch('prompts.txt')
    .then(r => r.text())
    .then(txt => prompts = shuffle(txt.trim().split('\n')))
    .catch(() => prompts = ['No prompts available']);

  // 2) Build dynamic setup inputs
  function buildNameInputs() {
    namesContainer.innerHTML = '';
    for (let i = 0; i < +teamCountSel.value; i++) {
      namesContainer.innerHTML += `
        <div class="setup-field">
          <label for="team-${i}-names">Team ${i+1} Players:</label>
          <input type="text" id="team-${i}-names" placeholder="Alice,Bob,Charlie" />
        </div>`;
    }
  }
  teamCountSel.addEventListener('change', buildNameInputs);
  buildNameInputs();

  // Start game
  startBtn.addEventListener('click', () => {
    rounds = Math.max(1, parseInt(roundsInput.value, 10) || 5);
    teams = [];
    for (let i = 0; i < +teamCountSel.value; i++) {
      const raw = document.getElementById(`team-${i}-names`).value.trim();
      const names = raw ? raw.split(/\s*,\s*/) : [`Team${i+1}`];
      teams.push({ players: names, queue: shuffle(names), total: 0 });
    }
    setupScreen.classList.add('hidden');
    currentRound = 0;
    showRoundPopup();
  });

  // 4) Submit guesses (validate + score)
  submitBtn.addEventListener('click', () => {
    for (let i = 0; i < teams.length; i++) {
      if (document.querySelector(`#team-${i} .guess`).value.trim() === '') {
        return alert('Please enter a guess for every team.');
      }
    }
    teams.forEach((t, i) => {
      const guess = +document.querySelector(`#team-${i} .guess`).value;
      t.total += Math.abs(guess - t.lastNumber);
    });
    renderScoreboard();
    document.querySelector('.controls').classList.add('hidden');

    if (currentRound >= rounds) showEndPopup();
    else showRoundPopup();
  });

  // 5) Interstitial: Next-Up popup
  function showRoundPopup() {
    // Pick next player for each team
    roundPlayers.innerHTML = teams.map(t => {
      const p = pickNext(t);
      t.currentPlayer = p;
      return `<p><strong>${p}</strong></p>`;
    }).join('');

    // Show current leaderboard
    roundBoard.innerHTML = `<h2>Leaderboard</h2><ul>${
      teams.map(t => `<li>${t.players.join(', ')}: ${t.total}</li>`).join('')
    }</ul>`;
    roundBoard.querySelectorAll('li').forEach((li,i) => {
      li.addEventListener('click', () => {
        const ans = prompt(`New score for ${teams[i].players.join(', ')}:`, teams[i].total);
        const v = parseInt(ans, 10);
        if (!isNaN(v)) {
          teams[i].total = v;
          li.textContent = `${teams[i].players.join(', ')}: ${v}`;
          renderScoreboard();
        }
      });
    });
    roundPopup.classList.remove('hidden');
  }

  // 6) Advance to the round
  roundStartBtn.addEventListener('click', () => {
    roundPopup.classList.add('hidden');
    if (currentRound >= rounds) showEndPopup(); else startRound();
  });

  // 7) Render a round: pick & remove 3 prompts, then show cards
  function startRound() {
    // Safely pick 3 unique prompts and remove them from array
    const roundPrompts = [];
    for (let i = 0; i < 3; i++) {
      if (prompts.length === 0) {
        roundPrompts.push('No prompt available');
      } else {
        const idx = Math.floor(Math.random() * prompts.length);
        roundPrompts.push(prompts.splice(idx, 1)[0]);
      }
    }

    // Display them
    promptEls.forEach((el, idx) => {
      el.textContent = `Prompt ${idx+1}: ${roundPrompts[idx]}`;
    });

    // Render each team’s card with the active player
    teamsContainer.innerHTML = '';
    teams.forEach((t, i) => {
      const num = Math.floor(Math.random() * 100) + 1;
      t.lastNumber = num;
      teamsContainer.innerHTML += `
        <div class="team" id="team-${i}">
          <h3>${t.currentPlayer}</h3>
          <div class="assigned-number">${num}</div>
          <input type="number" class="guess"
                 placeholder="teams guess" />
        </div>`;
    });
    document.querySelector('.controls').classList.remove('hidden');
    currentRound++;
  }

  // Footer scoreboard
  function renderScoreboard() {
    scoreboardDiv.innerHTML = `<ul>${
      teams.map(t => `<li>${t.players.join(', ')}: ${t.total}</li>`).join('')
    }</ul>`;
    scoreboardDiv.querySelectorAll('li').forEach((li, i) => {
      li.addEventListener('click', () => {
        const ans = prompt(`New score for ${teams[i].players.join(', ')}:`, teams[i].total);
        const v = parseInt(ans, 10);
        if (!isNaN(v)) {
          teams[i].total = v;
          li.textContent = `${teams[i].players.join(', ')}: ${v}`;
        }
      });
    });
  }

  // Final rankings
  function showEndPopup() {
    rankingList.innerHTML = '';
    [...teams]
      .sort((a,b) => a.total - b.total)
      .forEach((t, i) => {
        const li = document.createElement('li');
        li.className = ['gold','silver','bronze'][i] || '';
        li.textContent = `${t.players.join(', ')} — ${t.total} pts`;
        rankingList.appendChild(li);
      });
    endPopup.classList.remove('hidden');
  }
  restartBtn.addEventListener('click', () => location.reload());

  // utils
  function shuffle(arr) { return arr.slice().sort(() => Math.random() - 0.5); }
  function pickNext(team) { if (!team.queue.length) team.queue = shuffle(team.players); return team.queue.shift(); }
});
