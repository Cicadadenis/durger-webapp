const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
}

const tabsEl = document.getElementById("tabs");
const grid = document.getElementById("grid");
const totalText = document.getElementById("totalText");
const viewBtn = document.getElementById("viewBtn");
const sendBtn = document.getElementById("sendBtn");

const sheet = document.getElementById("sheet");
const sheetBody = document.getElementById("sheetBody");
const sheetTotal = document.getElementById("sheetTotal");
const sheetSend = document.getElementById("sheetSend");
const closeSheet = document.getElementById("closeSheet");
const backdrop = document.getElementById("backdrop");

/**
 * MENU is static in GitHub Pages (Variant A).
 * If you want admin changes to instantly reflect in WebApp,
 * you need a backend API and fetch MENU from it.
 */
const MENU = [
  { id: "burger", title: "Burger", price: 4.99, emoji: "🍔", category: "burgers" },
  { id: "fries",  title: "Fries",  price: 1.49, emoji: "🍟", category: "burgers" },
  { id: "hotdog", title: "Hotdog", price: 3.49, emoji: "🌭", category: "burgers" },
  { id: "taco",   title: "Taco",   price: 3.99, emoji: "🌮", category: "burgers" },
  { id: "pizza",  title: "Pizza",  price: 7.99, emoji: "🍕", category: "burgers" },

  { id: "coke",   title: "Coke",   price: 1.49, emoji: "🥤", category: "drinks" },

  { id: "donut",  title: "Donut",  price: 1.49, emoji: "🍩", category: "desserts" },
  { id: "cake",   title: "Cake",   price: 10.99, emoji: "🍰", category: "desserts" },
  { id: "popcorn",title: "Popcorn",price: 1.99, emoji: "🍿", category: "desserts" },
];

const CATEGORIES = [
  { id: "all", title: "🍽️ Всё" },
  { id: "burgers", title: "🍔 Бургеры" },
  { id: "drinks", title: "🥤 Напитки" },
  { id: "desserts", title: "🍰 Десерты" },
];

let activeCategory = "all";

const cart = new Map(); // id -> qty

function money(x){ return `$${x.toFixed(2)}`; }
function getQty(id){ return cart.get(id) || 0; }

function setQty(id, qty){
  if (qty <= 0) cart.delete(id);
  else cart.set(id, qty);
  render();
}

function total(){
  let t = 0;
  for (const [id, qty] of cart.entries()){
    const item = MENU.find(x => x.id === id);
    if (!item) continue;
    t += item.price * qty;
  }
  return t;
}

function payload(){
  const items = [];
  for (const [id, qty] of cart.entries()){
    const item = MENU.find(x => x.id === id);
    if (!item) continue;
    items.push({ id, title: item.title, qty, price: item.price, category: item.category, emoji: item.emoji });
  }
  return { items, total: Number(total().toFixed(2)) };
}

function visibleMenu(){
  if (activeCategory === "all") return MENU;
  return MENU.filter(x => x.category === activeCategory);
}

function renderTabs(){
  tabsEl.innerHTML = "";
  for (const c of CATEGORIES){
    const b = document.createElement("button");
    b.className = "tab" + (c.id === activeCategory ? " active" : "");
    b.textContent = c.title;
    b.onclick = () => {
      activeCategory = c.id;
      renderTabs();
      renderGrid();
    };
    tabsEl.appendChild(b);
  }
}

function renderGrid(){
  grid.innerHTML = "";

  for (const item of visibleMenu()){
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="badge" data-badge="${item.id}">0</div>
      <div>
        <div class="emoji">${item.emoji}</div>
        <div class="title2">${item.title}</div>
        <div class="price">${money(item.price)}</div>
      </div>
      <div class="controls">
        <button class="btn minus small" data-minus="${item.id}">−</button>
        <button class="btn small" data-qty="${item.id}">0</button>
        <button class="btn add small" data-plus="${item.id}">+</button>
      </div>
    `;

    grid.appendChild(card);
  }

  // rebind click handler after re-render
  grid.onclick = (e) => {
    const plus = e.target.getAttribute("data-plus");
    const minus = e.target.getAttribute("data-minus");
    if (plus) setQty(plus, getQty(plus) + 1);
    if (minus) setQty(minus, getQty(minus) - 1);
  };

  render();
}

function render(){
  for (const item of MENU){
    const qty = getQty(item.id);
    const badge = document.querySelector(`[data-badge="${item.id}"]`);
    if (badge){
      badge.textContent = qty;
      badge.classList.toggle("show", qty > 0);
    }
    const qtyBtn = document.querySelector(`[data-qty="${item.id}"]`);
    if (qtyBtn) qtyBtn.textContent = qty;
  }

  const t = total();
  totalText.textContent = money(t);

  const has = cart.size > 0;
  sendBtn.disabled = !has;

  if (sheet.classList.contains("show")) renderSheet();
}

function openSheet(){
  sheet.classList.add("show");
  backdrop.classList.add("show");
  renderSheet();
}
function closeSheetFn(){
  sheet.classList.remove("show");
  backdrop.classList.remove("show");
}

function renderSheet(){
  const data = payload();
  if (data.items.length === 0){
    sheetBody.innerHTML = `<div style="color:#9aa4b2;padding:8px 0;">Корзина пуста.</div>`;
  } else {
    sheetBody.innerHTML = data.items.map(it => {
      const sum = it.price * it.qty;
      return `<div class="row">
        <div>${it.emoji} ${it.title} x${it.qty}</div>
        <div>${money(sum)}</div>
      </div>`;
    }).join("");
  }
  sheetTotal.textContent = money(data.total);
}

function sendToBot(){
  const data = payload();
  if (data.items.length === 0) return;

  const str = JSON.stringify(data);
  if (tg){
    tg.sendData(str);
    tg.close();
  } else {
    alert("Telegram.WebApp недоступен. Открой через кнопку в Telegram.");
  }
}

viewBtn.addEventListener("click", openSheet);
closeSheet.addEventListener("click", closeSheetFn);
backdrop.addEventListener("click", closeSheetFn);

sheetSend.addEventListener("click", sendToBot);
sendBtn.addEventListener("click", sendToBot);

// init
renderTabs();
renderGrid();
