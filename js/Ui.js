// ─────────────────────────────────────────────────────────────────────────────
// Ui.js  —  Utilidades de interfaz compartidas
// ─────────────────────────────────────────────────────────────────────────────

var UI = (function () {

  // Normaliza texto para búsquedas (quita tildes, minúsculas)
  function normalizarTexto(texto) {
    if (!texto) return "";
    return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  // Formatea número a moneda colombiana
  function fmtCurrency(n) {
    return "$ " + Number(n || 0).toLocaleString("es-CO");
  }

  // Formatea fecha ISO a formato legible
  function fmtDate(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d)) return iso; // si ya viene como string legible, lo devuelve tal cual
    return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
  }

  // Genera un ID único con prefijo
  function genId(prefix) {
    return (prefix || "ID") + "-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
  }

  // Etiqueta del método de pago
  function labelMethod(m) {
    return { efectivo: "💵 Efectivo", nequi: "📱 Nequi", debe: "📝 Debe" }[m] || m;
  }

  // ── Toast ──────────────────────────────────────────────────────────────────
  function showToast(msg, type) {
    type = type || "success";
    var container = document.getElementById("toast-container");
    if (!container) return;

    var icons = { success: "✅", error: "❌", info: "✦" };
    var toast = document.createElement("div");
    toast.className = "toast " + type;
    toast.innerHTML = "<span>" + (icons[type] || "✦") + "</span><span>" + msg + "</span>";
    container.appendChild(toast);

    setTimeout(function () {
      toast.style.opacity = "0";
      setTimeout(function () { toast.remove(); }, 300);
    }, 3000);
  }

  // ── Modales ────────────────────────────────────────────────────────────────
  function openModal(id) {
    var el = document.getElementById(id);
    if (el) el.classList.add("open");
    else console.warn("Modal no encontrado:", id);
  }

  function closeModal(id) {
    var el = document.getElementById(id);
    if (el) el.classList.remove("open");
  }

  // Diálogo de confirmación reutilizable (usa el modal-confirm del HTML)
  function confirmDialog(message, onConfirm) {
    var msg = document.getElementById("confirm-msg");
    var btn = document.getElementById("btn-confirm-ok");
    if (!msg || !btn) return;

    msg.textContent = message;
    openModal("modal-confirm");

    // Clonamos el botón para eliminar listeners anteriores
    var newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener("click", function () {
      closeModal("modal-confirm");
      if (typeof onConfirm === "function") onConfirm();
    });
  }

  // ── Loading en tabla ───────────────────────────────────────────────────────
  function tableLoading(tbodyId, cols) {
    var el = document.getElementById(tbodyId);
    if (el) el.innerHTML = '<tr class="loading-row"><td colspan="' + cols + '">⏳ Cargando...</td></tr>';
  }

  return {
    normalizarTexto,
    fmtCurrency,
    fmtDate,
    genId,
    labelMethod,
    showToast,
    openModal,
    closeModal,
    confirmDialog,
    tableLoading,
  };

})();
