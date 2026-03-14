// Stores the amount of diamonds
let diamonds = 100;

// Updates the diamond display on the main page
function updateDiamonds() {
  document.getElementById("diamonds").innerHTML =
    `<img src="diamond.png" style="width:20px;"> ${diamonds}`;
}

// Opens the crafting page
function openCrafting() {
  window.location.href = "crafting/index.html";
}

function openMines() {
  window.location.href = "mines/index.html";
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