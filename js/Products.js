// ─────────────────────────────────────────────────────────────────────────────
// Products.js  —  Módulo Gestión de Productos
// ─────────────────────────────────────────────────────────────────────────────

var Products = (function () {

  var editingId   = null;
  var cache       = [];

  // ── Init ───────────────────────────────────────────────────────────────────
  async function init() {
    document.getElementById("btn-new-product")
      .addEventListener("click", function () { openModal(); });

    document.getElementById("prod-search")
      .addEventListener("input", function () { renderTable(cache); });

    document.getElementById("product-form")
      .addEventListener("submit", saveProduct);

    // ID del input de imagen en el HTML es "f-image"
    var imgInput = document.getElementById("f-image");
    if (imgInput) imgInput.addEventListener("change", previewImage);

    // Control de stock: mostrar/ocultar campo según checkbox
    var trackChk = document.getElementById("f-track");
    if (trackChk) {
      trackChk.addEventListener("change", function () {
        var sf = document.getElementById("stock-field");
        if (sf) sf.style.display = this.checked ? "flex" : "none";
      });
      // Estado inicial
      document.getElementById("stock-field").style.display = trackChk.checked ? "flex" : "none";
    }

    await loadAndRender();
  }

  async function loadAndRender() {
    UI.tableLoading("products-tbody", 7);
    cache = await State.getProducts();
    renderTable(cache);
  }

  // ── Tabla ──────────────────────────────────────────────────────────────────
  function renderTable(list) {
    var tbody = document.getElementById("products-tbody");
    var q     = UI.normalizarTexto(document.getElementById("prod-search")?.value || "");

    var filtered = list.filter(function (p) {
      return UI.normalizarTexto(p.nombre || "").includes(q) ||
             UI.normalizarTexto(p.categoria || p.categoría || "").includes(q) ||
             UI.normalizarTexto(String(p.id)).includes(q);
    });

    if (!filtered.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-light);padding:28px">Sin productos</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(function (p) {
      var cat   = p.categoria || p.categoría || "—";
      var stock = p.seguimientoInventario === "si" || p.seguimiento === "si"
        ? '<span class="badge ' + (Number(p.stock) > 0 ? "badge-success" : "badge-danger") + '">' + p.stock + '</span>'
        : '<span class="badge badge-gold">∞</span>';

      return '<tr>' +
        '<td><span class="badge badge-gold">' + p.id + '</span></td>' +
        '<td><b>' + p.nombre + '</b></td>' +
        '<td>' + cat + '</td>' +
        '<td>' + UI.fmtCurrency(p.precio) + '</td>' +
        '<td>' + UI.fmtCurrency(p.costo) + '</td>' +
        '<td>' + stock + '</td>' +
        '<td class="actions-cell">' +
          '<button class="btn-edit"   onclick="Products.edit(\'' + p.id + '\')">✏️</button>' +
          '<button class="btn-delete" onclick="Products.remove(\'' + p.id + '\')">🗑️</button>' +
        '</td>' +
      '</tr>';
    }).join("");
  }

  // ── Modal ──────────────────────────────────────────────────────────────────
  function openModal(product) {
    editingId = product ? product.id : null;

    var title   = document.getElementById("prod-modal-title");
    var form    = document.getElementById("product-form");
    var preview = document.getElementById("img-pre-view");  // ID correcto del HTML

    if (title) title.textContent = product ? "Editar Producto" : "Nuevo Producto";
    if (form)  form.reset();
    if (preview) { preview.style.display = "none"; preview.src = ""; }

    // Código automático
    var codeInput = document.getElementById("f-code");
    if (codeInput) codeInput.value = product ? product.id : UI.genId("P");

    if (product) {
      _setField("f-name",     product.nombre);
      _setField("f-category", product.categoria || product.categoría || "");
      _setField("f-price",    product.precio);
      _setField("f-cost",     product.costo);
      _setField("f-stock",    product.stock || 0);

      var track = product.seguimientoInventario === "si" || product.seguimiento === "si";
      var chk   = document.getElementById("f-track");
      if (chk) {
        chk.checked = track;
        var sf = document.getElementById("stock-field");
        if (sf) sf.style.display = track ? "flex" : "none";
      }

      if (product.url_imagen && preview) {
        preview.src = product.url_imagen;
        preview.style.display = "block";
      }
    }

    UI.openModal("modal-product");
  }

  function _setField(id, val) {
    var el = document.getElementById(id);
    if (el) el.value = val !== undefined ? val : "";
  }

  // ── Guardar ────────────────────────────────────────────────────────────────
  async function saveProduct(e) {
    e.preventDefault();

    var nombre = (document.getElementById("f-name")?.value || "").trim();
    if (!nombre) { UI.showToast("El nombre es obligatorio", "error"); return; }

    var track = document.getElementById("f-track")?.checked ? "si" : "no";

    var data = {
      id:                    document.getElementById("f-code")?.value || UI.genId("P"),
      nombre:                nombre,
      categoria:             (document.getElementById("f-category")?.value || "").trim(),
      precio:                parseFloat(document.getElementById("f-price")?.value) || 0,
      costo:                 parseFloat(document.getElementById("f-cost")?.value) || 0,
      stock:                 parseInt(document.getElementById("f-stock")?.value) || 0,
      seguimientoInventario: track,
    };

    UI.showToast("Guardando...", "info");
    var res = await State.addProduct(data);

    if (res.success) {
      UI.closeModal("modal-product");
      UI.showToast("✅ Producto guardado");
      editingId = null;
      await loadAndRender();
    } else {
      UI.showToast("Error al guardar", "error");
    }
  }

  // ── Editar / Eliminar ──────────────────────────────────────────────────────
  function edit(id) {
    var prod = cache.find(function (p) { return String(p.id) === String(id); });
    if (prod) openModal(prod);
  }

  function remove(id) {
    UI.confirmDialog("¿Eliminar el producto con ID: " + id + "?", async function () {
      var res = await State.deleteProduct(id);
      if (res.success) {
        UI.showToast("Producto eliminado");
        cache = cache.filter(function (p) { return String(p.id) !== String(id); });
        renderTable(cache);
      } else {
        UI.showToast("Error al eliminar", "error");
      }
    });
  }

  // ── Preview imagen ─────────────────────────────────────────────────────────
  function previewImage(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (ev) {
      var img = document.getElementById("img-pre-view"); // ID correcto del HTML
      if (img) { img.src = ev.target.result; img.style.display = "block"; }
    };
    reader.readAsDataURL(file);
  }

  return { init, edit, remove };

})();
