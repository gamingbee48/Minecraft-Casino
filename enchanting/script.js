// Game Configuration
const GAMBLE_OPTIONS = [
    { cost: 10, multiplier: 2, successChance: 0.65, name: "Minor Enchantment" },
    { cost: 100, multiplier: 5, successChance: 0.45, name: "Major Enchantment" },
    { cost: 1000, multiplier: 15, successChance: 0.25, name: "Godly Enchantment" }
];

// Enchantment Rarities for Visual Effects
const RARITIES = [
    { name: "Common", chance: 0.50, colorClass: "glow-common" },
    { name: "Rare", chance: 0.30, colorClass: "glow-rare" },
    { name: "Epic", chance: 0.15, colorClass: "glow-epic" },
    { name: "Legendary", chance: 0.05, colorClass: "glow-legendary" }
];

// Game State
let diamondBalance = 500;
let selectedItem = "sword";
let historyLog = [];
let isAutoSpinning = false;
let autoSpinInterval = null;

// DOM Elements
const balanceSpan = document.getElementById("diamondBalance");
const resultDiv = document.getElementById("resultMessage");
const historyListEl = document.getElementById("historyList");
const enchantBtn = document.getElementById("enchantBtn");
const homeBtn = document.getElementById("homeBtn");
const gambleBtns = document.querySelectorAll(".gamble-btn");

// Sound Generator using Web Audio API
class SoundGenerator {
    constructor() {
        this.audioCtx = null;
    }
    
    init() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }
    
    play(frequency, duration, type = "sine", volume = 0.3) {
        if (!this.audioCtx) return;
        const now = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.type = type;
        osc.frequency.value = frequency;
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        osc.start();
        osc.stop(now + duration);
    }
    
    enchantSuccess() {
        this.init();
        this.play(523.25, 0.15, "sine", 0.25);
        this.play(783.99, 0.2, "sine", 0.3);
        this.play(1046.5, 0.3, "sine", 0.35);
    }
    
    enchantFail() {
        this.init();
        this.play(220, 0.3, "sawtooth", 0.25);
        this.play(164.81, 0.25, "sawtooth", 0.25);
    }
    
    gambleSound() {
        this.init();
        this.play(400, 0.1, "sine", 0.2);
    }
}

// Particle System
const canvas = document.getElementById("particleCanvas");
let ctx = canvas.getContext("2d");
let particles = [];

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

class Particle {
    constructor(x, y, color, size = 6) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 2) * 3 - 2;
        this.life = 1;
        this.color = color;
        this.size = size;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 0.02;
        this.vy += 0.1;
        return this.life > 0;
    }
    
    draw(ctx) {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2);
        ctx.fill();
    }
}

function addParticles(centerX, centerY, color, count = 20) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(centerX, centerY, color, 3 + Math.random() * 5));
    }
}

function spawnXPOrbs(amount, x, y) {
    for (let i = 0; i < Math.min(6, Math.floor(amount / 20) + 2); i++) {
        const orbDiv = document.createElement("div");
        orbDiv.className = "xp-float";
        orbDiv.innerHTML = "✨ +" + Math.floor(amount / (i + 1));
        orbDiv.style.left = (x - 20 + Math.random() * 40) + "px";
        orbDiv.style.top = (y - 20) + "px";
        orbDiv.style.background = "url('textures/xp_orb.png') no-repeat center/contain";
        orbDiv.style.width = "30px";
        orbDiv.style.height = "30px";
        orbDiv.style.display = "flex";
        orbDiv.style.alignItems = "center";
        orbDiv.style.justifyContent = "center";
        orbDiv.style.color = "#aaff88";
        document.body.appendChild(orbDiv);
        setTimeout(() => orbDiv.remove(), 1000);
    }
}

function animateParticles() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles = particles.filter(p => p.update());
    particles.forEach(p => p.draw(ctx));
    requestAnimationFrame(animateParticles);
}
animateParticles();

// Create floating particles around enchanting table
function createFloatingParticles() {
    const container = document.getElementById("floatingParticles");
    if (!container) return;
    
    setInterval(() => {
        for (let i = 0; i < 3; i++) {
            const particle = document.createElement("div");
            particle.className = "particle";
            particle.style.left = Math.random() * 100 + "%";
            particle.style.animationDuration = 2 + Math.random() * 2 + "s";
            particle.style.animationDelay = Math.random() * 2 + "s";
            container.appendChild(particle);
            setTimeout(() => particle.remove(), 3000);
        }
    }, 500);
}

// Helper Functions
function getRandomRarity() {
    let rand = Math.random();
    let cumulative = 0;
    for (let r of RARITIES) {
        cumulative += r.chance;
        if (rand <= cumulative) return r;
    }
    return RARITIES[0];
}

function updateBalanceUI() {
    balanceSpan.innerText = Math.floor(diamondBalance);
    localStorage.setItem("mcDiamondBalance", diamondBalance);
}

function addHistoryEntry(text, isSuccess) {
    historyLog.unshift({ text, isSuccess, timestamp: Date.now() });
    if (historyLog.length > 10) historyLog.pop();
    renderHistory();
}

function renderHistory() {
    historyListEl.innerHTML = "";
    for (let entry of historyLog) {
        const li = document.createElement("li");
        li.innerHTML = entry.text;
        li.style.borderLeftColor = entry.isSuccess ? "#55ff55" : "#ff5555";
        historyListEl.appendChild(li);
    }
}

function loadGame() {
    const saved = localStorage.getItem("mcDiamondBalance");
    if (saved !== null && !isNaN(parseInt(saved))) {
        diamondBalance = parseInt(saved);
    }
    updateBalanceUI();
}

// Main Gambling Function with Fail Chance
function performGamble(cost, multiplier, successChance, gambleName) {
    if (diamondBalance < cost) {
        resultDiv.innerHTML = "❌ NOT ENOUGH DIAMONDS! ❌";
        resultDiv.style.color = "#ff6666";
        return false;
    }
    
    // Deduct cost
    diamondBalance -= cost;
    updateBalanceUI();
    
    // Get button position for effects
    const rect = document.querySelector(`[data-cost="${cost}"]`).getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Determine success or fail
    const isSuccess = Math.random() < successChance;
    const sfx = new SoundGenerator();
    
    if (isSuccess) {
        // Calculate winnings
        const winnings = cost * multiplier;
        diamondBalance += winnings;
        updateBalanceUI();
        
        // Get random enchantment rarity for visual
        const rarity = getRandomRarity();
        
        // Get item name
        const itemNames = {
            sword: "⚔️ Diamond Sword",
            pickaxe: "⛏️ Diamond Pickaxe",
            bow: "🏹 Bow",
            chestplate: "🛡️ Diamond Chestplate"
        };
        const itemName = itemNames[selectedItem];
        
        // Display success message
        resultDiv.innerHTML = `✨ SUCCESS! ${itemName} was enchanted with ${rarity.name} enchantment! ✨<br>+${winnings} 💎 (${multiplier}x multiplier)`;
        resultDiv.style.color = "#88ff88";
        resultDiv.className = `result-message ${rarity.colorClass}`;
        
        // Play success sound
        sfx.enchantSuccess();
        
        // Visual effects
        addParticles(centerX, centerY, "#88ff88", 30);
        spawnXPOrbs(winnings, centerX, centerY);
        
        // Add to history
        addHistoryEntry(`✓ ${itemName} | ${gambleName} | +${winnings}💎`, true);
        
        // Book animation effect
        const bookIcon = document.querySelector(".table-graphic");
        if (bookIcon) {
            bookIcon.style.transform = "scale(1.05)";
            setTimeout(() => bookIcon.style.transform = "", 300);
        }
        
    } else {
        // Fail - lose diamonds
        const itemNames = {
            sword: "⚔️ Diamond Sword",
            pickaxe: "⛏️ Diamond Pickaxe",
            bow: "🏹 Bow",
            chestplate: "🛡️ Diamond Chestplate"
        };
        const itemName = itemNames[selectedItem];
        
        // Display fail message
        resultDiv.innerHTML = `💔 FAILURE! The enchantment on ${itemName} backfired! 💔<br>-${cost} 💎 lost!`;
        resultDiv.style.color = "#ff8888";
        resultDiv.className = "result-message";
        
        // Play fail sound
        sfx.enchantFail();
        
        // Visual effects
        addParticles(centerX, centerY, "#ff4444", 25);
        
        // Add to history
        addHistoryEntry(`✗ ${itemName} | ${gambleName} FAILED | -${cost}💎`, false);
        
        // Shake effect
        const gambleBtn = document.querySelector(`[data-cost="${cost}"]`);
        if (gambleBtn) {
            gambleBtn.style.transform = "translateX(5px)";
            setTimeout(() => gambleBtn.style.transform = "", 100);
            gambleBtn.style.transform = "translateX(-5px)";
            setTimeout(() => gambleBtn.style.transform = "", 200);
        }
    }
    
    return true;
}

// Enchant Button Action (Visual Only)
function onEnchantClick() {
    const sfx = new SoundGenerator();
    sfx.gambleSound();
    
    // Animate enchanting table
    const table = document.querySelector(".table-graphic");
    if (table) {
        table.style.animation = "none";
        setTimeout(() => {
            table.style.animation = "tableGlow 2s ease-in-out infinite";
        }, 10);
    }
    
    resultDiv.innerHTML = "✨ Select a gamble button to enchant your item! ✨";
    resultDiv.style.color = "#ffd966";
}

// Home Button Functionality
if (homeBtn) {
    homeBtn.addEventListener("click", () => {
        if (isAutoSpinning) {
            if (autoSpinInterval) clearInterval(autoSpinInterval);
            isAutoSpinning = false;
        }
        window.location.href = "../index.html";
    });
}

// Event Listeners
gambleBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const cost = parseInt(btn.getAttribute("data-cost"));
        const multiplier = parseInt(btn.getAttribute("data-multiplier"));
        const gambleOption = GAMBLE_OPTIONS.find(opt => opt.cost === cost);
        
        if (gambleOption) {
            performGamble(cost, multiplier, gambleOption.successChance, gambleOption.name);
        }
    });
});

enchantBtn.addEventListener("click", onEnchantClick);

// Item Selection
document.querySelectorAll(".item-card").forEach(card => {
    card.addEventListener("click", () => {
        document.querySelectorAll(".item-card").forEach(c => c.classList.remove("selected"));
        card.classList.add("selected");
        selectedItem = card.getAttribute("data-item");
        
        // Play selection sound
        const sfx = new SoundGenerator();
        sfx.play(360, 0.08, "sine", 0.1);
        
        resultDiv.innerHTML = `✨ ${card.querySelector(".item-name").innerText} selected! Choose your gamble! ✨`;
        resultDiv.style.color = "#ffd966";
    });
});

// Initialize Game
loadGame();
createFloatingParticles();

// Set default selected item
document.querySelector(".item-card[data-item='sword']").classList.add("selected");

// Add floating particles to canvas
setInterval(() => {
    const table = document.querySelector(".enchanting-table");
    if (table) {
        const rect = table.getBoundingClientRect();
        for (let i = 0; i < 2; i++) {
            particles.push(new Particle(
                rect.left + Math.random() * rect.width,
                rect.top + Math.random() * rect.height,
                "#b97eff",
                2
            ));
        }
    }
}, 500);