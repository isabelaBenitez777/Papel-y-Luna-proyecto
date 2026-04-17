// ─────────────────────────────────────────────────────────────────────────────
// App.js  —  Orquestador principal de la SPA
// ─────────────────────────────────────────────────────────────────────────────

// ── Navegación entre vistas ────────────────────────────────────────────────
// El HTML llama showView('pos'), showView('products'), etc.
function showView(name) {
  // Ocultar todas las vistas
  document.querySelectorAll(".view").forEach(function (v) { v.classList.remove("active"); });

  // Mostrar la vista solicitada
  var target = document.getElementById("view-" + name);
  if (target) target.classList.add("active");

  // Marcar botón de nav como activo
  document.querySelectorAll(".nav-btn").forEach(function (btn) { btn.classList.remove("active"); });
  var activeBtn = document.querySelector('.nav-btn[onclick="showView(\'' + name + '\')"]');
  if (activeBtn) activeBtn.classList.add("active");

  // Inicializar el módulo correspondiente la primera vez que se visita
  if (name === "pos"       && !App._init.pos)       { App._init.pos       = true; POS.init(); }
  if (name === "products"  && !App._init.products)  { App._init.products  = true; Products.init(); }
  if (name === "history"   && !App._init.history)   { App._init.history   = true; History.init(); }
  if (name === "purchases" && !App._init.purchases) { App._init.purchases = true; Purchases.init(); }
  if (name === "entities"  && !App._init.entities)  { App._init.entities  = true; Entities.init(); }
}

// ── App namespace ──────────────────────────────────────────────────────────
var App = {
  // Flags para inicializar módulos solo una vez
  _init: { pos: false, products: false, history: false, purchases: false, entities: false },
};

// ── Bootstrap al cargar el DOM ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", function () {

  // ── Cerrar modales al hacer clic en el overlay ──────────────────────────
  document.querySelectorAll(".modal-overlay").forEach(function (overlay) {
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) overlay.classList.remove("open");
    });
  });

  // ── Botones data-close ──────────────────────────────────────────────────
  document.querySelectorAll("[data-close]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      UI.closeModal(btn.dataset.close);
    });
  });

  // ── Vista inicial: POS ──────────────────────────────────────────────────
  showView("pos");

});
