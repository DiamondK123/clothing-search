// GitHub Pages → Render Flask API → TiDB Cloud
const API_URL = "https://clothing-search-api-vk6q.onrender.com/api/clothing";
const $ = id => document.getElementById(id);
const categories = [["洋裝","👗","Dress"],["上衣","🎀","Tops"],["褲裝","👖","Pants"],["裙裝","🌸","Skirts"],["外套","🧥","Outer"],["配件","👜","Accessories"]];
// 可靠的服飾示意圖：依商品類別繪製不同款式 SVG，不依賴可能失效的外部照片。
const palettes = [
  ["#f7d3df","#cf6e92"],["#e6d7ef","#9a77b7"],["#d6e9f2","#6c99b6"],
  ["#f6e0c9","#bf916d"],["#e1e8d7","#87a18a"],["#f3d5d2","#bd797a"],
  ["#e2ddf3","#8b83b5"],["#f8e6bd","#c9a35f"],["#d9e4ec","#7892aa"],
  ["#f1d9e8","#b982a2"],["#e9e3d7","#a39887"],["#f4d8d8","#c88791"]
];
function garmentShape(category, name, fill, accent) {
  const c = (category + " " + name).toLowerCase();
  if (/褲|牛仔|pants|jeans/.test(c)) return `<path d="M112 75 L208 75 L220 252 L176 252 L160 147 L144 252 L100 252 Z" fill="${fill}" stroke="${accent}" stroke-width="4"/><path d="M160 75 V150 M118 94 H202" stroke="${accent}" stroke-width="3" fill="none"/>`;
  if (/裙|skirt/.test(c) && !/洋裝|連身|dress/.test(c)) return `<path d="M124 80 H196 L231 249 Q160 270 89 249 Z" fill="${fill}" stroke="${accent}" stroke-width="4"/><path d="M123 101 H197 M146 112 L127 242 M174 112 L193 242" stroke="${accent}" stroke-width="3" fill="none"/>`;
  if (/洋裝|連身|dress/.test(c)) return `<path d="M135 55 L151 76 H169 L185 55 L211 75 L197 124 L235 247 Q160 274 85 247 L123 124 L109 75 Z" fill="${fill}" stroke="${accent}" stroke-width="4"/><path d="M127 135 Q160 146 193 135 M160 78 V130" stroke="${accent}" stroke-width="3" fill="none"/>`;
  if (/外套|大衣|夾克|jacket|coat/.test(c)) return `<path d="M130 57 L160 77 L190 57 L213 71 L248 171 L211 187 L199 140 L203 252 H117 L121 140 L109 187 L72 171 L107 71 Z" fill="${fill}" stroke="${accent}" stroke-width="4"/><path d="M160 77 L160 251 M130 57 L160 118 L190 57" fill="none" stroke="${accent}" stroke-width="3"/>`;
  if (/包|鞋|配件|bag|accessor/.test(c)) return `<rect x="95" y="117" width="130" height="120" rx="19" fill="${fill}" stroke="${accent}" stroke-width="4"/><path d="M126 119 V95 A34 34 0 0 1 194 95 V119" fill="none" stroke="${accent}" stroke-width="9"/><path d="M110 170 H210" stroke="${accent}" stroke-width="3"/>`;
  return `<path d="M131 65 L160 83 L189 65 L217 81 L252 143 L214 163 L196 133 L196 250 H124 V133 L106 163 L68 143 L103 81 Z" fill="${fill}" stroke="${accent}" stroke-width="4"/><path d="M131 65 Q160 110 189 65 M124 151 H196" fill="none" stroke="${accent}" stroke-width="3"/>`;
}
function productImage(id, category, name) {
  let hash = 0;
  for (const char of String(id)) hash = (Math.imul(hash, 31) + char.charCodeAt(0)) >>> 0;
  const [light, dark] = palettes[hash % palettes.length];
  const shape = garmentShape(category, name, light, dark);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 390">
  <defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#fffaf8"/><stop offset="1" stop-color="${light}"/></linearGradient></defs>
  <rect width="320" height="390" fill="url(#bg)"/>
  <circle cx="265" cy="55" r="64" fill="#fff" opacity=".42"/>
  <circle cx="54" cy="322" r="80" fill="#fff" opacity=".32"/>
  <ellipse cx="160" cy="289" rx="100" ry="14" fill="${dark}" opacity=".14"/>
  <g transform="translate(0,22)">${shape}</g>
  <text x="160" y="350" text-anchor="middle" font-family="Georgia,serif" font-size="15" fill="${dark}" letter-spacing="3">FIND YOUR STYLE</text>
  </svg>`;
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}
const fallbackImage = productImage("fallback","上衣","上衣");
const favorites = new Set();
const cart = [];
let products = [];
let visibleProducts = [];
let favoriteOnly = false;
let requestNumber = 0;
const money = n => "NT$ " + Number(n).toLocaleString("zh-TW");
function make(tag, className, content) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (content !== undefined) el.textContent = String(content);
  return el;
}
function addOption(select, value) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = value;
  select.append(option);
}
function initialize() {
  for (const [name, emoji, english] of categories) {
    addOption($("category"), name);
    const tile = make("button", "category-tile");
    tile.type = "button";
    tile.dataset.category = name;
    tile.append(make("span", "emoji", emoji), make("strong", "", name), make("small", "", english));
    $("categoryTiles").append(tile);
  }
  $("categoryTiles").addEventListener("click", e => {
    const tile = e.target.closest("[data-category]");
    if (!tile) return;
    $("category").value = tile.dataset.category;
    favoriteOnly = false;
    fetchProducts();
    $("new").scrollIntoView({behavior:"smooth"});
  });
  $("searchForm").addEventListener("submit", e => {
    e.preventDefault();
    favoriteOnly = false;
    fetchProducts();
    $("new").scrollIntoView({behavior:"smooth"});
  });
  $("resetSearch").addEventListener("click", () => {
    $("searchForm").reset();
    favoriteOnly = false;
    fetchProducts();
  });
  $("favoriteToggle").addEventListener("click", () => {
    favoriteOnly = !favoriteOnly;
    renderProducts();
    $("new").scrollIntoView({behavior:"smooth"});
  });
  $("cartToggle").addEventListener("click", () => {
    renderCart();
    $("cartDialog").showModal();
  });
  $("closeCart").addEventListener("click", () => $("cartDialog").close());
  $("productGrid").addEventListener("click", e => {
    const button = e.target.closest("button[data-id]");
    if (!button) return;
    const id = button.dataset.id;
    if (button.dataset.action === "favorite") {
      favorites.has(id) ? favorites.delete(id) : favorites.add(id);
      $("favoriteCount").textContent = favorites.size;
      renderProducts();
    } else if (button.dataset.action === "cart") {
      cart.push(id);
      $("cartCount").textContent = cart.length;
      button.textContent = "✓";
    }
  });
  $("cartItems").addEventListener("click", e => {
    const button = e.target.closest("button[data-remove]");
    if (!button) return;
    cart.splice(Number(button.dataset.remove), 1);
    $("cartCount").textContent = cart.length;
    renderCart();
  });
  fetchProducts();
}
async function fetchProducts() {
  const seq = ++requestNumber;
  const query = new URLSearchParams({
    keyword: $("keyword").value.trim(),
    color: $("color").value,
    category: $("category").value,
    max_price: $("price").value
  });
  $("resultCount").textContent = "正在從 TiDB Cloud 讀取商品，首次啟動可能需要約 50 秒…";
  $("emptyState").hidden = true;
  $("productGrid").replaceChildren();
  try {
    const response = await fetch(API_URL + "?" + query.toString(), {headers: {"Accept": "application/json"}});
    if (!response.ok) throw new Error("HTTP " + response.status);
    const data = await response.json();
    if (!Array.isArray(data.products)) throw new Error("API 資料格式不正確");
    if (seq !== requestNumber) return;
    products = data.products.map(p => ({
      id: String(p.product_id), name: String(p.product_name),
      category: String(p.category_name), brand: String(p.brand_name),
      color: String(p.color), size: String(p.size),
      price: Number(p.price), stock: Number(p.stock_qty),
      img: productImage(p.product_id, p.category_name, p.product_name)
    }));
    // API 查詢結果會隨條件變動；保留已加入購物車的商品資料
    for (const p of products) productCache.set(p.id, p);
    updateColors();
    renderProducts();
  } catch (error) {
    if (seq !== requestNumber) return;
    console.error("Clothing API request failed:", error);
    $("resultCount").textContent = "無法連接服飾資料庫";
    $("emptyState").textContent = "商品載入失敗，請稍後重試。若持續發生，請檢查 Render Logs、環境變數及 CORS 設定。";
    $("emptyState").hidden = false;
  }
}
const productCache = new Map();
function updateColors() {
  // 顏色選項依資料庫回傳資料累積，避免搜尋後遺失選項
  const select = $("color");
  const selected = select.value;
  const known = new Set([...select.options].map(o => o.value));
  for (const p of products) if (!known.has(p.color)) {
    addOption(select, p.color);
    known.add(p.color);
  }
  select.value = selected;
}
function renderProducts() {
  visibleProducts = favoriteOnly ? products.filter(p => favorites.has(p.id)) : products;
  $("resultCount").textContent = "找到 " + visibleProducts.length + " 件商品" + (favoriteOnly ? " · 我的收藏" : "") + "（TiDB Cloud 即時資料）";
  $("emptyState").textContent = "目前沒有符合條件的商品，試試其他搜尋條件 ♡";
  $("emptyState").hidden = visibleProducts.length > 0;
  $("productGrid").replaceChildren();
  for (const p of visibleProducts) {
    const card = make("article", "product-card");
    const imageWrap = make("div", "product-image");
    const image = make("img");
    image.src = p.img; image.alt = p.name + "（依類別繪製的服飾示意插畫）"; image.loading = "lazy"; image.onerror = () => { image.onerror = null; image.src = fallbackImage; };
    const fav = make("button", "favorite" + (favorites.has(p.id) ? " active" : ""), favorites.has(p.id) ? "♥" : "♡");
    fav.type = "button"; fav.dataset.action = "favorite"; fav.dataset.id = p.id; fav.setAttribute("aria-label", "收藏 " + p.name);
    const demoTag = make("span", "photo-label", "款式示意");
    imageWrap.append(image, demoTag, fav);
    const info = make("div", "product-info");
    info.append(make("h3", "", p.name), make("p", "", [p.brand,p.category,p.color,p.size].join(" · ")));
    const stockTag = make("span", "stock-tag", p.stock > 0 ? "現貨 " + p.stock + " 件" : "已售完");
    info.append(stockTag);
    const priceRow = make("div", "price-row");
    const add = make("button", "add-cart", "＋");
    add.type = "button"; add.dataset.action = "cart"; add.dataset.id = p.id;
    add.disabled = p.stock <= 0; add.setAttribute("aria-label", p.stock > 0 ? "加入購物車" : "已售完");
    priceRow.append(make("span", "price", money(p.price)), add);
    info.append(priceRow);
    card.append(imageWrap, info);
    $("productGrid").append(card);
  }
}
function renderCart() {
  $("cartItems").replaceChildren();
  if (!cart.length) {
    $("cartItems").textContent = "購物車還是空的，去看看喜歡的衣服吧 ♡";
    $("cartTotal").textContent = "";
    return;
  }
  const counts = new Map();
  for (const id of cart) counts.set(id, (counts.get(id) || 0) + 1);
  let total = 0;
  for (const [id, qty] of counts) {
    const p = productCache.get(id);
    if (!p) continue;
    total += p.price * qty;
    const row = make("div", "cart-row");
    const remove = make("button", "", "移除");
    remove.type = "button"; remove.dataset.remove = String(cart.indexOf(id));
    row.append(make("span", "", p.name + " × " + qty), make("span", "", money(p.price * qty)), remove);
    $("cartItems").append(row);
  }
  $("cartTotal").textContent = "示範總金額：" + money(total);
}
document.addEventListener("DOMContentLoaded", initialize);
