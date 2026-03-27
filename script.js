// Stores the amount of diamonds
let diamonds = 100;

// Updates the diamond display on the main page
function updateDiamonds() {
  document.getElementById("diamonds").innerHTML =
    `<img src="diamond.png" style="width:20px;"> ${diamonds}`;
}

// Opens the crafting page
function openCrafting() {
  window.location.href = "./crafting/index.html";
}

function openMines() {
  window.location.href = "./mines/index.html";
}

function openChest() {
  window.location.href = "./chests/index.html";
}

function openSlots() {
  window.location.href = "./slots/index.html";
}

function openEnchanting() {
  window.location.href = "./enchanting/index.html";
}

// Load saved diamonds when the page starts
window.onload = function () {

  // Check if diamonds are stored in localStorage
  const savedDiamonds = localStorage.getItem("diamonds");

  if (savedDiamonds !== null) {
    diamonds = parseInt(savedDiamonds);
  }

  localStorage.setItem("diamonds", diamonds);
  updateDiamonds();
};



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
    setFavicon("diamond_grey.png");
  } else {
    setFavicon("diamond.png");
  }
});
