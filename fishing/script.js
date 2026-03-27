(function() {
    // ---------- DOM Elements ----------
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const diamondSpan = document.getElementById('diamondAmount');
    const bestCatchNameSpan = document.getElementById('bestCatchName');
    const bestCatchValueSpan = document.getElementById('bestCatchValue');
    const totalFishSpan = document.getElementById('totalFish');
    const rareCatchesSpan = document.getElementById('rareCatches');
    const totalWinningsSpan = document.getElementById('totalWinnings');
    const betValueSpan = document.getElementById('betValue');
    const powerFillDiv = document.getElementById('powerFill');
    const durabilityFillDiv = document.getElementById('durabilityFill');
    const weatherIconSpan = document.getElementById('weatherIcon');
    const timeIconSpan = document.getElementById('timeIcon');
    const soundToggleBtn = document.getElementById('soundToggleBtn');
    const resetStatsBtn = document.getElementById('resetStatsBtn');
    const betDownBtn = document.getElementById('betDown');
    const betUpBtn = document.getElementById('betUp');

    // ---------- Game State ----------
    let diamonds = 1000;
    let currentBet = 10;
    let casting = false;
    let castPower = 0;
    let powerChargeInterval = null;
    let isFishing = false;
    let bobberX = 400, bobberY = 280;
    let weather = 'sunny';
    let dayTime = 'day';
    let streakMultiplier = 1;
    let streakCount = 0;
    let rodDurability = 100;
    let soundEnabled = true;
    let animationFrameId = null;

    // Statistics
    let totalFishCaught = 0;
    let rareCatchesTotal = 0;
    let totalWinningsSum = 0;
    let bestMultiplier = 0;
    let bestCatchItem = "None";

    // Visual effects arrays
    let particles = [];
    let floatingItems = [];

    // ---------- Loot Table ----------
    const lootTable = [
        { name: "Fish", rarity: "Common", chance: 40, baseMulti: 1.5, icon: "🐟", legendary: false },
        { name: "Salmon", rarity: "Common", chance: 25, baseMulti: 2, icon: "🐟", legendary: false },
        { name: "Pufferfish", rarity: "Uncommon", chance: 12, baseMulti: 4, icon: "🐡", legendary: false },
        { name: "Tropical Fish", rarity: "Rare", chance: 8, baseMulti: 6, icon: "🐠", legendary: false },
        { name: "Enchanted Book", rarity: "Epic", chance: 5, baseMulti: 12, icon: "📖", legendary: false },
        { name: "Name Tag", rarity: "Epic", chance: 4, baseMulti: 15, icon: "🏷️", legendary: false },
        { name: "Saddle", rarity: "Rare", chance: 3, baseMulti: 10, icon: "🐴", legendary: false },
        { name: "Lily Pad", rarity: "Uncommon", chance: 2, baseMulti: 5, icon: "🪷", legendary: false },
        { name: "Treasure Map", rarity: "Legendary", chance: 0.8, baseMulti: 30, icon: "🗺️", legendary: true },
        { name: "Heart of the Sea", rarity: "Legendary", chance: 0.2, baseMulti: 100, icon: "💙", legendary: true }
    ];

    // ---------- Audio Setup ----------
    let audioCtx = null;
    
    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }
    
    function playSound(type) {
        if (!soundEnabled) return;
        try {
            initAudio();
            const now = audioCtx.currentTime;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = 'sine';
            let freq = 400;
            let duration = 0.2;
            
            switch(type) {
                case 'cast': freq = 300; duration = 0.12; gain.gain.setValueAtTime(0.2, now); break;
                case 'splash': freq = 180; duration = 0.1; gain.gain.setValueAtTime(0.15, now); break;
                case 'reel': freq = 550; duration = 0.15; gain.gain.setValueAtTime(0.25, now); break;
                case 'rare': freq = 880; duration = 0.25; gain.gain.setValueAtTime(0.3, now); break;
                case 'legendary': freq = 1200; duration = 0.45; gain.gain.setValueAtTime(0.35, now); break;
                default: freq = 400; duration = 0.2;
            }
            
            osc.frequency.value = freq;
            gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
            osc.start();
            osc.stop(now + duration);
        } catch(e) { console.log('Audio error:', e); }
    }

    // ---------- Local Storage ----------
    function saveToLocal() {
        localStorage.setItem('mineFishData', JSON.stringify({
            diamonds, totalFishCaught, rareCatchesTotal, totalWinningsSum,
            bestMultiplier, bestCatchItem, streakCount, streakMultiplier
        }));
    }
    
    function loadStats() {
        const data = localStorage.getItem('mineFishData');
        if (data) {
            try {
                const d = JSON.parse(data);
                diamonds = d.diamonds || 1000;
                totalFishCaught = d.totalFishCaught || 0;
                rareCatchesTotal = d.rareCatchesTotal || 0;
                totalWinningsSum = d.totalWinningsSum || 0;
                bestMultiplier = d.bestMultiplier || 0;
                bestCatchItem = d.bestCatchItem || "None";
                streakCount = d.streakCount || 0;
                streakMultiplier = d.streakMultiplier || 1;
            } catch(e) {}
        }
        if (diamonds <= 0) diamonds = 100;
        updateDiamondUI();
        totalFishSpan.innerText = totalFishCaught;
        rareCatchesSpan.innerText = rareCatchesTotal;
        totalWinningsSpan.innerText = Math.floor(totalWinningsSum);
        
        if (bestMultiplier > 0) {
            bestCatchNameSpan.innerText = bestCatchItem;
            bestCatchValueSpan.innerText = bestMultiplier;
        } else {
            bestCatchNameSpan.innerText = "—";
            bestCatchValueSpan.innerText = "0";
        }
    }
    
    function updateDiamondUI() {
        diamondSpan.innerText = Math.floor(diamonds);
        saveToLocal();
    }
    
    function updateBestCatch(itemName, multiplier) {
        if (multiplier > bestMultiplier) {
            bestMultiplier = multiplier;
            bestCatchItem = itemName;
            bestCatchNameSpan.innerText = itemName;
            bestCatchValueSpan.innerText = multiplier;
            saveToLocal();
        }
    }
    
    function updateDurabilityUI() {
        const percent = Math.max(0, rodDurability);
        durabilityFillDiv.style.width = percent + "%";
        if (rodDurability < 30) {
            durabilityFillDiv.style.background = "#cd5c5c";
        } else {
            durabilityFillDiv.style.background = "#5a9e4e";
        }
    }

    // ---------- Weather & Day/Night Cycle ----------
    function updateWeatherAndTime() {
        const r = Math.random();
        weather = r < 0.3 ? 'rain' : 'sunny';
        dayTime = Math.random() < 0.5 ? 'day' : 'night';
        
        weatherIconSpan.innerHTML = weather === 'rain' ? '🌧️ Rain' : '☀️ Sunny';
        timeIconSpan.innerHTML = dayTime === 'day' ? '🌞 Day' : '🌙 Night';
    }
    
    setInterval(updateWeatherAndTime, 22000);
    updateWeatherAndTime();
    
    // Durability recharge
    setInterval(() => {
        if (!isFishing && rodDurability < 100) {
            rodDurability = Math.min(100, rodDurability + 4);
            updateDurabilityUI();
        }
    }, 800);
    
    // ---------- Game Mechanics ----------
    function getRarityBoost(item) {
        let multi = item.baseMulti * streakMultiplier;
        if (weather === 'rain' && item.rarity !== "Common") multi *= 1.5;
        if (dayTime === 'night' && item.legendary) multi *= 2.0;
        return Math.floor(multi * 10) / 10;
    }
    
    function getRandomCatch() {
        const roll = Math.random() * 100;
        let cumulative = 0;
        for (let item of lootTable) {
            cumulative += item.chance;
            if (roll <= cumulative) return item;
        }
        return lootTable[0];
    }
    
    function openLootChest() {
        const bonus = Math.floor(Math.random() * 150) + 50;
        diamonds += bonus;
        updateDiamondUI();
        showFloatingText(`🎁 Loot Chest! +${bonus}💎`, "#ffaa44");
        if (soundEnabled) playSound('rare');
        return bonus;
    }
    
    function showFloatingText(msg, color) {
        const div = document.createElement('div');
        div.className = 'toast-msg';
        div.innerText = msg;
        div.style.color = color;
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 1500);
    }
    
    function spawnSplashEffect(x, y) {
        for (let i = 0; i < 12; i++) {
            particles.push({
                x: x + (Math.random() - 0.5) * 12,
                y: y + 4,
                vx: (Math.random() - 0.5) * 2,
                vy: Math.random() * 2 + 1,
                life: 0.7,
                color: null
            });
        }
        if (soundEnabled) playSound('splash');
    }
    
    function spawnParticleRare(rare) {
        if (rare) {
            for (let i = 0; i < 30; i++) {
                particles.push({
                    x: bobberX,
                    y: bobberY - 10,
                    vx: (Math.random() - 0.5) * 5,
                    vy: Math.random() * -4 - 1,
                    life: 0.9,
                    color: "#ffcc44"
                });
            }
        }
    }
    
    function createFloatingItem(icon, name, multi, winAmount) {
        floatingItems.push({
            icon, name, multi, winAmount,
            x: bobberX,
            y: bobberY - 20,
            life: 1.0,
            vy: -1.2
        });
    }
    
    function performCatch() {
        if (!isFishing) return;
        isFishing = false;
        
        const item = getRandomCatch();
        const winMulti = getRarityBoost(item);
        let winAmount = Math.floor(currentBet * winMulti);
        const isSpecialChest = Math.random() < 0.12;
        
        let finalWin = winAmount;
        if (isSpecialChest) {
            const chestBonus = openLootChest();
            finalWin += chestBonus;
            showFloatingText(`+ ${chestBonus}💎 from Loot Chest!`, "#f7b32b");
        }
        
        diamonds += finalWin;
        updateDiamondUI();
        
        totalFishCaught++;
        totalWinningsSum += finalWin;
        if (item.rarity !== "Common") rareCatchesTotal++;
        
        totalFishSpan.innerText = totalFishCaught;
        rareCatchesSpan.innerText = rareCatchesTotal;
        totalWinningsSpan.innerText = Math.floor(totalWinningsSum);
        updateBestCatch(item.name, winMulti);
        
        // Streak logic
        if (finalWin > 0) {
            streakCount++;
            streakMultiplier = Math.min(5, 1 + Math.floor(streakCount / 3));
        } else {
            streakCount = 0;
            streakMultiplier = 1;
        }
        
        createFloatingItem(item.icon, item.name, winMulti, finalWin);
        
        if (soundEnabled) {
            if (item.legendary || winMulti >= 30) playSound('legendary');
            else if (item.rarity === "Epic") playSound('rare');
            else playSound('reel');
        }
        
        spawnParticleRare(item.legendary || winMulti >= 20);
        saveToLocal();
        
        rodDurability = Math.min(100, rodDurability + 12);
        updateDurabilityUI();
    }
    
    function finishCast(powerVal) {
        if (isFishing) return;
        if (rodDurability < 20) {
            showFloatingText("Rod is worn! Wait for recharge...", "#ff8866");
            return;
        }
        if (diamonds < currentBet) {
            showFloatingText("Not enough 💎!", "#ff6666");
            return;
        }
        
        const distanceFactor = Math.min(1, powerVal / 100);
        let splashX = 250 + distanceFactor * 480;
        splashX = Math.min(740, Math.max(60, splashX));
        bobberX = splashX;
        bobberY = 300 + Math.sin(splashX * 0.02) * 6;
        
        isFishing = true;
        diamonds -= currentBet;
        updateDiamondUI();
        rodDurability = Math.max(0, rodDurability - 8);
        updateDurabilityUI();
        
        if (soundEnabled) playSound('cast');
        spawnSplashEffect(bobberX, bobberY);
        
        const waitTime = 1200 + Math.random() * 800;
        setTimeout(() => {
            if (isFishing) performCatch();
        }, waitTime);
    }
    
    // ---------- Casting Mechanics ----------
    function startCast(e) {
        e.preventDefault();
        if (isFishing) return;
        if (rodDurability < 15) {
            showFloatingText("Rod is broken! Wait for repair...", "#ff6666");
            return;
        }
        casting = true;
        castPower = 0;
        if (powerChargeInterval) clearInterval(powerChargeInterval);
        powerChargeInterval = setInterval(() => {
            if (casting) {
                castPower = Math.min(100, castPower + 3);
                powerFillDiv.style.width = castPower + "%";
            }
        }, 20);
    }
    
    function endCast() {
        if (casting) {
            clearInterval(powerChargeInterval);
            powerChargeInterval = null;
            finishCast(castPower);
            casting = false;
            castPower = 0;
            powerFillDiv.style.width = "0%";
        }
    }
    
    // ---------- Drawing Functions ----------
    function drawWaterAndFish() {
        const grad = ctx.createLinearGradient(0, 280, 0, 440);
        grad.addColorStop(0, '#3b6e5c');
        grad.addColorStop(1, '#1e4d3b');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 270, 800, 180);
        
        // Water ripples
        for (let i = 0; i < 30; i++) {
            ctx.fillStyle = `rgba(200,240,255,${0.1 + Math.sin(Date.now() * 0.003 + i) * 0.05})`;
            ctx.beginPath();
            ctx.ellipse(40 + i * 37, 360 + Math.sin(Date.now() * 0.005 + i) * 8, 8, 4, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Jumping fish animation
        const jump = (Date.now() * 0.004) % (Math.PI * 2);
        const fishX = 500 + Math.sin(jump) * 80;
        const fishY = 320 + Math.abs(Math.sin(jump * 2)) * 18;
        ctx.fillStyle = "#cca668";
        ctx.beginPath();
        ctx.ellipse(fishX, fishY, 12, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#000";
        ctx.fillRect(fishX + 4, fishY - 2, 2, 2);
    }
    
    function drawRodAndBobber() {
        const rodTipX = 180, rodTipY = 120;
        const angleToBobber = Math.atan2(bobberY - rodTipY, bobberX - rodTipX);
        
        ctx.beginPath();
        ctx.moveTo(rodTipX, rodTipY);
        ctx.lineTo(bobberX, bobberY);
        ctx.lineWidth = 4;
        ctx.strokeStyle = "#6b4c3b";
        ctx.stroke();
        
        // Bobber
        ctx.fillStyle = "#b87c4f";
        ctx.beginPath();
        ctx.ellipse(bobberX, bobberY, 8, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#d49c6c";
        ctx.beginPath();
        ctx.ellipse(bobberX - 2, bobberY - 3, 3, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Fishing rod
        ctx.fillStyle = "#8b5a2b";
        ctx.fillRect(150, 100, 60, 12);
        ctx.fillStyle = "#c68e4a";
        ctx.fillRect(170, 92, 20, 8);
    }
    
    function drawParticlesAndFloats() {
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02;
            ctx.fillStyle = p.color || `rgba(255,255,200,${p.life})`;
            ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
            if (p.life <= 0) particles.splice(i, 1);
        }
        
        for (let i = 0; i < floatingItems.length; i++) {
            const f = floatingItems[i];
            f.y += f.vy;
            f.life -= 0.01;
            ctx.font = "bold 22px monospace";
            ctx.fillStyle = `rgba(255,235,140,${f.life})`;
            ctx.fillText(f.icon, f.x - 12, f.y);
            ctx.font = "12px monospace";
            ctx.fillStyle = `rgba(255,200,80,${f.life})`;
            ctx.fillText(`+${Math.floor(f.winAmount)}💎`, f.x - 5, f.y + 15);
            if (f.life <= 0) floatingItems.splice(i, 1);
        }
    }
    
    function draw() {
        ctx.clearRect(0, 0, 800, 450);
        
        // Sky and ground
        ctx.fillStyle = "#4c6a3c";
        ctx.fillRect(0, 0, 800, 180);
        ctx.fillStyle = "#2d5a2a";
        for (let i = 0; i < 50; i++) {
            ctx.fillRect(i * 40, 150, 12, 6);
        }
        
        drawWaterAndFish();
        drawRodAndBobber();
        drawParticlesAndFloats();
        
        // UI Text on canvas
        if (casting) {
            ctx.fillStyle = "#ffeeaa";
            ctx.font = "bold 14px monospace";
            ctx.fillText(`🎣 Power: ${Math.floor(castPower)}%`, 20, 60);
        }
        
        ctx.fillStyle = "#efd696";
        ctx.font = "bold 14px monospace";
        ctx.fillText(`Streak x${streakMultiplier} | ${streakCount} catches`, 620, 50);
        ctx.font = "12px monospace";
        ctx.fillStyle = "#ffffffaa";
        ctx.fillText("💎 Bet: " + currentBet, 20, 410);
        
        animationFrameId = requestAnimationFrame(draw);
    }
    
    // ---------- Event Listeners ----------
    canvas.addEventListener('mousedown', startCast);
    window.addEventListener('mouseup', endCast);
    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); startCast(e); });
    window.addEventListener('touchend', (e) => { e.preventDefault(); endCast(); });
    
    betDownBtn.addEventListener('click', () => {
        currentBet = Math.max(5, currentBet - 5);
        betValueSpan.innerText = currentBet;
    });
    
    betUpBtn.addEventListener('click', () => {
        currentBet = Math.min(500, currentBet + 5);
        betValueSpan.innerText = currentBet;
    });
    
    resetStatsBtn.addEventListener('click', () => {
        totalFishCaught = 0;
        rareCatchesTotal = 0;
        totalWinningsSum = 0;
        bestMultiplier = 0;
        bestCatchItem = "None";
        streakCount = 0;
        streakMultiplier = 1;
        
        totalFishSpan.innerText = 0;
        rareCatchesSpan.innerText = 0;
        totalWinningsSpan.innerText = 0;
        bestCatchNameSpan.innerText = "—";
        bestCatchValueSpan.innerText = "0";
        saveToLocal();
        showFloatingText("Stats reset!", "#aaffaa");
    });
    
    soundToggleBtn.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        soundToggleBtn.innerText = soundEnabled ? "🔊 Sound ON" : "🔇 Sound OFF";
    });
    
    // Initialize
    loadStats();
    updateDurabilityUI();
    draw();
})();