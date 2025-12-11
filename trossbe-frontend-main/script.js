// FRONTEND script.js (carrinho + checkout)
const API_URL = "http://localhost:3000"; // backend
const CART_KEY = "trossbe_cart_v1";

// util
function $(sel){ return document.querySelector(sel) }
function $all(sel){ return Array.from(document.querySelectorAll(sel)) }
function formatBRL(v){ return Number(v).toFixed(2).replace(".", ",") }

// --- Cart helpers (LocalStorage)
function loadCart(){
  const raw = localStorage.getItem(CART_KEY);
  return raw ? JSON.parse(raw) : [];
}
function saveCart(cart){
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}
function updateCartCount(){
  const cart = loadCart();
  const count = cart.reduce((s,i) => s + (i.q || 0), 0);
  const el = document.getElementById("cart-count");
  if(el) el.textContent = count;
}

// adiciona produto ao carrinho (produto tem id, nome, preco)
function addToCart(product){
  const cart = loadCart();
  const found = cart.find(i => i.id === product.id);
  if(found) found.q++;
  else cart.push({ id: product.id, nome: product.nome, preco: Number(product.preco), q: 1 });
  saveCart(cart);
}

// remove item por id
function removeFromCart(productId){
  let cart = loadCart();
  cart = cart.filter(i => i.id !== productId);
  saveCart(cart);
  renderCartItems();
}

// altera quantidade
function changeQty(productId, qty){
  const cart = loadCart();
  const item = cart.find(i => i.id === productId);
  if(!item) return;
  item.q = qty <= 0 ? 0 : qty;
  const filtered = cart.filter(i => i.q > 0);
  saveCart(filtered);
  renderCartItems();
}

// limpar carrinho
function clearCart(){
  localStorage.removeItem(CART_KEY);
  updateCartCount();
  renderCartItems();
}

// renderiza itens no modal
function renderCartItems(){
  const place = document.getElementById("cart-items");
  const totalEl = document.getElementById("cart-total");
  const cart = loadCart();
  place.innerHTML = "";
  if(cart.length === 0){
    place.innerHTML = "<li>Seu carrinho está vazio.</li>";
    totalEl.textContent = "0.00";
    return;
  }

  let total = 0;
  cart.forEach(item => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div style="display:flex;gap:0.6rem;align-items:center">
        <strong style="min-width:140px">${item.nome}</strong>
        <input type="number" min="1" value="${item.q}" style="width:60px" data-id="${item.id}" class="cart-qty">
        <span style="margin-left:auto">R$ ${formatBRL(item.preco * item.q)}</span>
        <button class="btn ghost btn-remove" data-id="${item.id}" style="margin-left:0.5rem">Remover</button>
      </div>
    `;
    place.appendChild(li);
    total += item.preco * item.q;
  });

  totalEl.textContent = formatBRL(total);

  // event listeners
  $all(".btn-remove").forEach(b => b.addEventListener("click", () => {
    const id = Number(b.dataset.id);
    removeFromCart(id);
  }));

  $all(".cart-qty").forEach(inp => {
    inp.addEventListener("change", (e) => {
      const id = Number(e.target.dataset.id);
      const v = Number(e.target.value) || 1;
      changeQty(id, v);
    });
  });
}

function showCart(show = true){
  const modal = document.getElementById("cart-modal");
  modal.setAttribute("aria-hidden", String(!show));
  if(show) renderCartItems();
}

// --- Carregar produtos do backend (e montar cards)
async function loadProducts(){
  const list = document.getElementById("lista-produtos");
  list.innerHTML = "Carregando...";
  try {
    const resp = await fetch(`${API_URL}/produtos`);
    const produtos = await resp.json();
    if(!produtos || produtos.length === 0){
      list.innerHTML = "<p>Nenhum produto encontrado.</p>";
      return;
    }
    list.innerHTML = "";
    produtos.forEach(prod => {
      const card = document.createElement("article");
      card.className = "card";
    
      card.innerHTML = `
        <img src="${prod.imagem_url}" alt="${prod.nome}">
        <h4>${prod.nome}</h4>
        <p class="muted small">${prod.descricao || ""}</p>
        <div class="actions">
          <div class="price">R$ ${formatBRL(Number(prod.preco))}</div>
          <button class="btn add">Adicionar</button>
        </div>
      `;
    
      // botão agora recebe o produto diretamente
      card.querySelector(".btn.add").addEventListener("click", () => {
        addToCart({
          id: prod.id,
          nome: prod.nome,
          preco: Number(prod.preco)
        });
        alert(`${prod.nome} adicionado ao carrinho`);
      });
    
      list.appendChild(card);
    });
    
  } catch (err) {
    console.error(err);
    list.innerHTML = "<p style='color:red'>Erro ao carregar produtos.</p>";
  }
}

// --- Finalizar compra: envia pedido ao backend (/checkout)
async function sendOrderToSupabase(){
  const cart = loadCart();
  if(!cart || cart.length === 0) {
    alert("Carrinho vazio");
    return;
  }

  // pedir nome/email rápido
  const customer_name = prompt("Nome para o pedido:", "") || "Cliente";
  const customer_email = prompt("E-mail (opcional):", "") || null;

  // montar items e total
  const items = cart.map(i => ({
    produto_id: i.id,
    quantidade: i.q,
    preco_unitario: Number(i.preco)
  }));
  const total = cart.reduce((s,i) => s + i.preco * i.q, 0);

  try {
    const resp = await fetch(`${API_URL}/checkout`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ customer_name, customer_email, items, total })
    });
    const json = await resp.json();
    if(!resp.ok) throw new Error(json.error || "Erro no checkout");

    // sucesso
    alert(`Pedido enviado! ID: ${json.pedido.id || "—"}. Obrigado, ${customer_name}`);
    clearCart();
    showCart(false);
    console.log("Resposta do checkout:", json);
  } catch (e) {
    console.error(e);
    alert("Erro ao enviar pedido: " + (e.message || e));
  }
}

// eventos
document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  loadProducts();
  document.getElementById("btn-cart").addEventListener("click", () => showCart(true));
  document.getElementById("close-cart").addEventListener("click", () => showCart(false));
  document.getElementById("clear-cart").addEventListener("click", () => clearCart());
  document.getElementById("checkout").addEventListener("click", () => sendOrderToSupabase());
});
