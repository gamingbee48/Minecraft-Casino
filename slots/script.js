// Diamonds system
let diamonds = parseInt(localStorage.getItem("diamonds")) || 1000;

// Jackpot amounts
let miniJackpot = parseInt(localStorage.getItem("miniJackpot")) || 500;
let majorJackpot = parseInt(localStorage.getItem("majorJackpot")) || 2500;
let grandJackpot = parseInt(localStorage.getItem("grandJackpot")) || 10000;

// Fixed paylines: 10 lines always active
const TOTAL_PAYLINES = 10;

// Payline definitions (row positions per reel 0-4, rows 0-2)
const paylineDefinitions = {
    1: [0, 0, 0, 0, 0],
    2: [1, 1, 1, 1, 1],
    3: [2, 2, 2, 2, 2],
    4: [0, 1, 2, 1, 0],
    5: [2, 1, 0, 1, 2],
    6: [0, 0, 1, 2, 2],
    7: [2, 2, 1, 0, 0],
    8: [1, 0, 1, 2, 1],
    9: [1, 2, 1, 0, 1],
    10: [0, 1, 1, 1, 0]
};

// Lootpool for slot machine symbols
const symbols = [
    { name: "stick", value: 1, rarity: "common", weight: 30, multiplier: {3: 1, 4: 2, 5: 5} },
    { name: "iron_nugget", value: 3, rarity: "common", weight: 28, multiplier: {3: 1, 4: 2, 5: 5} },
    { name: "apple", value: 5, rarity: "common", weight: 25, multiplier: {3: 1, 4: 2, 5: 5} },
    { name: "iron_sword", value: 10, rarity: "common", weight: 20, multiplier: {3: 2, 4: 4, 5: 10} },
    { name: "iron_chestplate", value: 15, rarity: "common", weight: 15, multiplier: {3: 3, 4: 6, 5: 15} },
    { name: "golden_apple", value: 50, rarity: "uncommon", weight: 10, multiplier: {3: 10, 4: 20, 5: 50} },
    { name: "enchanted_book", value: 100, rarity: "rare", weight: 6, multiplier: {3: 20, 4: 40, 5: 100} },
    { name: "diamond_sword", value: 120, rarity: "epic", weight: 3, multiplier: {3: 25, 4: 50, 5: 120} },
    { name: "netherite_ingot", value: 300, rarity: "legendary", weight: 1, multiplier: {3: 60, 4: 120, 5: 300} }
];

// DOM Elements
const reels = [
    document.getElementById("reel1"),
    document.getElementById("reel2"),
    document.getElementById("reel3"),
    document.getElementById("reel4"),
    document.getElementById("reel5")
];
const spinBtn = document.getElementById("spinBtn");
const autoSpinBtn = document.getElementById("autoSpinBtn");
const stopAutoBtn = document.getElementById("stopAutoBtn");
const decreaseBet = document.getElementById("decreaseBet");
const increaseBet = document.getElementById("increaseBet");
const maxBetBtn = document.getElementById("maxBetBtn");
const betAmountSpan = document.getElementById("betAmount");
const totalBetDisplay = document.getElementById("totalBet");
const resultText = document.getElementById("resultText");
const winDisplay = document.getElementById("winDisplay");
const winAmount = document.getElementById("winAmount");
const winLines = document.getElementById("winLines");
const jackpotWinDiv = document.getElementById("jackpotWin");
const homeBtn = document.getElementById("homeBtn");
const autoSpinMinus = document.getElementById("autoSpinMinus");
const autoSpinPlus = document.getElementById("autoSpinPlus");
const autoSpinCountSpan = document.getElementById("autoSpinCount");
const autoSpinSettings = document.getElementById("autoSpinSettings");

// State
let totalBet = 10;
let isSpinning = false;
let isAutoSpinning = false;
let autoSpinRemaining = 0;
let currentGrid = Array(5).fill().map(() => Array(3).fill(null));
let totalWin = 0;
let winningLines = [];

// Sound setup
const tickSound = new Audio("textures/tick.mp3");
const winSound = new Audio("textures/levelup.mp3");
const spinSound = new Audio("textures/spin.mp3");

// Preload sounds and handle errors
[tickSound, winSound, spinSound].forEach(sound => {
    sound.preload = 'auto';
    sound.onerror = () => console.log("Sound not found, continuing without sound");
});

// Update jackpot display
function updateJackpotDisplay() {
    const miniEl = document.getElementById("miniJackpot");
    const majorEl = document.getElementById("majorJackpot");
    const grandEl = document.getElementById("grandJackpot");
    if (miniEl) miniEl.textContent = miniJackpot;
    if (majorEl) majorEl.textContent = majorJackpot;
    if (grandEl) grandEl.textContent = grandJackpot;
    
    localStorage.setItem("miniJackpot", miniJackpot);
    localStorage.setItem("majorJackpot", majorJackpot);
    localStorage.setItem("grandJackpot", grandJackpot);
}

// Add to jackpots (from bets)
function addToJackpots(betAmount) {
    // 2% of bet goes to jackpots
    const contribution = Math.floor(betAmount * 0.02);
    miniJackpot += Math.floor(contribution * 0.5);
    majorJackpot += Math.floor(contribution * 0.3);
    grandJackpot += Math.floor(contribution * 0.2);
    updateJackpotDisplay();
}

// Check jackpot wins
function checkJackpotWins() {
    // Check each reel's middle row for jackpot conditions
    const middleRow = [0, 1, 2, 3, 4].map(reel => currentGrid[reel] ? currentGrid[reel][1] : null);
    
    // Check for 5x Netherite Ingot (MINI JACKPOT)
    if (middleRow.every(symbol => symbol && symbol.name === "netherite_ingot")) {
        const winAmount = miniJackpot;
        diamonds += winAmount;
        miniJackpot = 500; // Reset to base
        updateJackpotDisplay();
        showJackpotWin("MINI JACKPOT", winAmount);
        return winAmount;
    }
    
    // Check for 5x Diamond Sword (MAJOR JACKPOT)
    if (middleRow.every(symbol => symbol && symbol.name === "diamond_sword")) {
        const winAmount = majorJackpot;
        diamonds += winAmount;
        majorJackpot = 2500; // Reset to base
        updateJackpotDisplay();
        showJackpotWin("MAJOR JACKPOT", winAmount);
        return winAmount;
    }
    
    // Check for 5x Enchanted Book (GRAND JACKPOT)
    if (middleRow.every(symbol => symbol && symbol.name === "enchanted_book")) {
        const winAmount = grandJackpot;
        diamonds += winAmount;
        grandJackpot = 10000; // Reset to base
        updateJackpotDisplay();
        showJackpotWin("GRAND JACKPOT", winAmount);
        return winAmount;
    }
    
    return 0;
}

// Show jackpot win animation
function showJackpotWin(jackpotName, amount) {
    if (jackpotWinDiv) {
        jackpotWinDiv.innerHTML = `🎰 ${jackpotName} WIN! +${amount} 💎 🎰`;
        jackpotWinDiv.classList.remove("hidden");
        setTimeout(() => {
            jackpotWinDiv.classList.add("hidden");
        }, 5000);
    }
    
    // Special win sound for jackpot
    if (winSound) {
        winSound.currentTime = 0;
        winSound.play().catch(() => {});
    }
}

// Initialize reels
function initReels() {
    reels.forEach(reel => {
        if (!reel) return;
        reel.innerHTML = '';
        for (let i = 0; i < 3; i++) {
            const randomSymbol = getWeightedRandomSymbol();
            addSymbolToReel(reel, randomSymbol);
        }
    });
    updateCurrentGrid();
}

// Get weighted random symbol
function getWeightedRandomSymbol() {
    const totalWeight = symbols.reduce((sum, s) => sum + s.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const symbol of symbols) {
        if (random < symbol.weight) return {...symbol};
        random -= symbol.weight;
    }
    return {...symbols[0]};
}

// Add symbol to reel
function addSymbolToReel(reel, symbol) {
    const item = document.createElement("div");
    item.className = `reel-item ${symbol.rarity}`;
    
    const img = document.createElement("img");
    img.src = `textures/${symbol.name}.png`;
    img.alt = symbol.name;
    img.onerror = function() {
        this.src = "textures/stick.png";
    };
    
    item.appendChild(img);
    reel.appendChild(item);
}

// Update current grid from DOM
function updateCurrentGrid() {
    reels.forEach((reel, reelIndex) => {
        if (!reel) return;
        const items = reel.querySelectorAll('.reel-item');
        items.forEach((item, rowIndex) => {
            const img = item.querySelector('img');
            if (img && currentGrid[reelIndex]) {
                const symbolName = img.alt;
                const symbol = symbols.find(s => s.name === symbolName);
                if (symbol) {
                    currentGrid[reelIndex][rowIndex] = symbol;
                }
            }
        });
    });
}

// Animate a single reel
function animateReel(reel, finalSymbols, duration, delay) {
    return new Promise(resolve => {
        setTimeout(() => {
            if (!reel) {
                resolve();
                return;
            }
            
            reel.classList.add('spinning-active');
            
            const intervalTime = 80;
            let spinDuration = 0;
            
            const interval = setInterval(() => {
                if (spinDuration >= duration - 200) {
                    return;
                }
                // Show random symbols during animation
                const tempSymbols = [];
                for (let i = 0; i < 3; i++) {
                    tempSymbols.push(getWeightedRandomSymbol());
                }
                updateReelDisplay(reel, tempSymbols);
                spinDuration += intervalTime;
            }, intervalTime);
            
            // Wait for most of the animation
            setTimeout(() => {
                clearInterval(interval);
                // Final stop
                updateReelDisplay(reel, finalSymbols);
                reel.classList.remove('spinning-active');
                resolve();
            }, duration - 50);
        }, delay);
    });
}

// Update reel display with symbols
function updateReelDisplay(reel, symbolsArray) {
    if (!reel) return;
    const items = reel.querySelectorAll('.reel-item');
    symbolsArray.forEach((symbol, index) => {
        if (items[index]) {
            const img = items[index].querySelector('img');
            if (img) {
                img.src = `textures/${symbol.name}.png`;
                img.alt = symbol.name;
            }
            items[index].className = `reel-item ${symbol.rarity}`;
        }
    });
}

// Check all 10 fixed paylines
function checkAllWins() {
    totalWin = 0;
    winningLines = [];
    
    for (let lineNum = 1; lineNum <= TOTAL_PAYLINES; lineNum++) {
        const lineResult = checkLine(lineNum);
        if (lineResult.win > 0) {
            totalWin += lineResult.win;
            winningLines.push({
                line: lineNum,
                amount: lineResult.win,
                symbol: lineResult.symbol.name,
                count: lineResult.count,
                multiplier: lineResult.multiplier
            });
        }
    }
    
    return totalWin;
}

// Check a single payline (left to right only)
function checkLine(lineNum) {
    const positions = paylineDefinitions[lineNum];
    if (!positions) return { win: 0, count: 0, symbol: null, multiplier: 0 };
    
    // Get symbols on this line
    const lineSymbols = [];
    for (let reel = 0; reel < 5; reel++) {
        const row = positions[reel];
        if (currentGrid[reel] && currentGrid[reel][row]) {
            lineSymbols.push(currentGrid[reel][row]);
        } else {
            return { win: 0, count: 0, symbol: null, multiplier: 0 };
        }
    }
    
    // Check consecutive matches from left to right
    const firstSymbol = lineSymbols[0];
    let consecutiveCount = 1;
    
    for (let i = 1; i < lineSymbols.length; i++) {
        if (lineSymbols[i].name === firstSymbol.name) {
            consecutiveCount++;
        } else {
            break;
        }
    }
    
    // Need at least 3 in a row to win (left to right)
    if (consecutiveCount >= 3) {
        const multiplier = firstSymbol.multiplier[consecutiveCount] || 0;
        const winAmount = totalBet * multiplier;
        return { win: winAmount, count: consecutiveCount, symbol: firstSymbol, multiplier: multiplier };
    }
    
    return { win: 0, count: 0, symbol: null, multiplier: 0 };
}

// Highlight winning paylines
function highlightWinningLines() {
    // Reset all paylines
    for (let i = 1; i <= TOTAL_PAYLINES; i++) {
        const line = document.querySelector(`.payline-${i}`);
        if (line) line.classList.remove('active');
    }
    
    // Highlight winning lines
    winningLines.forEach(win => {
        const line = document.querySelector(`.payline-${win.line}`);
        if (line) line.classList.add('active');
    });
    
    // Reset highlights on symbols
    reels.forEach(reel => {
        if (!reel) return;
        const items = reel.querySelectorAll('.reel-item');
        items.forEach(item => {
            item.classList.remove('highlight');
        });
    });
    
    // Highlight symbols on winning lines
    winningLines.forEach(win => {
        const positions = paylineDefinitions[win.line];
        if (!positions) return;
        positions.forEach((row, reelIndex) => {
            const reel = reels[reelIndex];
            if (reel) {
                const items = reel.querySelectorAll('.reel-item');
                if (items[row]) {
                    items[row].classList.add('highlight');
                }
            }
        });
    });
}

// Update bet display
function updateBetDisplay() {
    if (betAmountSpan) betAmountSpan.textContent = totalBet;
    if (totalBetDisplay) totalBetDisplay.textContent = totalBet;
}

// Update diamonds display
function updateDiamonds() {
    const diamondsElement = document.getElementById("diamonds");
    if (diamondsElement) {
        diamondsElement.innerHTML = `<img src="textures/diamond.png" class="diamondIcon"> ${diamonds}`;
    }
    localStorage.setItem("diamonds", diamonds);
}

// Generate final symbols for spin
function generateFinalSymbols() {
    const finalGrid = Array(5).fill().map(() => Array(3).fill(null));
    for (let reel = 0; reel < 5; reel++) {
        for (let row = 0; row < 3; row++) {
            finalGrid[reel][row] = getWeightedRandomSymbol();
        }
    }
    return finalGrid;
}

// Perform a single spin
async function performSpin() {
    if (isSpinning) return false;
    
    if (diamonds < totalBet) {
        if (resultText) resultText.textContent = "Not enough diamonds!";
        return false;
    }
    
    isSpinning = true;
    diamonds -= totalBet;
    updateDiamonds();
    
    // Add to jackpots
    addToJackpots(totalBet);
    
    // UI updates
    if (spinBtn) spinBtn.disabled = true;
    if (autoSpinBtn) autoSpinBtn.disabled = true;
    if (resultText) resultText.textContent = "Spinning...";
    if (winDisplay) winDisplay.classList.add("hidden");
    if (winLines) winLines.innerHTML = "";
    if (jackpotWinDiv) jackpotWinDiv.classList.add("hidden");
    
    // Remove payline highlights
    for (let i = 1; i <= TOTAL_PAYLINES; i++) {
        const line = document.querySelector(`.payline-${i}`);
        if (line) line.classList.remove('active');
    }
    
    // Play spin sound
    if (spinSound) {
        spinSound.currentTime = 0;
        spinSound.play().catch(() => {});
    }
    
    // Generate final symbols
    const finalGrid = generateFinalSymbols();
    
    // Start ticking sound
    let tickInterval = setInterval(() => {
        if (tickSound && isSpinning) {
            tickSound.currentTime = 0;
            tickSound.play().catch(() => {});
        }
    }, 120);
    
    // Animate all reels with delays
    const animations = [];
    for (let reelIndex = 0; reelIndex < 5; reelIndex++) {
        if (reels[reelIndex]) {
            const finalSymbols = finalGrid[reelIndex];
            animations.push(animateReel(reels[reelIndex], finalSymbols, 2500, reelIndex * 120));
        }
    }
    
    await Promise.all(animations);
    
    // Stop ticking
    clearInterval(tickInterval);
    
    // Update current grid
    for (let reelIndex = 0; reelIndex < 5; reelIndex++) {
        if (finalGrid[reelIndex]) {
            for (let rowIndex = 0; rowIndex < 3; rowIndex++) {
                if (currentGrid[reelIndex]) {
                    currentGrid[reelIndex][rowIndex] = finalGrid[reelIndex][rowIndex];
                }
            }
        }
    }
    
    // Check regular wins
    const win = checkAllWins();
    
    // Check jackpot wins
    const jackpotWin = checkJackpotWins();
    
    const totalWinAmount = win + jackpotWin;
    
    if (totalWinAmount > 0) {
        diamonds += totalWinAmount;
        updateDiamonds();
        
        if (resultText) resultText.textContent = "YOU WIN!";
        if (winAmount) winAmount.textContent = totalWinAmount;
        if (winDisplay) winDisplay.classList.remove("hidden");
        
        // Display winning lines
        let winLinesHtml = "";
        if (winningLines.length > 0) {
            winLinesHtml = winningLines.map(w => 
                `Line ${w.line}: ${w.count}x ${w.symbol.toUpperCase()}! +${w.amount} 💎`
            ).join('<br>');
        }
        if (jackpotWin > 0) {
            winLinesHtml += (winLinesHtml ? "<br>" : "") + `🎰 JACKPOT WIN! +${jackpotWin} 💎 🎰`;
        }
        if (winLines) winLines.innerHTML = winLinesHtml;
        
        // Highlight winning lines and symbols
        highlightWinningLines();
        
        // Play win sound
        if (winSound) {
            winSound.currentTime = 0;
            winSound.play().catch(() => {});
        }
        
        // Add win animation
        const slotMachine = document.getElementById("slotMachine");
        if (slotMachine) {
            slotMachine.classList.add("win-animation");
            setTimeout(() => {
                slotMachine.classList.remove("win-animation");
            }, 1000);
        }
    } else {
        if (resultText) resultText.textContent = "Try again!";
        if (winLines) winLines.innerHTML = "No winning lines this time!";
        
        // Remove highlights
        for (let i = 1; i <= TOTAL_PAYLINES; i++) {
            const line = document.querySelector(`.payline-${i}`);
            if (line) line.classList.remove('active');
        }
    }
    
    // Reset UI
    if (spinBtn) spinBtn.disabled = false;
    if (autoSpinBtn && !isAutoSpinning) autoSpinBtn.disabled = false;
    isSpinning = false;
    
    return true;
}

// Auto spin function
async function startAutoSpin() {
    if (isAutoSpinning || isSpinning) return;
    
    isAutoSpinning = true;
    autoSpinRemaining = parseInt(autoSpinCountSpan.textContent) || 10;
    
    // Hide auto spin button, show stop button
    if (autoSpinBtn) autoSpinBtn.classList.add("hidden");
    if (stopAutoBtn) stopAutoBtn.classList.remove("hidden");
    if (spinBtn) spinBtn.disabled = true;
    if (decreaseBet) decreaseBet.disabled = true;
    if (increaseBet) increaseBet.disabled = true;
    if (maxBetBtn) maxBetBtn.disabled = true;
    if (autoSpinMinus) autoSpinMinus.disabled = true;
    if (autoSpinPlus) autoSpinPlus.disabled = true;
    
    if (resultText) resultText.textContent = `Auto Spinning... (${autoSpinRemaining} left)`;
    
    while (isAutoSpinning && autoSpinRemaining > 0) {
        const success = await performSpin();
        if (!success) {
            // Not enough diamonds
            stopAutoSpin();
            if (resultText) resultText.textContent = "Auto Spin stopped - Not enough diamonds!";
            break;
        }
        
        autoSpinRemaining--;
        if (resultText) resultText.textContent = `Auto Spinning... (${autoSpinRemaining} left)`;
        
        // Small delay between spins
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    stopAutoSpin();
}

// Stop auto spin
function stopAutoSpin() {
    isAutoSpinning = false;
    autoSpinRemaining = 0;
    
    // Show/hide buttons
    if (autoSpinBtn) autoSpinBtn.classList.remove("hidden");
    if (stopAutoBtn) stopAutoBtn.classList.add("hidden");
    if (spinBtn) spinBtn.disabled = false;
    if (decreaseBet) decreaseBet.disabled = false;
    if (increaseBet) increaseBet.disabled = false;
    if (maxBetBtn) maxBetBtn.disabled = false;
    if (autoSpinMinus) autoSpinMinus.disabled = false;
    if (autoSpinPlus) autoSpinPlus.disabled = false;
    
    if (resultText && resultText.textContent.includes("Auto")) {
        resultText.textContent = "Auto Spin stopped";
        setTimeout(() => {
            if (resultText && resultText.textContent === "Auto Spin stopped") {
                resultText.textContent = "Pull the lever!";
            }
        }, 2000);
    }
}

// Bet controls
if (decreaseBet) {
    decreaseBet.addEventListener("click", () => {
        if (!isSpinning && !isAutoSpinning && totalBet > 1) {
            totalBet--;
            updateBetDisplay();
        }
    });
}

if (increaseBet) {
    increaseBet.addEventListener("click", () => {
        if (!isSpinning && !isAutoSpinning && totalBet < 1000) {
            totalBet++;
            updateBetDisplay();
        }
    });
}

if (maxBetBtn) {
    maxBetBtn.addEventListener("click", () => {
        if (!isSpinning && !isAutoSpinning) {
            totalBet = Math.min(1000, diamonds);
            updateBetDisplay();
        }
    });
}

// Spin button
if (spinBtn) {
    spinBtn.addEventListener("click", () => {
        if (!isSpinning && !isAutoSpinning) {
            performSpin();
        }
    });
}

// Auto spin button
if (autoSpinBtn) {
    autoSpinBtn.addEventListener("click", () => {
        if (!isSpinning && !isAutoSpinning) {
            startAutoSpin();
        }
    });
}

// Stop auto button
if (stopAutoBtn) {
    stopAutoBtn.addEventListener("click", () => {
        stopAutoSpin();
    });
}

// Auto spin count controls
if (autoSpinMinus) {
    autoSpinMinus.addEventListener("click", () => {
        let count = parseInt(autoSpinCountSpan.textContent);
        if (count > 1) {
            count--;
            autoSpinCountSpan.textContent = count;
        }
    });
}

if (autoSpinPlus) {
    autoSpinPlus.addEventListener("click", () => {
        let count = parseInt(autoSpinCountSpan.textContent);
        if (count < 100) {
            count++;
            autoSpinCountSpan.textContent = count;
        }
    });
}

// Home button
if (homeBtn) {
    homeBtn.addEventListener("click", () => {
        if (isAutoSpinning) stopAutoSpin();
        window.location.href = "../index.html";
    });
}

// Initialize
window.addEventListener('load', () => {
    console.log("Loading slot machine...");
    initReels();
    updateDiamonds();
    updateBetDisplay();
    updateJackpotDisplay();
    
    // Show auto spin settings
    if (autoSpinSettings) autoSpinSettings.classList.remove("hidden");
});

// Keyboard controls
document.addEventListener("keydown", (e) => {
    if (e.code === "Space" && !isSpinning && !isAutoSpinning && spinBtn && !spinBtn.disabled) {
        e.preventDefault();
        performSpin();
    }
});