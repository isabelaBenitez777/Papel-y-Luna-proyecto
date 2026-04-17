// ─────────────────────────────────────────────────────────────────────────────
// Pos.js  —  Módulo Punto de Venta
// ─────────────────────────────────────────────────────────────────────────────

var POS = (function () {

  var cart = [];
  var productsCache = [];
  var currentMethod = "efectivo";
  // Ventas guardadas (abiertas) en localStorage
  var STORAGE_KEY = "pl_saved_sales";

  // ── Init ───────────────────────────────────────────────────────────────────
  async function init() {
    UI.showToast("Sincronizando inventario...", "info");
    productsCache = await State.getProducts();
    renderProducts(productsCache);
    renderCart();
    _bindPayButtons();
    _updateSalesBadge();

    // Búsqueda
    var searchInput = document.getElementById("pos-search");
    if (searchInput) searchInput.addEventListener("input", filter);

    // Botones cabecera
    var btnSave   = document.getElementById("btn-save-sale");
    var btnCancel = document.getElementById("btn-cancel-sale");
    var btnOpen   = document.getElementById("btn-open-sales");
    var btnConfirm = document.getElementById("btn-confirm-sale");

    if (btnSave)   btnSave.addEventListener("click", saveOpenSale);
    if (btnCancel) btnCancel.addEventListener("click", clearCart);
    if (btnOpen)   btnOpen.addEventListener("click", showOpenSales);
    if (btnConfirm) btnConfirm.addEventListener("click", confirm);

    // Vuelto en efectivo
    var cashInput = document.getElementById("cash-received");
    if (cashInput) cashInput.addEventListener("input", _calcChange);

    // Método efectivo activo por defecto
    setMethod("efectivo");
  }

  // ── Renderizar grilla ──────────────────────────────────────────────────────
  function renderProducts(list) {
    var grid = document.getElementById("product-grid");
    if (!grid) return;

    if (!list.length) {
      grid.innerHTML = '<p style="color:var(--text-light);padding:20px;text-align:center">Sin productos</p>';
      return;
    }

    grid.innerHTML = list.map(function (p) {
      var sinStock = p.seguimientoInventario === "si" && Number(p.stock) <= 0;
      return '<div class="product-card' + (sinStock ? ' disabled-card" style="opacity:.5;cursor:not-allowed"' : '" onclick="POS.addToCart(\'' + p.id + '\')"') + '>' +
        '<div class="pc-image">' +
          (p.url_imagen
            ? '<img src="' + p.url_imagen + '" onerror="this.parentNode.innerHTML=\'📦\'">'
            : '📦') +
        '</div>' +
        '<div class="pc-info">' +
          '<span class="pc-name">' + p.nombre + '</span>' +
          '<span class="pc-price">' + UI.fmtCurrency(p.precio) + '</span>' +
          '<span class="pc-stock' + (sinStock ? ' out' : '') + '">' +
            (p.seguimientoInventario === "si" ? 'Stock: ' + p.stock : '∞') +
          '</span>' +
        '</div>' +
      '</div>';
    }).join("");
  }

  // ── Carrito ────────────────────────────────────────────────────────────────
  function addToCart(id) {
    var prod  = productsCache.find(function (p) { return String(p.id) === String(id); });
    if (!prod) return;

    var item  = cart.find(function (i) { return String(i.id) === String(id); });
    var stock = Number(prod.stock);

    if (item) {
      if (prod.seguimientoInventario === "si" && item.qty >= stock) {
        // Animación shake en el item del carrito
        var el = document.querySelector('[data-cart-id="' + id + '"]');
        if (el) { el.classList.add("shake-limit"); setTimeout(function () { el.classList.remove("shake-limit"); }, 500); }
        return;
      }
      item.qty++;
    } else {
      if (prod.seguimientoInventario === "si" && stock <= 0) return;
      cart.push(Object.assign({}, prod, { qty: 1 }));
    }
    renderCart();
    _pulseBadge();
  }

  function updateQty(id, delta) {
    var idx  = cart.findIndex(function (i) { return String(i.id) === String(id); });
    if (idx === -1) return;

    var prod = productsCache.find(function (p) { return String(p.id) === String(id); });
    var newQty = cart[idx].qty + delta;

    if (newQty <= 0) {
      cart.splice(idx, 1);
    } else if (prod && prod.seguimientoInventario === "si" && newQty > Number(prod.stock)) {
      UI.showToast("No hay más stock disponible", "error");
      return;
    } else {
      cart[idx].qty = newQty;
    }
    renderCart();
  }

  function renderCart() {
    var wrap     = document.getElementById("cart-items");
    var badge    = document.getElementById("cart-badge");
    var totalEl  = document.getElementById("cart-total");
    var subEl    = document.getElementById("cart-subtotal");
    var btnSave  = document.getElementById("btn-save-sale");
    var btnCncl  = document.getElementById("btn-cancel-sale");

    if (!wrap) return;

    var total = cart.reduce(function (s, i) { return s + i.precio * i.qty; }, 0);
    var items = cart.reduce(function (s, i) { return s + i.qty; }, 0);

    if (badge)   badge.textContent = items + " item" + (items !== 1 ? "s" : "");
    if (totalEl) totalEl.textContent = UI.fmtCurrency(total);
    if (subEl)   subEl.textContent   = UI.fmtCurrency(total);
    if (btnSave) btnSave.style.display  = cart.length ? "inline-flex" : "none";
    if (btnCncl) btnCncl.style.display  = cart.length ? "inline-flex" : "none";

    if (!cart.length) {
      wrap.innerHTML = '<p style="text-align:center;color:var(--text-light);padding:20px;font-size:.9rem">El carrito está vacío 🛒</p>';
      return;
    }

    wrap.innerHTML = cart.map(function (i) {
      return '<div class="cart-item-modern" data-cart-id="' + i.id + '">' +
        '<div class="ci-info">' +
          '<div class="ci-name">' + i.nombre + '</div>' +
          '<span class="ci-price">' + UI.fmtCurrency(i.precio) + ' c/u</span>' +
        '</div>' +
        '<div class="ci-controls">' +
          '<button class="qty-btn" onclick="POS.updateQty(\'' + i.id + '\',-1)">−</button>' +
          '<span class="qty-val">' + i.qty + '</span>' +
          '<button class="qty-btn" onclick="POS.updateQty(\'' + i.id + '\',1)">+</button>' +
          '<button class="btn-remove" onclick="POS.updateQty(\'' + i.id + '\',-' + i.qty + ')" title="Quitar">✕</button>' +
        '</div>' +
      '</div>';
    }).join("");

    _calcChange();
  }

  // ── Métodos de pago ────────────────────────────────────────────────────────
  function setMethod(method) {
    currentMethod = method;
    document.querySelectorAll(".pay-btn").forEach(function (b) { b.classList.remove("active"); });
    var btn = document.getElementById("pay-" + method);
    if (btn) btn.classList.add("active");

    var cashWrap = document.getElementById("cash-wrap");
    if (cashWrap) cashWrap.style.display = method === "efectivo" ? "flex" : "none";
    _calcChange();
  }

  function _bindPayButtons() {
    document.querySelectorAll(".pay-btn").forEach(function (btn) {
      btn.addEventListener("click", function () { setMethod(btn.dataset.method); });
    });
  }

  function _calcChange() {
    if (currentMethod !== "efectivo") return;
    var received = Number(document.getElementById("cash-received")?.value || 0);
    var total    = cart.reduce(function (s, i) { return s + i.precio * i.qty; }, 0);
    var changeBox = document.getElementById("change-box");
    var changeEl  = document.getElementById("change-amount");

    if (!changeBox || !changeEl) return;
    if (received >= total && received > 0) {
      changeBox.style.display = "flex";
      changeEl.textContent = UI.fmtCurrency(received - total);
    } else {
      changeBox.style.display = "none";
    }
  }

  // ── Confirmar venta ────────────────────────────────────────────────────────
  async function confirm() {
    if (!cart.length) { UI.showToast("El carrito está vacío", "error"); return; }

    var btn = document.getElementById("btn-confirm-sale");
    if (btn) { btn.textContent = "Procesando..."; btn.disabled = true; }

    var total = cart.reduce(function (s, i) { return s + i.precio * i.qty; }, 0);
    var received = Number(document.getElementById("cash-received")?.value || 0);

    var venta = {
      id:         UI.genId("V"),
      fecha:      new Date().toLocaleDateString("es-CO"),
      metodoPago: currentMethod,
      total:      total,
      itemsJson:  JSON.stringify(cart.map(function (i) {
        return { id: i.id, nombre: i.nombre, qty: i.qty, precio: i.precio };
      })),
    };

    // ── Guardamos en Google Sheets via apiPost ──
    var res = await State.confirmSale(venta);

    if (btn) { btn.textContent = "Confirmar Venta"; btn.disabled = false; }

    if (res.success) {
      // Mostrar modal de confirmación
      var confTotal  = document.getElementById("conf-total-text");
      var confDetail = document.getElementById("conf-detail-text");
      var confChange = document.getElementById("conf-change-box");
      var confChText = document.getElementById("conf-change-text");

      if (confTotal)  confTotal.textContent  = UI.fmtCurrency(total);
      if (confDetail) confDetail.textContent  = cart.length + " producto(s) — " + UI.labelMethod(currentMethod);

      if (currentMethod === "efectivo" && received >= total && received > 0) {
        if (confChange) confChange.style.display = "flex";
        if (confChText) confChText.textContent = UI.fmtCurrency(received - total);
      } else {
        if (confChange) confChange.style.display = "none";
      }

      // Guardar copia para ver factura después
      window._lastSaleCart   = cart.slice();
      window._lastSaleMethod = currentMethod;

      cart = [];
      renderCart();
      renderProducts(productsCache);
      UI.openModal("modal-sale-ok");
    } else {
      UI.showToast("Error al guardar la venta", "error");
    }
  }

  // ── Ver factura desde modal confirmación ───────────────────────────────────
  function _bindInvoiceBtn() {
    var btn = document.getElementById("btn-ver-factura-conf");
    if (btn) btn.addEventListener("click", function () {
      UI.closeModal("modal-sale-ok");
      _showInvoice(window._lastSaleCart, window._lastSaleMethod);
    });
  }

  function _showInvoice(items, method) {
    var body = document.getElementById("invoice-body");
    if (!body || !items) return;

    var total = items.reduce(function (s, i) { return s + i.precio * i.qty; }, 0);
    body.innerHTML =
      '<div style="font-family:monospace;padding:10px">' +
      '<h3 style="text-align:center;margin-bottom:12px">🌙 Papel y Luna</h3>' +
      '<hr style="margin-bottom:12px">' +
      items.map(function (i) {
        return '<div style="display:flex;justify-content:space-between;margin-bottom:6px">' +
          '<span>' + i.nombre + ' × ' + i.qty + '</span>' +
          '<span>' + UI.fmtCurrency(i.precio * i.qty) + '</span>' +
        '</div>';
      }).join("") +
      '<hr style="margin:12px 0">' +
      '<div style="display:flex;justify-content:space-between;font-weight:700">' +
        '<span>TOTAL</span><span>' + UI.fmtCurrency(total) + '</span>' +
      '</div>' +
      '<div style="margin-top:8px;color:#999;font-size:.85rem">Método: ' + UI.labelMethod(method) + '</div>' +
      '</div>';

    UI.openModal("modal-invoice");
  }

  // ── Ventas guardadas ────────────────────────────────────────────────────────
  function _getSaved() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
  }
  function _setSaved(arr) { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); }

  function saveOpenSale() {
    if (!cart.length) { UI.showToast("El carrito está vacío", "error"); return; }
    var saved = _getSaved();
    saved.push({ id: UI.genId("S"), items: cart.slice(), method: currentMethod, date: new Date().toLocaleDateString("es-CO") });
    _setSaved(saved);
    cart = [];
    renderCart();
    _updateSalesBadge();
    UI.showToast("Venta guardada ✅");
  }

  function showOpenSales() {
    var saved = _getSaved();
    var list  = document.getElementById("open-sales-list");
    if (!list) return;

    if (!saved.length) {
      list.innerHTML = '<p style="color:var(--text-light);text-align:center;padding:20px">Sin ventas guardadas</p>';
    } else {
      list.innerHTML = saved.map(function (s, i) {
        var subtotal = s.items.reduce(function (a, x) { return a + x.precio * x.qty; }, 0);
        return '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--border)">' +
          '<div>' +
            '<b>' + s.id + '</b> — ' + s.date +
            '<div style="font-size:.8rem;color:var(--text-light)">' + s.items.length + ' producto(s) — ' + UI.fmtCurrency(subtotal) + '</div>' +
          '</div>' +
          '<button class="btn btn-primary btn-sm" onclick="POS.loadSaved(' + i + ')">Retomar</button>' +
        '</div>';
      }).join("");
    }
    UI.openModal("modal-open-sales");
  }

  function loadSaved(idx) {
    var saved = _getSaved();
    var sale  = saved[idx];
    if (!sale) return;
    cart = sale.items;
    currentMethod = sale.method;
    saved.splice(idx, 1);
    _setSaved(saved);
    renderCart();
    setMethod(currentMethod);
    _updateSalesBadge();
    UI.closeModal("modal-open-sales");
    UI.showToast("Venta retomada ✅");
  }

  function _updateSalesBadge() {
    var saved  = _getSaved();
    var badge  = document.getElementById("open-sales-badge");
    if (!badge) return;
    if (saved.length) {
      badge.style.display = "inline-block";
      badge.textContent   = saved.length;
    } else {
      badge.style.display = "none";
    }
  }

  function clearCart() {
    if (!cart.length) return;
    cart = [];
    renderCart();
    UI.showToast("Venta cancelada");
  }

  function filter() {
    var term = UI.normalizarTexto(document.getElementById("pos-search")?.value || "");
    renderProducts(productsCache.filter(function (p) {
      return UI.normalizarTexto(p.nombre).includes(term) ||
             UI.normalizarTexto(p.categoria || "").includes(term) ||
             UI.normalizarTexto(String(p.id)).includes(term);
    }));
  }

  function _pulseBadge() {
    var badge = document.getElementById("cart-badge");
    if (!badge) return;
    badge.style.transform = "scale(1.25)";
    setTimeout(function () { badge.style.transform = "scale(1)"; }, 200);
  }

  return { init, addToCart, updateQty, setMethod, confirm, saveOpenSale, showOpenSales, loadSaved, clearCart, filter };

})();
