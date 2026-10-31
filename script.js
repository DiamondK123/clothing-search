// GitHub Pages → Render Flask API → TiDB Cloud
const API_URL = "https://clothing-search-api-vk6q.onrender.com/api/clothing";
const $ = id => document.getElementById(id);
const categories = [["洋裝","👗","Dress"],["上衣","🎀","Tops"],["褲裝","👖","Pants"],["裙裝","🌸","Skirts"],["外套","🧥","Outer"],["配件","👜","Accessories"]];
// 服飾示意照片：依商品編號分配不同圖片，非實際商品照片。
const imageIds = [
  "photo-1539008835657-9e8e9680c956",
  "photo-1434389677669-e08b4cac3105",
  "photo-1541099649105-f69ad21f3246",
  "photo-1583496661160-fb5886a13d77",
  "photo-1591047139829-d91aecb6caea",
  "photo-1598554747436-c9293d6a588f",
  "photo-1515372039744-b8f02a3ae446",
  "photo-1576566588028-4147f3842f27",
  "photo-1483985988355-763728e1935b",
  "photo-1490481651871-ab68de25d43d",
  "photo-1485968579580-b6d095142e6e",
  "photo-1529139574466-a303027c1d8b"
];
function productImage(id) {
  let hash = 0;
  for (const char of String(id)) hash = (Math.imul(hash, 31) + char.charCodeAt(0)) >>> 0;
  return "https://images.unsplash.com/" + imageIds[hash % imageIds.length] + "?auto=format&fit=crop&w=700&q=82";
}
const fallbackImage = "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=700&q=80";
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
      img: productImage(p.product_id)
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
    image.src = p.img; image.alt = p.name + "（服飾示意圖片）"; image.loading = "lazy"; image.onerror = () => { image.onerror = null; image.src = fallbackImage; };
    const fav = make("button", "favorite" + (favorites.has(p.id) ? " active" : ""), favorites.has(p.id) ? "♥" : "♡");
    fav.type = "button"; fav.dataset.action = "favorite"; fav.dataset.id = p.id; fav.setAttribute("aria-label", "收藏 " + p.name);
    const demoTag = make("span", "photo-label", "穿搭示意");
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
