// 前端示範資料。正式版將改由 Python API 從 TiDB Cloud 取得資料。
const products=[
{id:"P001",name:"甜美碎花洋裝",category:"洋裝",color:"粉色",size:"M",price:1280,img:"https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=600&q=80"},
{id:"P002",name:"慵懶針織上衣",category:"上衣",color:"白色",size:"F",price:980,img:"https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=600&q=80"},
{id:"P003",name:"高腰直筒牛仔褲",category:"褲裝",color:"藍色",size:"M",price:1180,img:"https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=80"},
{id:"P004",name:"浪漫百褶長裙",category:"裙裝",color:"粉色",size:"S",price:1080,img:"https://images.unsplash.com/photo-1583496661160-fb5886a13d77?auto=format&fit=crop&w=600&q=80"},
{id:"P005",name:"質感小香風外套",category:"外套",color:"粉色",size:"M",price:1680,img:"https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=600&q=80"},
{id:"P006",name:"簡約棉質襯衫",category:"上衣",color:"白色",size:"M",price:790,img:"https://images.unsplash.com/photo-1598554747436-c9293d6a588f?auto=format&fit=crop&w=600&q=80"},
{id:"P007",name:"氣質綁帶洋裝",category:"洋裝",color:"米色",size:"S",price:1380,img:"https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=600&q=80"},
{id:"P008",name:"柔軟日常針織衫",category:"上衣",color:"米色",size:"F",price:880,img:"https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=600&q=80"}
];
const categories=[["洋裝","👗","Dress"],["上衣","🎀","Tops"],["褲裝","👖","Pants"],["裙裝","🌸","Skirts"],["外套","🧥","Outer"],["配件","👜","Accessories"]];
const $=id=>document.getElementById(id);
const favorites=new Set();const cart=[];
let favoriteOnly=false;
const money=n=>"NT$ "+n.toLocaleString("zh-TW");
function initialize(){const colors=[...new Set(products.map(p=>p.color))];for(const c of colors){const option=document.createElement("option");option.value=c;option.textContent=c;$("color").append(option)}for(const [c] of categories){const option=document.createElement("option");option.value=c;option.textContent=c;$("category").append(option)}
$("categoryTiles").innerHTML=categories.map(([name,emoji,en])=>`<button class="category-tile" data-category="${name}"><span class="emoji">${emoji}</span><strong>${name}</strong><small>${en}</small></button>`).join("");
$("categoryTiles").addEventListener("click",e=>{const tile=e.target.closest("[data-category]");if(!tile)return;$("category").value=tile.dataset.category;favoriteOnly=false;render();$("new").scrollIntoView({behavior:"smooth"})});
$("searchForm").addEventListener("submit",e=>{e.preventDefault();favoriteOnly=false;render();$("new").scrollIntoView({behavior:"smooth"})});
$("resetSearch").addEventListener("click",()=>{$("searchForm").reset();favoriteOnly=false;render()});
$("favoriteToggle").addEventListener("click",()=>{favoriteOnly=!favoriteOnly;render();$("new").scrollIntoView({behavior:"smooth"})});
$("cartToggle").addEventListener("click",()=>{renderCart();$("cartDialog").showModal()});
$("closeCart").addEventListener("click",()=>$("cartDialog").close());
$("productGrid").addEventListener("click",e=>{const btn=e.target.closest("button[data-id]");if(!btn)return;const id=btn.dataset.id;if(btn.dataset.action==="favorite"){favorites.has(id)?favorites.delete(id):favorites.add(id);$("favoriteCount").textContent=favorites.size;render()}else if(btn.dataset.action==="cart"){cart.push(id);$("cartCount").textContent=cart.length;btn.textContent="✓";setTimeout(()=>{if(btn.isConnected)btn.textContent="＋"},800)}});
$("cartItems").addEventListener("click",e=>{const btn=e.target.closest("[data-remove]");if(!btn)return;const index=Number(btn.dataset.remove);cart.splice(index,1);$("cartCount").textContent=cart.length;renderCart()});render()}
function render(){const keyword=$("keyword").value.trim().toLocaleLowerCase();const color=$("color").value;const category=$("category").value;const max=Number($("price").value);const matched=products.filter(p=>(!keyword||[p.name,p.category,p.color,p.id].join(" ").toLocaleLowerCase().includes(keyword))&&(!color||p.color===color)&&(!category||p.category===category)&&p.price<=max&&(!favoriteOnly||favorites.has(p.id)));
$("resultCount").textContent=`找到 ${matched.length} 件商品${favoriteOnly?" · 我的收藏":""}（示範資料）`;
$("emptyState").hidden=matched.length>0;
$("productGrid").innerHTML=matched.map(p=>`<article class="product-card"><div class="product-image"><img src="${p.img}" alt="${p.name}" loading="lazy"><button class="favorite ${favorites.has(p.id)?"active":""}" data-action="favorite" data-id="${p.id}" aria-label="收藏 ${p.name}">${favorites.has(p.id)?"♥":"♡"}</button></div><div class="product-info"><h3>${p.name}</h3><p>${p.category} · ${p.color} · ${p.size}</p><div class="price-row"><span class="price">${money(p.price)}</span><button class="add-cart" data-action="cart" data-id="${p.id}" aria-label="加入購物車">＋</button></div></div></article>`).join("")}
function renderCart(){if(!cart.length){$("cartItems").textContent="購物車還是空的，去看看喜歡的衣服吧 ♡";$("cartTotal").textContent="";return}const counts={};for(const id of cart)counts[id]=(counts[id]||0)+1;$("cartItems").innerHTML=Object.entries(counts).map(([id,qty])=>{const p=products.find(p=>p.id===id);return `<div class="cart-row"><span>${p.name} × ${qty}</span><span>${money(p.price*qty)}</span><button data-remove="${cart.indexOf(id)}" aria-label="移除一件">移除</button></div>`}).join("");$("cartTotal").textContent="示範總金額："+money(cart.reduce((sum,id)=>sum+products.find(p=>p.id===id).price,0))}
document.addEventListener("DOMContentLoaded",initialize);