// Diamonds system
let diamonds = parseInt(localStorage.getItem("diamonds")) || 100;

// Lootpool for slot machine symbols
const symbols = [
    { name: "stick", value: 1, rarity: "common", weight: 30 },
    { name: "iron_nugget", value: 3, rarity: "common", weight: 25 },
    { name: "apple", value: 5, rarity: "common", weight: 20 },
    { name: "iron_sword", value: 10, rarity: "common", weight: 15 },
    { name: "iron_chestplate", value: 15, rarity: "common", weight: 12 },
    { name: "golden_apple", value: 50, rarity: "uncommon", weight: 8 },
    { name: "enchanted_book", value: 100, rarity: "rare", weight: 5 },
    { name: "diamond_sword", value: 120, rarity: "epic", weight: 3 },
    { name: "netherite_ingot", value: 300, rarity: "legendary", weight: 1 }
];

// DOM Elements
const reel1 = document.getElementById("reel1");
const reel2 = document.getElementById("reel2");
const reel3 = document.getElementById("reel3");
const spinBtn = document.getElementById("spinBtn");
const decreaseBet = document.getElementById("decreaseBet");
const increaseBet = document.getElementById("increaseBet");
const maxBetBtn = document.getElementById("maxBetBtn");
const betAmount = document.getElementById("betAmount");
const spinCost = document.getElementById("spinCost");
const resultText = document.getElementById("resultText");
const winDisplay = document.getElementById("winDisplay");
const winAmount = document.getElementById("winAmount");
const homeBtn = document.getElementById("homeBtn");

// State
let currentBet = 5;
let isSpinning = false;
let reelResults = [null, null, null];

// Initialize reels with random items
function initReels() {
    console.log("Initializing reels...");
    
    // Clear reels
    reel1.innerHTML = '';
    reel2.innerHTML = '';
    reel3.innerHTML = '';
    
    // Add 3 random items to each reel (for initial display)
    [reel1, reel2, reel3].forEach(reel => {
        for (let i = 0; i < 3; i++) {
            const randomSymbol = getWeightedRandomSymbol();
            addSymbolToReel(reel, randomSymbol);
        }
    });
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
        this.src = "textures/stick.png"; // Fallback
    };
    
    item.appendChild(img);
    reel.appendChild(item);
}

// Update a reel with new random items (for animation)
function updateReel(reel, finalSymbol = null) {
    // Clear current items
    reel.innerHTML = '';
    
    if (finalSymbol) {
        // If we have a final symbol, show it in the middle
        addSymbolToReel(reel, getWeightedRandomSymbol()); // Top
        addSymbolToReel(reel, finalSymbol); // Middle (winning)
        addSymbolToReel(reel, getWeightedRandomSymbol()); // Bottom
    } else {
        // Just show random items
        for (let i = 0; i < 3; i++) {
            addSymbolToReel(reel, getWeightedRandomSymbol());
        }
    }
}

// Animation function for a single reel
function animateReel(reel, finalSymbol, duration, delay) {
    return new Promise(resolve => {
        setTimeout(() => {
            const startTime = Date.now();
            const intervalTime = 100; // Change image every 100ms
            
            // Add spinning class
            reel.classList.add('spinning-active');
            
            // Change images rapidly
            const interval = setInterval(() => {
                // Update with random item
                const randomSymbol = getWeightedRandomSymbol();
                updateReel(reel, randomSymbol);
            }, intervalTime);
            
            // Stop after duration
            setTimeout(() => {
                clearInterval(interval);
                
                // Set final result
                updateReel(reel, finalSymbol);
                
                // Remove spinning class
                reel.classList.remove('spinning-active');
                
                resolve();
            }, duration);
        }, delay);
    });
}

// Update diamonds display
function updateDiamonds() {
    document.getElementById("diamonds").innerHTML = 
        `<img src="textures/diamond.png" class="diamondIcon"> ${diamonds}`;
    localStorage.setItem("diamonds", diamonds);
}

// Update bet display
function updateBetDisplay() {
    betAmount.textContent = currentBet;
    spinCost.innerHTML = `(<img src="textures/diamond.png" class="diamondIcon"> ${currentBet})`;
}

// Check win
function checkWin(results) {
    if (!results[0] || !results[1] || !results[2]) return 0;
    
    // Check for 3 of a kind
    if (results[0].name === results[1].name && 
        results[1].name === results[2].name) {
        return results[0].value * currentBet;
    }
    
    // Check for 2 of a kind
    if (results[0].name === results[1].name) {
        return currentBet * 2;
    }
    if (results[1].name === results[2].name) {
        return currentBet * 2;
    }
    if (results[0].name === results[2].name) {
        return currentBet * 2;
    }
    
    return 0;
}

// Main spin function
async function spin() {
    if (isSpinning) return;
    
    if (diamonds < currentBet) {
        resultText.textContent = "Not enough diamonds!";
        return;
    }
    
    isSpinning = true;
    diamonds -= currentBet;
    updateDiamonds();
    
    // UI updates
    spinBtn.classList.add("spinning");
    spinBtn.disabled = true;
    resultText.textContent = "Spinning...";
    winDisplay.classList.add("hidden");
    
    // Get random results for each reel
    reelResults = [
        getWeightedRandomSymbol(),
        getWeightedRandomSymbol(),
        getWeightedRandomSymbol()
    ];
    
    console.log("Final results:", reelResults);
    
    try {
        // Animate reels with delays
        await Promise.all([
            animateReel(reel1, reelResults[0], 2000, 0),
            animateReel(reel2, reelResults[1], 2000, 200),
            animateReel(reel3, reelResults[2], 2000, 400)
        ]);
    } catch (error) {
        console.log("Animation error:", error);
    }
    
    // Calculate win
    const win = checkWin(reelResults);
    
    if (win > 0) {
        diamonds += win;
        updateDiamonds();
        
        resultText.textContent = "YOU WIN!";
        winAmount.textContent = win;
        winDisplay.classList.remove("hidden");
        
        // Add win animation
        document.getElementById("slotMachine").classList.add("win-animation");
        setTimeout(() => {
            document.getElementById("slotMachine").classList.remove("win-animation");
        }, 1000);
    } else {
        resultText.textContent = "Try again!";
    }
    
    // Reset UI
    spinBtn.classList.remove("spinning");
    spinBtn.disabled = false;
    isSpinning = false;
}

// Bet controls
decreaseBet.addEventListener("click", () => {
    if (currentBet > 1) {
        currentBet--;
        updateBetDisplay();
    }
});

increaseBet.addEventListener("click", () => {
    if (currentBet < diamonds && currentBet < 100) {
        currentBet++;
        updateBetDisplay();
    }
});

maxBetBtn.addEventListener("click", () => {
    currentBet = Math.min(100, diamonds);
    updateBetDisplay();
});

// Spin button
spinBtn.addEventListener("click", spin);

// Home button
homeBtn.addEventListener("click", () => {
    window.location.href = "../index.html";
});

// Initialize everything when page loads
window.addEventListener('load', function() {
    console.log("Page loaded, initializing...");
    initReels();
    updateDiamonds();
    updateBetDisplay();
});

// Keyboard controls
document.addEventListener("keydown", (e) => {
    if (e.code === "Space" && !isSpinning && !spinBtn.disabled) {
        e.preventDefault();
        spin();
    }
});