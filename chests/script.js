let diamonds = parseInt(localStorage.getItem("diamonds")) || 100;
let gameActive = false;

const diamondText = document.getElementById("diamondCount");
const resultText = document.getElementById("resultText");
const message = document.getElementById("message");

window.onload = function () {
  updateDiamonds();
};

function updateDiamonds() {
  diamondText.textContent = diamonds;
  localStorage.setItem("diamonds", diamonds);
}

document.getElementById("homeBtn").onclick = home;

function home(){

if(!gameActive){

window.location.href="../index.html";

}

else{

message.textContent="Finish the game first!";

setTimeout(()=>message.textContent="",2000);

}

}

const lootPools = {

dungeon:[
{item:"Rotten Flesh",value:2,chance:40},
{item:"Bone",value:3,chance:30},
{item:"Iron Ingot",value:10,chance:20},
{item:"Golden Apple",value:40,chance:8},
{item:"Enchanted Book",value:120,chance:2}
],

village:[
{item:"Bread",value:5,chance:40},
{item:"Emerald",value:20,chance:25},
{item:"Iron Gear",value:35,chance:20},
{item:"Diamond",value:80,chance:10},
{item:"Totem",value:200,chance:5}
],

end:[
{item:"Iron",value:20,chance:50},
{item:"Gold",value:40,chance:25},
{item:"Diamond",value:120,chance:15},
{item:"Elytra",value:400,chance:8},
{item:"Netherite Scrap",value:800,chance:2}
]

};

const chestPrices = {

dungeon:25,
village:40,
end:120

};

function getRandomItem(pool){

let rand=Math.random()*100;
let sum=0;

for(let item of pool){

sum+=item.chance;

if(rand<=sum){

return item;

}

}

}

function openChest(type){

if(gameActive) return;

const price = chestPrices[type];

if(diamonds<price){

resultText.textContent="Not enough diamonds!";
return;

}

gameActive=true;

diamonds-=price;

const loot = getRandomItem(lootPools[type]);

diamonds+=loot.value;

updateDiamonds();

resultText.textContent="You found: "+loot.item+" (+"+loot.value+"💎)";

if(loot.value>price){

bigWinEffect();

}

gameActive=false;

}

function bigWinEffect(){

document.body.style.background="#ffd700";

setTimeout(()=>{

document.body.style.background="#1e1e1e";

},300);

}