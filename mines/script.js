let diamonds = parseInt(localStorage.getItem("diamonds")) || 100;
let bet = 0;
let mines = 0;
let revealed = Array(25).fill(false);
let isMine = Array(25).fill(false);
let totalRevealed = 0;
let safeRevealed = 0;
let multiplier = 1.0;
let gameActive = false;

document.addEventListener('DOMContentLoaded', () => {
    const betInput = document.getElementById('bet');
    const minesInput = document.getElementById('mines');
    const startBtn = document.getElementById('startBtn');
    const grid = document.getElementById('grid');
    const controls = document.getElementById('controls');
    const multiplierSpan = document.getElementById('multiplier');
    const cashoutBtn = document.getElementById('cashoutBtn');
    const homeBtn = document.getElementById('homeBtn');
    const message = document.getElementById('message');
    const setup = document.getElementById('setup');
    const diamondsDiv = document.getElementById('diamonds');

    startBtn.addEventListener('click', startGame);
    cashoutBtn.addEventListener('click', cashOut);
    homeBtn.addEventListener('click', home);

    betInput.addEventListener('input', () => {
        let val = parseInt(betInput.value);
        if (isNaN(val) || val < 1) val = 1;
        if (val > diamonds) val = diamonds;
        betInput.value = val;
    });

    minesInput.addEventListener('input', () => {
        let val = parseInt(minesInput.value);
        if (isNaN(val) || val < 1) val = 1;
        if (val > 24) val = 24;
        minesInput.value = val;
    });

    updateDiamonds();

    // Create grid
    for (let i = 0; i < 25; i++) {
        const tile = document.createElement('div');
        tile.className = 'tile disabled';
        const img = document.createElement('img');
        img.src = 'textures/grass.png';
        tile.appendChild(img);
        tile.dataset.index = i;
        tile.addEventListener('click', () => revealTile(i));
        grid.appendChild(tile);
    }

    function startGame() {
        bet = parseInt(betInput.value);
        mines = parseInt(minesInput.value);

        if (bet < 1 || mines < 1 || mines > 24) {
            message.textContent = 'Invalid bet.';
            setTimeout(() => message.textContent = '', 2000);
            return;
    }
    
        diamonds -= bet;
        localStorage.setItem("diamonds", diamonds);
        updateDiamonds();
        // Reset
        revealed.fill(false);
        isMine.fill(false);
        totalRevealed = 0;
        safeRevealed = 0;
        multiplier = 1.0;
        multiplierSpan.textContent = '1.00';
        message.textContent = '';
        gameActive = true;
        // Place mines
        const positions = Array.from({length: 25}, (_, i) => i);
        shuffle(positions);
        for (let i = 0; i < mines; i++) {
            isMine[positions[i]] = true;
        }
        // Reset tiles to grass
        for (let i = 0; i < 25; i++) {
            const tile = grid.children[i];
            const img = tile.querySelector('img');
            img.src = 'textures/grass.png';
            tile.classList.remove('disabled');
        }
        // Show controls
        setup.classList.add('hidden');
        controls.classList.remove('hidden');
        cashoutBtn.disabled = true;
        homeBtn.disabled = true;
    }

    function revealTile(index) {
        if (!gameActive || revealed[index]) return;
        revealed[index] = true;
        totalRevealed++;
        const tile = grid.children[index];
        const img = tile.querySelector('img');
        if (isMine[index]) {
            img.src = 'textures/tnt.png';
            gameOver(false);
        } else {
            img.src = 'textures/diamond.png';
            safeRevealed++;
            // Update multiplier
            multiplier *= 1 + (mines / 25);
            multiplierSpan.textContent = multiplier.toFixed(2);
            cashoutBtn.disabled = false;
        }
    }

    function cashOut() {
        const win = Math.floor(bet * multiplier);
        diamonds += win;
        localStorage.setItem("diamonds", diamonds);
        updateDiamonds();
        message.textContent = `Cashed out! Won ${win} diamonds.`;
        endGame();
    }

    function gameOver(won) {
        gameActive = false;
        // Reveal all mines
        for (let i = 0; i < 25; i++) {
            if (isMine[i] && !revealed[i]) {
                const tile = grid.children[i];
                const img = tile.querySelector('img');
                img.src = 'textures/tnt.png';
            }
        }
        if (!won) {
            message.textContent = `Boom! You hit a mine. Lost ${bet} diamonds.`;
        }
        endGame();
    }

    function endGame() {
        gameActive = false;
        // Disable tiles visually
        for (let i = 0; i < 25; i++) {
            grid.children[i].classList.add('disabled');
        }
        cashoutBtn.disabled = true;
        homeBtn.disabled = false;
        // Show setup again after delay
        setTimeout(() => {
            controls.classList.add('hidden');
            setup.classList.remove('hidden');
        }, 3000);
    }

    function home() {
        if (!gameActive) {
            window.location.href = "../index.html";
        } else {
            message.textContent = 'Finish the game first!';
            setTimeout(() => message.textContent = '', 2000);
        }
    }

    function updateDiamonds() {
        diamondsDiv.innerHTML = `<img src="textures/diamond.png" style="width:20px;"> ${diamonds}`;
        betInput.max = diamonds;
        let currentBet = parseInt(betInput.value);
        if (currentBet > diamonds) betInput.value = diamonds;
    }

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
});
