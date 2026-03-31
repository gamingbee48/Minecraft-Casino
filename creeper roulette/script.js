// ----------------------------- AUDIO SYSTEM -------------------------------
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playBeep(type, vol = 0.3) {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.value = vol;
    
    if (type === 'chest') {
        osc.frequency.value = 523.25;
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
        osc.start();
        osc.stop(now + 0.25);
    } else if (type === 'hiss') {
        osc.frequency.value = 220;
        gain.gain.value = 0.5;
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
        osc.start();
        osc.stop(now + 0.5);
    } else if (type === 'explode') {
        const noise = audioCtx.createBufferSource();
        const bufferSize = audioCtx.sampleRate * 0.6;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        noise.buffer = buffer;
        const noiseGain = audioCtx.createGain();
        noise.connect(noiseGain);
        noiseGain.connect(audioCtx.destination);
        noiseGain.gain.setValueAtTime(0.6, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
        noise.start();
        osc.frequency.value = 80;
        osc.connect(gain);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
        osc.start();
        osc.stop(now + 0.4);
    } else if (type === 'fanfare') {
        const notes = [523.25, 659.25, 783.99];
        notes.forEach((f, i) => {
            const o = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            o.connect(g);
            g.connect(audioCtx.destination);
            g.gain.setValueAtTime(0.2, now + i * 0.12);
            g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 0.5);
            o.frequency.value = f;
            o.start(now + i * 0.12);
            o.stop(now + i * 0.12 + 0.4);
        });
    }
}

function playChestOpen() { playBeep('chest', 0.25); }
function playCreeperHiss() { playBeep('hiss', 0.4); }
function playExplosion() { playBeep('explode', 0.5); }
function playCashoutFanfare() { playBeep('fanfare', 0.3); }

// ----------------------------- GAME STATE ---------------------------------
let balance = 1000;
let currentBet = 100;
let currentMultiplier = 1.0;
let chestsOpenedSafe = 0;
let creeperIndex = -1;
let gameActive = true;
let chestsRevealed = new Array(6).fill(false);
let chestItems = new Array(6).fill(null);

// Statistics
let stats = {
    gamesPlayed: 0,
    creepersFound: 0,
    jackpotsWon: 0,
    totalWinnings: 0,
    highScore: 0
};

// DOM Elements
const chestGrid = document.getElementById('chestGrid');
const diamondSpan = document.getElementById('diamondBalance');
const multiplierSpan = document.getElementById('multiplierValue');
const potentialSpan = document.getElementById('potentialWin');
const tensionFill = document.getElementById('tensionFill');
const statGamesSpan = document.getElementById('statGames');
const statCreepersSpan = document.getElementById('statCreepers');
const statJackpotsSpan = document.getElementById('statJackpots');
const statWinningsSpan = document.getElementById('statWinnings');
const highScoreSpan = document.getElementById('highScore');

// ----------------------------- PARTICLE SYSTEM -------------------------------
const canvas = document.getElementById('particle-canvas');
let ctx = canvas.getContext('2d');
let particles = [];

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function explosionEffect(x, y) {
    for (let i = 0; i < 50; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 8 - 4,
            life: 1,
            size: 3 + Math.random() * 8,
            color: `hsl(${Math.random() * 40 + 20}, 80%, 60%)`
        });
    }
    
    function animateParticles() {
        if (particles.length === 0) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < particles.length; i++) {
            let p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2;
            p.life -= 0.02;
            if (p.life <= 0) {
                particles.splice(i, 1);
                i--;
                continue;
            }
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        }
        requestAnimationFrame(animateParticles);
    }
    animateParticles();
}

function screenShake() {
    document.body.classList.add('shake-global');
    setTimeout(() => document.body.classList.remove('shake-global'), 400);
}

// ----------------------------- UI UPDATE ---------------------------------
function updateUI() {
    diamondSpan.innerText = Math.floor(balance);
    
    let mult = 1.0;
    if (chestsOpenedSafe === 1) mult = 1.2;
    else if (chestsOpenedSafe === 2) mult = 1.5;
    else if (chestsOpenedSafe === 3) mult = 2;
    else if (chestsOpenedSafe === 4) mult = 3;
    else if (chestsOpenedSafe === 5) mult = 5;
    else if (chestsOpenedSafe === 6) mult = 10;
    currentMultiplier = mult;
    
    multiplierSpan.innerText = currentMultiplier.toFixed(1) + 'x';
    const potential = Math.floor(currentBet * currentMultiplier);
    potentialSpan.innerText = potential;
    const tensionPercent = (chestsOpenedSafe / 6) * 100;
    tensionFill.style.width = tensionPercent + '%';
    
    if (chestsOpenedSafe > stats.highScore) {
        stats.highScore = chestsOpenedSafe;
        highScoreSpan.innerText = stats.highScore;
        saveStats();
    }
}

// ----------------------------- STORAGE ---------------------------------
function saveBalance() {
    localStorage.setItem('creeperBalance', balance);
}

function loadBalance() {
    const b = localStorage.getItem('creeperBalance');
    if (b && !isNaN(b)) balance = Math.max(10, parseInt(b));
    else balance = 1000;
    updateUI();
}

function saveStats() {
    localStorage.setItem('creeperStats', JSON.stringify(stats));
    statGamesSpan.innerText = stats.gamesPlayed;
    statCreepersSpan.innerText = stats.creepersFound;
    statJackpotsSpan.innerText = stats.jackpotsWon;
    statWinningsSpan.innerText = Math.floor(stats.totalWinnings);
    highScoreSpan.innerText = stats.highScore;
}

function loadStats() {
    const s = localStorage.getItem('creeperStats');
    if (s) {
        try {
            const parsed = JSON.parse(s);
            stats = { ...stats, ...parsed };
        } catch (e) { }
    }
    saveStats();
}

// ----------------------------- GAME MECHANICS ---------------------------------
function disableChests(disabled) {
    document.querySelectorAll('.chest').forEach(c => {
        if (disabled) c.style.pointerEvents = 'none';
        else c.style.pointerEvents = 'auto';
    });
}

function generateNewRound() {
    creeperIndex = Math.floor(Math.random() * 6);
    const itemsPool = ['diamond', 'gold', 'emerald'];
    for (let i = 0; i < 6; i++) {
        if (i === creeperIndex) chestItems[i] = 'creeper';
        else {
            const randItem = itemsPool[Math.floor(Math.random() * itemsPool.length)];
            chestItems[i] = randItem;
        }
    }
}

function renderChests() {
    chestGrid.innerHTML = '';
    for (let i = 0; i < 6; i++) {
        const chest = document.createElement('div');
        chest.className = 'chest';
        if (!chestsRevealed[i]) chest.classList.add('glow');
        chest.setAttribute('data-idx', i);
        
        if (chestsRevealed[i]) {
            chest.classList.add('opened');
            if (chestItems[i] === 'creeper') {
                chest.innerText = '💀';
                chest.style.fontSize = '58px';
            } else {
                let symbol = '';
                if (chestItems[i] === 'diamond') symbol = '💎';
                else if (chestItems[i] === 'gold') symbol = '🪙';
                else symbol = '💚';
                chest.innerText = symbol;
                chest.style.fontSize = '58px';
            }
        } else {
            chest.innerHTML = '<span style="font-size:58px;">🧰</span>';
            if (i === creeperIndex && gameActive) {
                chest.classList.add('fuse-burning');
            }
        }
        
        chest.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = parseInt(chest.getAttribute('data-idx'));
            if (!gameActive) return;
            if (chestsRevealed[idx]) return;
            openChest(idx);
        });
        chestGrid.appendChild(chest);
    }
}

async function creeperLose(chestElement, idx) {
    if (!gameActive) return;
    gameActive = false;
    playCreeperHiss();
    setTimeout(() => {
        playExplosion();
        screenShake();
        explosionEffect(window.innerWidth / 2, window.innerHeight / 2);
    }, 150);
    
    chestElement.classList.add('creeper-hit');
    chestElement.innerHTML = '💀💥';
    chestElement.style.fontSize = '70px';
    chestElement.style.display = 'flex';
    chestElement.style.alignItems = 'center';
    chestElement.style.justifyContent = 'center';
    
    stats.creepersFound++;
    stats.gamesPlayed++;
    saveStats();
    updateUI();
    disableChests(true);
    setTimeout(() => resetRound(false), 1800);
}

async function openChest(index) {
    if (!gameActive) return;
    if (chestsRevealed[index]) return;
    
    const chestDiv = document.querySelector(`.chest[data-idx='${index}']`);
    if (!chestDiv) return;
    
    if (chestItems[index] === 'creeper') {
        chestsRevealed[index] = true;
        await creeperLose(chestDiv, index);
        return;
    }
    
    // Safe open
    playChestOpen();
    chestsRevealed[index] = true;
    chestDiv.classList.add('opened');
    chestDiv.classList.remove('fuse-burning', 'glow');
    
    let icon = '';
    if (chestItems[index] === 'diamond') icon = '💎';
    else if (chestItems[index] === 'gold') icon = '🪙';
    else icon = '💚';
    
    chestDiv.innerText = icon;
    chestDiv.style.fontSize = '58px';
    chestDiv.style.background = '#d9b45b';
    chestsOpenedSafe++;
    updateUI();
    
    // Jackpot - all 6 chests safe
    if (chestsOpenedSafe === 6) {
        const winAmount = Math.floor(currentBet * 10);
        balance += winAmount;
        stats.totalWinnings += winAmount;
        stats.jackpotsWon++;
        stats.gamesPlayed++;
        saveBalance();
        saveStats();
        updateUI();
        playCashoutFanfare();
        alert(`🔥 JACKPOT! You opened all 6 chests! Won ${winAmount} 💎! 🔥`);
        gameActive = false;
        disableChests(true);
        setTimeout(() => resetRound(false), 2000);
        return;
    }
    updateUI();
}

function cashOut() {
    if (!gameActive) return;
    if (chestsOpenedSafe === 0) {
        alert("Open at least one chest before cashing out!");
        return;
    }
    const winAmount = Math.floor(currentBet * currentMultiplier);
    balance += winAmount;
    stats.totalWinnings += winAmount;
    stats.gamesPlayed++;
    saveBalance();
    saveStats();
    playCashoutFanfare();
    updateUI();
    alert(`💰 Cashed out! You won ${winAmount} 💎 with ${currentMultiplier}x multiplier!`);
    gameActive = false;
    disableChests(true);
    setTimeout(() => resetRound(false), 1000);
}

function resetRound(keepBet = true) {
    gameActive = true;
    chestsOpenedSafe = 0;
    chestsRevealed.fill(false);
    generateNewRound();
    renderChests();
    updateUI();
    disableChests(false);
}

function startNewRoundWithBet() {
    if (balance < currentBet) {
        alert(`Not enough diamonds! Need ${currentBet} 💎. Your balance: ${balance}`);
        return false;
    }
    if (gameActive === true && chestsOpenedSafe > 0) {
        if (!confirm("Starting new round will reset current progress. Proceed?")) return false;
    }
    balance -= currentBet;
    saveBalance();
    gameActive = true;
    chestsOpenedSafe = 0;
    chestsRevealed.fill(false);
    generateNewRound();
    renderChests();
    updateUI();
    disableChests(false);
    return true;
}

// ----------------------------- EVENT LISTENERS ---------------------------------
document.getElementById('cashOutBtn').addEventListener('click', () => {
    if (gameActive && chestsOpenedSafe > 0) cashOut();
    else if (!gameActive) alert("Round is over! Start a new round.");
    else alert("Open at least one chest before cashing out!");
});

document.getElementById('resetRoundBtn').addEventListener('click', () => {
    startNewRoundWithBet();
});

document.querySelectorAll('.bet-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const val = parseInt(btn.getAttribute('data-bet'));
        if (!isNaN(val)) {
            currentBet = val;
            document.querySelectorAll('.bet-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateUI();
        }
    });
});

// Audio context resume on first user interaction
function resumeAudioContext() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}
document.body.addEventListener('click', resumeAudioContext);
document.body.addEventListener('touchstart', resumeAudioContext);

// ----------------------------- INITIALIZATION ---------------------------------
function init() {
    loadBalance();
    loadStats();
    generateNewRound();
    renderChests();
    gameActive = true;
    chestsOpenedSafe = 0;
    chestsRevealed.fill(false);
    updateUI();
    disableChests(false);
}

init();