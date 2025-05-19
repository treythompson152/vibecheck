// State
let prompts = [];
let teams = [];
let scores = [];
let currentRound = 0;
let totalRounds = 0;

// Elements
const overlay = document.getElementById('setup-overlay');
const teamCountInput = document.getElementById('team-count');
const roundCountInput = document.getElementById('round-count');
const startBtn = document.getElementById('start-game');
const promptText = document.getElementById('prompt-text');
const teamsContainer = document.getElementById('teams-container');
const submitBtn = document.getElementById('submit-guesses');
const nextBtn = document.getElementById('next-round');
const scoreboard = document.getElementById('scoreboard');

// Load prompts from text file
fetch('prompts.txt')
    .then(res => res.text())
    .then(text => { prompts = text.split('\n').filter(l => l.trim()); })
    .catch(err => console.error('Failed to load prompts', err));

// Start game
startBtn.addEventListener('click', () => {
    const teamCount = parseInt(teamCountInput.value);
    totalRounds = parseInt(roundCountInput.value);
    if (teamCount < 2 || teamCount > 5 || totalRounds < 1) return;

    // Initialize teams & scores
    teams = Array.from({ length: teamCount }, (_, i) => `Team ${i+1}`);
    scores = Array(teamCount).fill(0);
    currentRound = 0;

    overlay.style.display = 'none';
    renderScoreboard();
    startRound();
});

function startRound() {
    if (currentRound >= totalRounds) {
        promptText.textContent = 'Game Over!';
        return;
    }
    const prompt = prompts[Math.floor(Math.random() * prompts.length)];
    promptText.textContent = `Round ${currentRound+1}: ${prompt}`;

    // Clear teams container
    teamsContainer.innerHTML = '';

    // Build columns for each team
    teams.forEach((name, idx) => {
        const col = document.createElement('div');
        col.className = 'team';
        col.innerHTML = `
            <h3>${name}</h3>
            <div class="number" id="number-${idx}"></div>
            <input type="number" min="1" max="100" placeholder="Your guess" id="guess-${idx}">
        `;
        teamsContainer.appendChild(col);
        document.getElementById(`number-${idx}`).textContent = Math.floor(Math.random()*100)+1;
    });

    submitBtn.disabled = false;
    nextBtn.disabled = true;
}

submitBtn.addEventListener('click', () => {
    // Calculate diffs and update scores
    teams.forEach((_, idx) => {
        const actual = parseInt(document.getElementById(`number-${idx}`).textContent, 10);
        const guessEl = document.getElementById(`guess-${idx}`);
        const guess = parseInt(guessEl.value, 10);
        if (!isNaN(guess)) {
            const diff = Math.abs(actual - guess);
            scores[idx] += diff;
        }
    });
    renderScoreboard();
    submitBtn.disabled = true;
    nextBtn.disabled = false;
});

nextBtn.addEventListener('click', () => {
    currentRound++;
    startRound();
});

function renderScoreboard() {
    scoreboard.innerHTML = '';
    teams.forEach((name, idx) => {
        const li = document.createElement('li');
        li.textContent = `${name}: ${scores[idx]} pts`;
        scoreboard.appendChild(li);
    });
}