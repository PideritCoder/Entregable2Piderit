// =====================================================
// ENTREGABLE 2 - Urban Sneakers (Carrito)
// DOM + Eventos + localStorage | Sin prompt() / alert()
// =====================================================

const STORAGE_KEY = "urban_sneakers_cart_v1";

// Helpers
const getEl = (id) => document.getElementById(id);
const formatCLP = (value) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(value);

const setStatus = (text, type = "ok") => {
  const box = getEl("statusBox");
  box.textContent = text;
  box.className = type === "error" ? "status status--error" : "status";
};

const readStorage = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

const writeStorage = (cart) => localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));

// Estado
let products = [];
let cart = readStorage();

// DOM
const brandFilter = getEl("brandFilter");
const searchInput = getEl("searchInput");
const resetBtn = getEl("resetBtn");

const productGrid = getEl("productGrid");

const cartCount = getEl("cartCount");
const cartEmpty = getEl("cartEmpty");
const cartList = getEl("cartList");
const clearBtn = getEl("clearBtn");

const subtotalEl = getEl("subtotal");
const shippingEl = getEl("shipping");
const totalEl = getEl("total");

const checkoutBtn = getEl("checkoutBtn");
const checkoutMessage = getEl("checkoutMessage");

// Render Catálogo (vista como la imagen: 3 Nike / 3 Adidas / 3 Puma)
const BRAND_ORDER = { Nike: 1, Adidas: 2, Puma: 3 };

const renderProducts = (items) => {
  productGrid.innerHTML = "";

  if (items.length === 0) {
    setStatus("No hay resultados con ese filtro/búsqueda.", "error");
    return;
  }

  const sorted = [...items].sort((a, b) => (BRAND_ORDER[a.brand] || 99) - (BRAND_ORDER[b.brand] || 99));

  sorted.forEach((p) => {
    const card = document.createElement("article");
    card.className = "product";
    card.innerHTML = `
      <div class="product__top">
        <div>
          <div class="product__name">${p.model}</div>
          <div class="product__meta">${p.brand}</div>
        </div>
        <span class="badge">${p.brand}</span>
      </div>

      <div class="product__price">${formatCLP(p.price)}</div>

      <div class="product__actions">
        <div class="qty">
          <label class="label" style="gap:4px;">
            Cantidad
            <input class="input" type="number" min="1" step="1" value="1" data-qty-for="${p.id}" />
          </label>
        </div>

        <button class="btn" type="button" data-action="add" data-id="${p.id}">
          Agregar al carrito
        </button>
      </div>
    `;
    productGrid.appendChild(card);
  });

  setStatus("Catálogo cargado. Puedes filtrar y agregar al carrito.", "ok");
};

// Filtros
const applyFilters = () => {
  const brand = brandFilter.value;
  const query = searchInput.value.trim().toLowerCase();

  let filtered = [...products];
  if (brand !== "all") filtered = filtered.filter((p) => p.brand === brand);
  if (query.length > 0) {
    filtered = filtered.filter((p) =>
      (p.model + " " + p.brand).toLowerCase().includes(query)
    );
  }

  renderProducts(filtered);
};

// Carrito
const addToCart = (productId, qty) => {
  const product = products.find((p) => p.id === productId);
  if (!product) return;

  const safeQty = Number.isFinite(qty) && qty > 0 ? Math.floor(qty) : 1;

  const idx = cart.findIndex((item) => item.id === product.id);
  if (idx >= 0) cart[idx].qty += safeQty;
  else cart.push({ id: product.id, brand: product.brand, model: product.model, price: product.price, qty: safeQty });

  writeStorage(cart);
  renderCart();
};

const removeFromCart = (id) => {
  cart = cart.filter((item) => item.id !== id);
  writeStorage(cart);
  renderCart();
};

const calcSubtotal = () => cart.reduce((acc, item) => acc + item.price * item.qty, 0);
const calcShipping = (subtotal) => (subtotal > 0 ? 4990 : 0);

const renderCart = () => {
  cartList.innerHTML = "";

  const count = cart.reduce((acc, item) => acc + item.qty, 0);
  cartCount.textContent = String(count);

  cartEmpty.textContent =
    cart.length === 0 ? "Tu carrito está vacío. Agrega zapatillas desde el catálogo." : "";

  cart.forEach((item) => {
    const li = document.createElement("li");
    li.className = "cart__item";
    li.innerHTML = `
      <div>
        <div class="cart__name">${item.model}</div>
        <div class="cart__sub">${item.brand} • ${formatCLP(item.price)} x ${item.qty}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end;">
        <strong>${formatCLP(item.price * item.qty)}</strong>
        <button class="iconbtn" type="button" data-action="remove" data-id="${item.id}">Quitar</button>
      </div>
    `;
    cartList.appendChild(li);
  });

  const subtotal = calcSubtotal();
  const shipping = calcShipping(subtotal);
  const total = subtotal + shipping;

  subtotalEl.textContent = formatCLP(subtotal);
  shippingEl.textContent = formatCLP(shipping);
  totalEl.textContent = formatCLP(total);
};

// Eventos
brandFilter.addEventListener("change", applyFilters);
searchInput.addEventListener("input", applyFilters);

resetBtn.addEventListener("click", () => {
  brandFilter.value = "all";
  searchInput.value = "";
  applyFilters();
});

productGrid.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  if (btn.dataset.action === "add") {
    const id = btn.dataset.id;
    const qtyInput = productGrid.querySelector(`input[data-qty-for="${id}"]`);
    const qty = qtyInput ? Number(qtyInput.value) : 1;
    addToCart(id, qty);
  }
});

cartList.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  if (btn.dataset.action === "remove") removeFromCart(btn.dataset.id);
});

clearBtn.addEventListener("click", () => {
  cart = [];
  writeStorage(cart);
  renderCart();
  checkoutMessage.textContent = "";
});

checkoutBtn.addEventListener("click", () => {
  if (cart.length === 0) {
    checkoutMessage.textContent = "Agrega productos antes de finalizar.";
    return;
  }
  checkoutMessage.textContent = "Compra simulada ✅ (carrito guardado en localStorage).";
});

// Init: garantiza SIEMPRE la vista "sitio ideal"
const FALLBACK_PRODUCTS = [
  { id: "nk-001", brand: "Nike", model: "Air Force 1", price: 89990 },
  { id: "nk-002", brand: "Nike", model: "Dunk Low", price: 109990 },
  { id: "nk-003", brand: "Nike", model: "Air Max 90", price: 129990 },
  { id: "ad-001", brand: "Adidas", model: "Stan Smith", price: 74990 },
  { id: "ad-002", brand: "Adidas", model: "Superstar", price: 84990 },
  { id: "ad-003", brand: "Adidas", model: "Forum Low", price: 99990 },
  { id: "pm-001", brand: "Puma", model: "Suede Classic", price: 69990 },
  { id: "pm-002", brand: "Puma", model: "RS-X", price: 94990 },
  { id: "pm-003", brand: "Puma", model: "Cali Star", price: 79990 },
];

const init = async () => {
  try {
    const res = await fetch("./data/products.json", { cache: "no-store" });
    const data = await res.json();
    products = Array.isArray(data) && data.length ? data : FALLBACK_PRODUCTS;
  } catch {
    products = FALLBACK_PRODUCTS;
  }

  // Estado inicial
  brandFilter.value = "all";
  searchInput.value = "";

  applyFilters();
  renderCart();
};

init();
