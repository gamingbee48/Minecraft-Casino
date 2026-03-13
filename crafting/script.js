let gridItems = [];
let revealed = [];
let isMouseDown = false;
let diamonds = parseInt(localStorage.getItem("diamonds")) || 100;
let currentCraftedItem = null;

// Item values in diamonds
const itemValues = {
  iron_sword: 50,
  iron_pickaxe: 60,
  iron_axe: 40,
  iron_shovel: 30,
  iron_hoe: 35,
  iron_helmet: 80,
  iron_chestplate: 120,
  iron_leggings: 100,
  iron_boots: 70,
  iron_door: 90,
  iron_spear: 45,
  iron_nugget: 5
};

document.addEventListener("mousedown", () => isMouseDown = true);
document.addEventListener("mouseup", () => isMouseDown = false);

// Items with adjusted probabilities
const items = [
  { name: "iron", img: "textures/iron.png", weight: 45 },  // 45% chance
  { name: "stick", img: "textures/stick.png", weight: 35 }, // 35% chance
  { name: "air", img: null, weight: 20 }                    // 20% chance
];

// Weighted random selection
function getWeightedRandomItem() {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (let item of items) {
    if (random < item.weight) {
      return item;
    }
    random -= item.weight;
  }
  return items[0]; // Fallback
}

// Minecraft recipes with corrected filenames
const recipes = [
  {
    name: "iron_sword",
    type: "shaped",
    resultImg: "textures/iron_sword.png",
    pattern: [
      null,"iron",null,
      null,"iron",null,
      null,"stick",null
    ]
  },
  {
    name: "iron_pickaxe",
    type: "shaped",
    resultImg: "textures/iron_pickaxe.png",
    pattern: [
      "iron","iron","iron",
      null,"stick",null,
      null,"stick",null
    ]
  },
  {
    name: "iron_axe",
    type: "shaped",
    resultImg: "textures/iron_axe.png",
    pattern: [
      "iron","iron",null,
      "iron","stick",null,
      null,"stick",null
    ]
  },
  {
    name: "iron_shovel",
    type: "shaped",
    resultImg: "textures/iron_shovel.png",
    pattern: [
      null,"iron",null,
      null,"stick",null,
      null,"stick",null
    ]
  },
  {
    name: "iron_hoe",
    type: "shaped",
    resultImg: "textures/iron_hoe.png",
    pattern: [
      "iron","iron",null,
      null,"stick",null,
      null,"stick",null
    ]
  },
  {
    name: "iron_helmet",
    type: "shaped",
    resultImg: "textures/iron_helmet.png",
    pattern: [
      "iron","iron","iron",
      "iron",null,"iron",
      null,null,null
    ]
  },
  {
    name: "iron_chestplate",
    type: "shaped",
    resultImg: "textures/iron_chestplate.png",
    pattern: [
      "iron",null,"iron",
      "iron","iron","iron",
      "iron","iron","iron"
    ]
  },
  {
    name: "iron_leggings",
    type: "shaped",
    resultImg: "textures/iron_leggings.png",
    pattern: [
      "iron","iron","iron",
      "iron",null,"iron",
      "iron",null,"iron"
    ]
  },
  {
    name: "iron_boots",
    type: "shaped",
    resultImg: "textures/iron_boots.png",
    pattern: [
      "iron",null,"iron",
      "iron",null,"iron",
      null,null,null
    ]
  },
  {
    name: "iron_door",
    type: "shaped",
    resultImg: "textures/iron_door.png",
    pattern: [
      "iron","iron",null,
      "iron","iron",null,
      "iron","iron",null
    ]
  },
  {
    name: "iron_spear",
    type: "shaped",
    resultImg: "textures/iron_spear.png",
    pattern: [
      null,null,"iron",
      null,"stick",null,
      "stick",null,null
    ]
  },
  {
    name: "iron_nugget",
    type: "shapeless",
    resultImg: "textures/nugget.png",
    ingredients: {
      iron: 1
    }
  }
];

function initGame() {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";
  gridItems = [];
  revealed = [];
  currentCraftedItem = null;
  document.getElementById("cashoutBtn").disabled = true;
  document.getElementById("homeBtn").disabled = false;
  clearResult();

  for (let i = 0; i < 9; i++) {
    // Weighted random selection instead of uniform distribution
    const randomItem = getWeightedRandomItem();
    gridItems.push(randomItem.name);
    revealed.push(false);

    const cell = document.createElement("div");
    cell.className = "cell";

    // Add item image if available
    if (randomItem.img) {
      const img = document.createElement("img");
      img.src = randomItem.img;
      img.style.opacity = "0"; // Start invisible
      img.dataset.revealed = "false";
      cell.appendChild(img);
    }

    // Scratch canvas
    const canvas = document.createElement("canvas");
    canvas.width = 120;
    canvas.height = 120;
    cell.appendChild(canvas);

    makeScratchable(canvas, i, cell);

    grid.appendChild(cell);
  }
}

let activeCanvas = null;
let revealCheckTimeout = null;

function makeScratchable(canvas, index, cell) {
  const ctx = canvas.getContext("2d");

  // Draw scratch surface
  ctx.fillStyle = "#888";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Reset composite operation
  ctx.globalCompositeOperation = "source-over";

  canvas.addEventListener("mousedown", (e) => {
    activeCanvas = { canvas, index, cell };
    scratch(e);
  });

  document.addEventListener("mousemove", (e) => {
    if (!isMouseDown || !activeCanvas) return;
    scratch(e);
  });

  document.addEventListener("mouseup", () => {
    activeCanvas = null;
  });
}

function scratch(e) {
  const { canvas, index, cell } = activeCanvas;
  const ctx = canvas.getContext("2d");

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // Scratch effect
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(x, y, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";

  if (!revealCheckTimeout) {
    revealCheckTimeout = setTimeout(() => {
      checkReveal(canvas, index, cell);
      revealCheckTimeout = null;
    }, 100);
  }
}

function checkShaped(recipe) {
  // Rezept in 2D Matrix umwandeln
  const pattern = [
    recipe.pattern.slice(0,3),
    recipe.pattern.slice(3,6),
    recipe.pattern.slice(6,9)
  ];

  // Bounding Box berechnen
  let minRow = 3, maxRow = -1, minCol = 3, maxCol = -1;

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (pattern[r][c] !== null) {
        minRow = Math.min(minRow, r);
        maxRow = Math.max(maxRow, r);
        minCol = Math.min(minCol, c);
        maxCol = Math.max(maxCol, c);
      }
    }
  }

  const height = maxRow - minRow + 1;
  const width = maxCol - minCol + 1;

  // Test all possible shifts
  for (let offsetRow = 0; offsetRow <= 3 - height; offsetRow++) {
    for (let offsetCol = 0; offsetCol <= 3 - width; offsetCol++) {
      let match = true;

      // Check if recipe pattern matches
      for (let r = 0; r < height; r++) {
        for (let c = 0; c < width; c++) {
          const recipeItem = pattern[minRow + r][minCol + c];

          if (recipeItem === null) continue;

          const gridIndex = (offsetRow + r) * 3 + (offsetCol + c);

          if (!revealed[gridIndex] || gridItems[gridIndex] !== recipeItem) {
            match = false;
            break;
          }
        }
        if (!match) break;
      }

      if (match) {
        // ADDITIONAL CHECK: No other items should be revealed
        // except those in the recipe area
        
        // Create list of positions used in recipe
        const usedPositions = new Set();
        for (let r = 0; r < height; r++) {
          for (let c = 0; c < width; c++) {
            if (pattern[minRow + r][minCol + c] !== null) {
              const gridIndex = (offsetRow + r) * 3 + (offsetCol + c);
              usedPositions.add(gridIndex);
            }
          }
        }
        
        // Check ALL revealed fields
        for (let i = 0; i < 9; i++) {
          if (revealed[i]) {
            // If field is revealed but NOT used in recipe
            if (!usedPositions.has(i)) {
              // Check if it's air (air is ok, as it's "nothing")
              if (gridItems[i] !== "air") {
                match = false;
                break;
              }
            }
          }
        }
        
        if (match) return true;
      }
    }
  }

  return false;
}

function checkShapeless(recipe) {
  let counts = {};
  let totalRevealed = 0;

  // Count all scratched items (except air)
  for (let i = 0; i < 9; i++) {
    if (!revealed[i]) continue;
    
    const item = gridItems[i];
    
    // Ignore air - it doesn't count as an item
    if (item === "air") continue;
    
    totalRevealed++;
    if (!counts[item]) counts[item] = 0;
    counts[item]++;
  }

  // Check if number of scratched items matches required number
  let requiredTotal = 0;
  for (let ingredient in recipe.ingredients) {
    requiredTotal += recipe.ingredients[ingredient];
  }
  
  if (totalRevealed !== requiredTotal) return false;

  // Check if all required items are present in correct amounts
  for (let ingredient in recipe.ingredients) {
    if (!counts[ingredient] || counts[ingredient] !== recipe.ingredients[ingredient]) {
      return false;
    }
  }

  return true;
}

const TRANSPARENT_PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

function showResult(imgPath) {
  const img = document.getElementById("resultImg");
  img.src = imgPath;
  img.style.opacity = "1";
  
  // Kurze Animation
  img.style.transform = "scale(1.2)";
  setTimeout(() => {
    img.style.transform = "scale(1)";
  }, 200);
}

function clearResult() {
  const img = document.getElementById("resultImg");
  img.src = TRANSPARENT_PIXEL;
  img.style.opacity = "1";
}

// Update diamonds display
function updateDiamonds() {
  document.getElementById("diamonds").innerHTML = `<img src="textures/diamond.png" style="width:20px;"> ${diamonds}`;
}

// Wait for DOM to load
document.addEventListener("DOMContentLoaded", function() {
  // Event listeners for buttons
  document.getElementById("buyTicketBtn").addEventListener("click", buyTicket);
  document.getElementById("cashoutBtn").addEventListener("click", cashout);
  document.getElementById("homeBtn").addEventListener("click", home);
  
  updateDiamonds();
  document.getElementById("homeBtn").disabled = false;
});

// Buy ticket function
function buyTicket() {
  if (diamonds >= 10) {
    diamonds -= 10;
    localStorage.setItem("diamonds", diamonds);
    updateDiamonds();
    initGame();
  } else {
    alert("Not enough diamonds!");
  }
}

// Cashout function
function cashout() {
  if (currentCraftedItem && itemValues[currentCraftedItem]) {
    diamonds += itemValues[currentCraftedItem];
    localStorage.setItem("diamonds", diamonds);
    updateDiamonds();
    clearResult();
    currentCraftedItem = null;
    document.getElementById("cashoutBtn").disabled = true;
    document.getElementById("homeBtn").disabled = false;
    resetGame();
  }
}

function home() {
  if (document.getElementById("cashoutBtn").disabled) {
    // Button is disabled
    window.location.href = "../index.html";
  } else {
    console.log("need to cashout first");
  }
}

// Wait for DOM to load
document.addEventListener("DOMContentLoaded", function() {
  // Event listeners for buttons
  document.getElementById("buyTicketBtn").addEventListener("click", buyTicket);
  document.getElementById("cashoutBtn").addEventListener("click", cashout);
  
  updateDiamonds();
});

// Change favicon when tab visibility changes
function setFavicon(iconPath) {
  let link = document.querySelector("link[rel*='icon']") || document.createElement('link');
  link.type = 'image/png';
  link.rel = 'icon';
  link.href = iconPath;
  document.head.appendChild(link);
}

document.addEventListener("visibilitychange", function() {
  if (document.hidden) {
    setFavicon("textures/nugget.png");
  } else {
    setFavicon("textures/iron.png");
  }
});

// Check if more recipes are possible
function canStillCraft() {
  // Collect all currently revealed items (except air)
  let availableItems = [];
  for (let i = 0; i < 9; i++) {
    if (revealed[i] && gridItems[i] !== "air") {
      availableItems.push(gridItems[i]);
    }
  }
  
  // If nothing revealed, can still craft (need to reveal first)
  if (availableItems.length === 0) return true;
  
  // Count items for shapeless recipes
  let ironCount = availableItems.filter(item => item === "iron").length;
  let stickCount = availableItems.filter(item => item === "stick").length;
  
  // Check shapeless recipes (nugget)
  if (ironCount === 1 && availableItems.length === 1) return true;
  
  // Check shaped recipes
  for (let recipe of recipes) {
    if (recipe.type === "shaped") {
      // Create 3x3 matrix with currently revealed items
      let grid = [];
      for (let i = 0; i < 9; i++) {
        if (revealed[i] && gridItems[i] !== "air") {
          grid[i] = gridItems[i];
        } else {
          grid[i] = null; // Empty field or not revealed
        }
      }
      
      // Check if this recipe is possible with available items
      if (isRecipePossible(recipe, grid, ironCount, stickCount)) {
        return true;
      }
    }
  }
  
  // No more recipes possible
  return false;
}

// Helper function to check if a recipe is possible
function isRecipePossible(recipe, grid, ironCount, stickCount) {
  // Count needed items for this recipe
  let neededIron = 0;
  let neededStick = 0;
  
  for (let i = 0; i < 9; i++) {
    if (recipe.pattern[i] === "iron") neededIron++;
    if (recipe.pattern[i] === "stick") neededStick++;
  }
  
  // Check if enough items available
  if (ironCount < neededIron || stickCount < neededStick) return false;
  
  // Check if items are in correct arrangement
  // (simplified version - only checks if needed items are somewhere)
  let ironPlaced = 0;
  let stickPlaced = 0;
  
  for (let i = 0; i < 9; i++) {
    if (grid[i] === "iron") ironPlaced++;
    if (grid[i] === "stick") stickPlaced++;
  }
  
  return ironPlaced >= neededIron && stickPlaced >= neededStick;
}

// Check after each reveal if more recipes possible
function checkReveal(canvas, index, cell) {
  if (revealed[index]) return;

  const ctx = canvas.getContext("2d");
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

  let transparent = 0;
  for (let i = 3; i < pixels.length; i += 4) {
    if (pixels[i] === 0) transparent++;
  }

  const percent = transparent / (canvas.width * canvas.height);

  if (percent > 0.4) {
    revealed[index] = true;
    
    canvas.style.opacity = "0";
    canvas.style.pointerEvents = "none";
    
    const img = cell.querySelector('img');
    if (img) {
      img.style.opacity = "1";
    }
    
    checkRecipes();
  }
}

// Reset function
function resetGame() {
  // Reset grid to placeholder state
  const grid = document.getElementById("grid");
  grid.innerHTML = `
    <div class="cell"></div>
    <div class="cell"></div>
    <div class="cell"></div>
    <div class="cell"></div>
    <div class="cell"></div>
    <div class="cell"></div>
    <div class="cell"></div>
    <div class="cell"></div>
    <div class="cell"></div>
  `;
  
  // Clear result box
  clearResult();
  
  currentCraftedItem = null;
  document.getElementById("cashoutBtn").disabled = true;
  document.getElementById("homeBtn").disabled = false;
  document.getElementById("buyTicketBtn").disabled = false;
}

// Check recipes after each reveal
function checkRecipes() {
  let foundRecipe = false;
  
  for (let recipe of recipes) {
    if (recipe.type === "shapeless") {
      if (checkShapeless(recipe)) {
        // Remove game over message if it exists
        const gameOverMsg = document.getElementById("gameOverMsg");
        if (gameOverMsg) gameOverMsg.remove();
        
        currentCraftedItem = recipe.name;
        showResult(recipe.resultImg);
        document.getElementById("cashoutBtn").disabled = false;
        document.getElementById("homeBtn").disabled = true;
        foundRecipe = true;
        break;
      }
      continue;
    }

    if (recipe.type === "shaped") {
      if (checkShaped(recipe)) {
        // Remove game over message if it exists
        const gameOverMsg = document.getElementById("gameOverMsg");
        if (gameOverMsg) gameOverMsg.remove();
        
        currentCraftedItem = recipe.name;
        showResult(recipe.resultImg);
        document.getElementById("cashoutBtn").disabled = false;
        document.getElementById("homeBtn").disabled = true;
        foundRecipe = true;
        break;
      }
    }
  }

  if (!foundRecipe) {
    clearResult();
    currentCraftedItem = null;
    document.getElementById("cashoutBtn").disabled = true;
    document.getElementById("homeBtn").disabled = false;
  }
}