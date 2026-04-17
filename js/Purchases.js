// ─────────────────────────────────────────────────────────────────────────────
// Purchases.js  —  Módulo Compras
// ─────────────────────────────────────────────────────────────────────────────

var Purchases = (function () {

  var cache = [];
  var lines = [];   // líneas de la compra en curso

  // ── Init ───────────────────────────────────────────────────────────────────
  async function init() {
    UI.tableLoading("purchases-tbody", 5);
    cache = await State.getPurchases();
    renderTable(cache);

    var search = document.getElementById("pur-search");
    if (search) search.addEventListener("input", function () {
      var q = UI.normalizarTexto(search.value);
      renderTable(cache.filter(function (p) {
        return UI.normalizarTexto(p.id || "").includes(q) ||
               UI.normalizarTexto(p.proveedor || "").includes(q) ||
               UI.normalizarTexto(p.fecha || "").includes(q);
      }));
    });

    // Botón agregar línea
    var btnAdd = document.getElementById("btn-add-purchase-line");
    if (btnAdd) btnAdd.addEventListener("click", addLine);

    // Submit del formulario de compra
    var form = document.getElementById("purchase-form");
    if (form) form.addEventListener("submit", savePurchase);
  }

  // ── Tabla ──────────────────────────────────────────────────────────────────
  function renderTable(list) {
    var tbody = document.getElementById("purchases-tbody");
    if (!tbody) return;

    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-light);padding:28px">Sin compras registradas</td></tr>';
      return;
    }

    tbody.innerHTML = list.map(function (p) {
      var count = 0;
      try { count = JSON.parse(p.itemsJson || "[]").length; } catch (e) {}
      return '<tr>' +
        '<td><span class="badge badge-gold">' + (p.id || "—") + '</span></td>' +
        '<td>' + UI.fmtDate(p.fecha) + '</td>' +
        '<td>' + (p.proveedor || "—") + '</td>' +
        '<td>' + count + ' producto(s)</td>' +
        '<td><b>' + UI.fmtCurrency(p.total) + '</b></td>' +
      '</tr>';
    }).join("");
  }

  // ── Abrir modal ────────────────────────────────────────────────────────────
  function openForm() {
    lines = [];
    var sup  = document.getElementById("pur-supplier");
    var notes = document.getElementById("pur-notes");
    if (sup)  sup.value  = "";
    if (notes) notes.value = "";
    renderLines();
    UI.openModal("modal-purchase");
  }

  // ── Líneas de productos ────────────────────────────────────────────────────
  function addLine() {
    lines.push({ nombre: "", cantidad: 1, costoUnit: 0 });
    renderLines();
  }

  function removeLine(idx) {
    lines.splice(idx, 1);
    renderLines();
  }

  function renderLines() {
    var wrap  = document.getElementById("purchase-lines");
    var total = document.getElementById("pur-total");
    if (!wrap) return;

    if (!lines.length) {
      wrap.innerHTML = '<p style="color:var(--text-light);text-align:center;padding:12px;font-size:.85rem">Sin productos — haz clic en "+ Agregar producto"</p>';
      if (total) total.textContent = UI.fmtCurrency(0);
      return;
    }

    wrap.innerHTML = lines.map(function (l, i) {
      var sub = (l.cantidad || 0) * (l.costoUnit || 0);
      return '<div class="purchase-line">' +
        '<input class="form-control" placeholder="Nombre" value="' + (l.nombre || "") + '" oninput="Purchases._update(' + i + ',\'nombre\',this.value)">' +
        '<input class="form-control" type="number" min="1" value="' + (l.cantidad || 1) + '" oninput="Purchases._update(' + i + ',\'cantidad\',+this.value)">' +
        '<input class="form-control" type="number" min="0" value="' + (l.costoUnit || 0) + '" oninput="Purchases._update(' + i + ',\'costoUnit\',+this.value)">' +
        '<span style="font-weight:700;font-size:.85rem">' + UI.fmtCurrency(sub) + '</span>' +
        '<button type="button" class="btn-delete" onclick="Purchases.removeLine(' + i + ')" style="padding:4px 7px">✕</button>' +
      '</div>';
    }).join("");

    var gran = lines.reduce(function (s, l) { return s + (l.cantidad || 0) * (l.costoUnit || 0); }, 0);
    if (total) total.textContent = UI.fmtCurrency(gran);
  }

  // Actualizar un campo de una línea (llamado desde el HTML inline)
  function _update(idx, field, val) {
    if (lines[idx]) { lines[idx][field] = val; renderLines(); }
  }

  // ── Guardar compra ──────────────────────────────────────────────────────────
  async function savePurchase(e) {
    e.preventDefault();

    if (!lines.length) { UI.showToast("Agrega al menos un producto", "error"); return; }
    var validLines = lines.filter(function (l) { return l.nombre && l.cantidad > 0; });
    if (!validLines.length) { UI.showToast("Completa los productos", "error"); return; }

    var prov  = document.getElementById("pur-supplier")?.value || "";
    var notes = document.getElementById("pur-notes")?.value    || "";
    var total = validLines.reduce(function (s, l) { return s + l.cantidad * l.costoUnit; }, 0);

    var compra = {
      id:        UI.genId("C"),
      fecha:     new Date().toLocaleDateString("es-CO"),
      proveedor: prov,
      notas:     notes,
      total:     total,
      itemsJson: JSON.stringify(validLines),
    };

    UI.showToast("Guardando compra...", "info");
    var res = await State.addPurchase(compra);

    if (res.success) {
      cache.unshift(compra);
      renderTable(cache);
      UI.closeModal("modal-purchase");
      UI.showToast("✅ Compra registrada — " + UI.fmtCurrency(total));
    } else {
      UI.showToast("Error al guardar", "error");
    }
  }

  return { init, openForm, addLine, removeLine, _update };

})();
