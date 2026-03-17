// Diamonds
let diamonds = parseInt(localStorage.getItem("diamonds")) || 100;

// Lootpool
const lootPool = [
    { name: "stick", value: 1, rarity: "common" },
    { name: "iron_nugget", value: 3, rarity: "common" },
    { name: "apple", value: 5, rarity: "common" },
    { name: "iron_sword", value: 10, rarity: "common" },
    { name: "iron_chestplate", value: 15, rarity: "common" },
    { name: "golden_apple", value: 50, rarity: "uncommon" },
    { name: "enchanted_book", value: 100, rarity: "rare" },
    { name: "diamond_sword", value: 120, rarity: "epic" },
    { name: "netherite_ingot", value: 300, rarity: "legendary" }
];

// Elements
const spinner = document.getElementById("spinner");
const resultText = document.getElementById("resultText");
const diamondDisplay = document.getElementById("diamondCount");
const chestImg = document.getElementById("chestImg");
const spinnerSection = document.getElementById("spinnerSection");
const chestScreen = document.getElementById("chestScreen");
const openBtn = document.getElementById("openBtn");

//hide results at start
resultText.hidden = true;
resultBox.hidden = true;

// Sounds
const openSound = new Audio("textures/chest_open.mp3");

// Update diamonds
function updateDiamonds() {
    document.getElementById("diamonds").innerHTML = `<img src="textures/diamond.png" style="width:20px;"> ${diamonds}`;
    localStorage.setItem("diamonds", diamonds);
}

// Random item
function getRandomItem() {
    return lootPool[Math.floor(Math.random() * lootPool.length)];
}

// Build spinner
function generateSpinnerItems(winItem) {
    spinner.innerHTML = "";

    let items = [];

    for (let i = 0; i < 50; i++) {
        items.push(lootPool[Math.floor(Math.random() * lootPool.length)]);
    }

    let winIndex = 35;
    items[winIndex] = winItem;

    items.forEach(item => {
        let div = document.createElement("div");
        div.classList.add("item", item.rarity);

        let img = document.createElement("img");
        img.src = `textures/${item.name}.png`;

        div.appendChild(img);
        spinner.appendChild(div);
    });

    return winIndex;
}

// Tick sound system (CSGO style)
const tickSound = new Audio("textures/tick.mp3");

function playTicking(duration) {
    let start = Date.now();

    function tick() {
        let elapsed = Date.now() - start;
        let progress = elapsed / duration;

        if (progress >= 1) return;

        let interval = 100 + (progress * 800);

        tickSound.currentTime = 0;
        tickSound.play();

        setTimeout(tick, interval);
    }

    tick();
}

// Open chest
function openChest() {
    if (diamonds < 25) {
        resultText.textContent = "Not enough diamonds!";
        return;
    }

    diamonds -= 25;
    updateDiamonds();

    openBtn.hidden = true;
    homeBtn.hidden = true;
    resultText.hidden = true;
    resultBox.hidden = true;

    openSound.currentTime = 0;
    openSound.play();

    chestImg.classList.add("opening");

    setTimeout(() => {
        chestImg.classList.remove("opening");
        chestScreen.classList.add("hidden");
        spinnerSection.classList.remove("hidden");

        startSpin();
    }, 700);
}

// FIXED spin (IMPORTANT)
function startSpin() {
    let winItem = getRandomItem();
    let winIndex = generateSpinnerItems(winItem);

    let itemWidth = 120;
    let containerWidth = 600;

    let offset = (winIndex * itemWidth) - (containerWidth / 2) + (itemWidth / 2);

    // RESET FIRST (THIS FIXES YOUR PROBLEM)
    spinner.style.transition = "none";
    spinner.style.transform = "translateX(0px)";

    // FORCE BROWSER TO APPLY RESET
    spinner.offsetHeight;

    // ENABLE ANIMATION AGAIN
    spinner.style.transition = "transform 4s cubic-bezier(0.08, 0.6, 0.1, 1)";

    // Start ticking sound
    playTicking(4000);

    // START SPIN
    spinner.style.transform = `translateX(-${offset}px)`;

    setTimeout(() => {
        diamonds += winItem.value;
        updateDiamonds();

        resultText.textContent = `You got ${winItem.name} (+${winItem.value})`;

        setTimeout(() => {
            spinnerSection.classList.add("hidden");
            chestScreen.classList.remove("hidden");
            openBtn.hidden = false;
            homeBtn.hidden = false;
            resultText.hidden = false;
            resultBox.hidden = false;
        }, 1500);

    }, 4000);
}

function home() {
    window.location.href = "../index.html";
  }


// Event
openBtn.addEventListener("click", openChest);
homeBtn.addEventListener("click", home);

// Init
updateDiamonds();