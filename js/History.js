// ─────────────────────────────────────────────────────────────────────────────
// History.js  —  Módulo Historial de Ventas
// ─────────────────────────────────────────────────────────────────────────────

var History = (function () {

  var cache = [];

  async function init() {
    UI.tableLoading("history-tbody", 6);
    cache = await State.getSales();
    render(cache);

    var search = document.getElementById("hist-search");
    if (search) search.addEventListener("input", function () {
      var q = UI.normalizarTexto(search.value);
      render(cache.filter(function (s) {
        return UI.normalizarTexto(s.id || "").includes(q) ||
               UI.normalizarTexto(s.metodoPago || "").includes(q) ||
               UI.normalizarTexto(s.fecha || "").includes(q);
      }));
    });
  }

  function render(list) {
    var tbody = document.getElementById("history-tbody");
    if (!tbody) return;

    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-light);padding:28px">Sin ventas registradas</td></tr>';
      return;
    }

    tbody.innerHTML = list.map(function (s) {
      var items = [];
      try { items = JSON.parse(s.itemsJson || "[]"); } catch (e) {}
      var qty = items.reduce(function (a, i) { return a + (i.qty || 1); }, 0);

      return '<tr>' +
        '<td><span class="badge badge-gold">' + (s.id || "—") + '</span></td>' +
        '<td>' + UI.fmtDate(s.fecha) + '</td>' +
        '<td>' + qty + '</td>' +
        '<td><b>' + UI.fmtCurrency(s.total) + '</b></td>' +
        '<td><span class="badge badge-success">' + (s.metodoPago || "—") + '</span></td>' +
        '<td class="actions-cell">' +
          '<button class="btn-edit" onclick="History.showDetail(\'' + (s.id || "") + '\')">👁️</button>' +
        '</td>' +
      '</tr>';
    }).join("");
  }

  function showDetail(id) {
    var sale = cache.find(function (s) { return String(s.id) === String(id); });
    if (!sale) return;

    var items = [];
    try { items = JSON.parse(sale.itemsJson || "[]"); } catch (e) {}

    var body = document.getElementById("detail-body");
    if (!body) return;

    var total = items.reduce(function (s, i) { return s + i.precio * i.qty; }, 0);

    body.innerHTML =
      '<div style="padding:0 4px">' +
      '<p style="margin-bottom:12px;color:var(--text-light);font-size:.85rem">ID: <b>' + sale.id + '</b> — ' + UI.fmtDate(sale.fecha) + ' — ' + UI.labelMethod(sale.metodoPago) + '</p>' +
      '<div class="table-wrapper">' +
      '<table><thead><tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Subtotal</th></tr></thead><tbody>' +
      items.map(function (i) {
        return '<tr>' +
          '<td>' + i.nombre + '</td>' +
          '<td>' + i.qty + '</td>' +
          '<td>' + UI.fmtCurrency(i.precio) + '</td>' +
          '<td>' + UI.fmtCurrency(i.precio * i.qty) + '</td>' +
        '</tr>';
      }).join("") +
      '</tbody></table></div>' +
      '<p style="text-align:right;margin-top:12px;font-weight:700;font-size:1.1rem">TOTAL: ' + UI.fmtCurrency(total) + '</p>' +
      '</div>';

    // Guardar referencia para botón "Ver Factura" del modal de detalle
    var btnInv = document.getElementById("btn-invoice-from-detail");
    if (btnInv) {
      var newBtn = btnInv.cloneNode(true);
      btnInv.parentNode.replaceChild(newBtn, btnInv);
      newBtn.addEventListener("click", function () {
        UI.closeModal("modal-detail");
        _showInvoice(items, sale.metodoPago);
      });
    }

    UI.openModal("modal-detail");
  }

  function _showInvoice(items, method) {
    var body = document.getElementById("invoice-body");
    if (!body) return;
    var total = items.reduce(function (s, i) { return s + i.precio * i.qty; }, 0);
    body.innerHTML =
      '<div style="font-family:monospace;padding:10px">' +
      '<h3 style="text-align:center;margin-bottom:12px">🌙 Papel y Luna</h3><hr style="margin-bottom:12px">' +
      items.map(function (i) {
        return '<div style="display:flex;justify-content:space-between;margin-bottom:6px"><span>' + i.nombre + ' × ' + i.qty + '</span><span>' + UI.fmtCurrency(i.precio * i.qty) + '</span></div>';
      }).join("") +
      '<hr style="margin:12px 0"><div style="display:flex;justify-content:space-between;font-weight:700"><span>TOTAL</span><span>' + UI.fmtCurrency(total) + '</span></div>' +
      '<div style="margin-top:8px;color:#999;font-size:.85rem">Método: ' + UI.labelMethod(method) + '</div></div>';
    UI.openModal("modal-invoice");
  }

  return { init, showDetail };

})();
