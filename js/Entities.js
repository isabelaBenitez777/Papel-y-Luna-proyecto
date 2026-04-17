// ─────────────────────────────────────────────────────────────────────────────
// Entities.js  —  CRUD de Categorías, Proveedores y Clientes
// ─────────────────────────────────────────────────────────────────────────────

var Entities = (function () {

  var activeTab = "categories";  // pestaña activa
  var caches    = { categories: [], suppliers: [], customers: [] };

  // Config por tipo de entidad
  var config = {
    categories: {
      resource:  "categorias",
      addFn:     function (d) { return State.addCategoria(d); },
      delFn:     function (id){ return State.deleteCategoria(id); },
      getFn:     function ()  { return State.getCategorias(); },
      tbodyId:   "cat-tbody",
      searchId:  "cat-search",
      btnNewId:  "btn-new-cat",
      fields:    [
        { id: "ef-nombre", label: "Nombre *",     key: "nombre",      required: true },
        { id: "ef-desc",   label: "Descripción",  key: "descripcion", required: false },
      ],
      cols: function (e) {
        return '<td>' + e.id + '</td><td><b>' + e.nombre + '</b></td><td>' + (e.descripcion || "—") + '</td>';
      },
    },
    suppliers: {
      resource:  "proveedores",
      addFn:     function (d) { return State.addProveedor(d); },
      delFn:     function (id){ return State.deleteProveedor(id); },
      getFn:     function ()  { return State.getProveedores(); },
      tbodyId:   "sup-tbody",
      searchId:  "sup-search",
      btnNewId:  "btn-new-sup",
      fields:    [
        { id: "ef-nombre",   label: "Nombre *",   key: "nombre",   required: true },
        { id: "ef-telefono", label: "Teléfono",   key: "telefono", required: false },
        { id: "ef-email",    label: "Email",       key: "email",    required: false },
      ],
      cols: function (e) {
        return '<td>' + e.id + '</td><td><b>' + e.nombre + '</b></td><td>' + (e.telefono || "—") + '</td><td>' + (e.email || "—") + '</td>';
      },
    },
    customers: {
      resource:  "clientes",
      addFn:     function (d) { return State.addCliente(d); },
      delFn:     function (id){ return State.deleteCliente(id); },
      getFn:     function ()  { return State.getClientes(); },
      tbodyId:   "cus-tbody",
      searchId:  "cus-search",
      btnNewId:  "btn-new-cus",
      fields:    [
        { id: "ef-nombre",   label: "Nombre *",   key: "nombre",   required: true },
        { id: "ef-telefono", label: "Teléfono",   key: "telefono", required: false },
        { id: "ef-email",    label: "Email",       key: "email",    required: false },
      ],
      cols: function (e) {
        return '<td>' + e.id + '</td><td><b>' + e.nombre + '</b></td><td>' + (e.telefono || "—") + '</td><td>' + (e.email || "—") + '</td>';
      },
    },
  };

  // ── Init ───────────────────────────────────────────────────────────────────
  async function init() {
    // Tabs
    document.querySelectorAll(".ent-tab").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll(".ent-tab").forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        activeTab = btn.dataset.tab;
        document.querySelectorAll(".ent-panel").forEach(function (p) {
          p.style.display = p.dataset.panel === activeTab ? "" : "none";
        });
        _bindSearchAndBtn(activeTab);
      });
    });

    // Cargamos las tres entidades en paralelo
    var results = await Promise.all([
      State.getCategorias(),
      State.getProveedores(),
      State.getClientes(),
    ]);
    caches.categories = results[0];
    caches.suppliers  = results[1];
    caches.customers  = results[2];

    renderTab("categories");
    renderTab("suppliers");
    renderTab("customers");
    _bindSearchAndBtn("categories");

    // Submit del formulario de entidad
    document.getElementById("entity-form")
      .addEventListener("submit", saveEntity);
  }

  function _bindSearchAndBtn(tab) {
    var cfg    = config[tab];
    var search = document.getElementById(cfg.searchId);
    var btnNew = document.getElementById(cfg.btnNewId);

    if (search) {
      var newSearch = search.cloneNode(true);
      search.parentNode.replaceChild(newSearch, search);
      newSearch.addEventListener("input", function () { renderTab(tab); });
    }

    if (btnNew) {
      var newBtn = btnNew.cloneNode(true);
      btnNew.parentNode.replaceChild(newBtn, btnNew);
      newBtn.addEventListener("click", function () { openForm(tab); });
    }
  }

  // ── Render de una pestaña ──────────────────────────────────────────────────
  function renderTab(tab) {
    var cfg   = config[tab];
    var tbody = document.getElementById(cfg.tbodyId);
    if (!tbody) return;

    var search = document.getElementById(cfg.searchId);
    var q      = UI.normalizarTexto(search ? search.value : "");

    var list = caches[tab].filter(function (e) {
      return Object.values(e).some(function (v) {
        return UI.normalizarTexto(String(v)).includes(q);
      });
    });

    if (!list.length) {
      var colCount = tab === "categories" ? 4 : 5;
      tbody.innerHTML = '<tr><td colspan="' + colCount + '" style="text-align:center;color:var(--text-light);padding:28px">Sin registros</td></tr>';
      return;
    }

    tbody.innerHTML = list.map(function (e) {
      return '<tr>' + cfg.cols(e) +
        '<td class="actions-cell">' +
          '<button class="btn-edit"   onclick="Entities.edit(\'' + tab + '\',\'' + e.id + '\')">✏️</button>' +
          '<button class="btn-delete" onclick="Entities.remove(\'' + tab + '\',\'' + e.id + '\')">🗑️</button>' +
        '</td>' +
      '</tr>';
    }).join("");
  }

  // ── Modal ──────────────────────────────────────────────────────────────────
  var _currentTab    = null;
  var _editingEntity = null;

  function openForm(tab, entity) {
    _currentTab    = tab;
    _editingEntity = entity || null;

    var cfg    = config[tab];
    var titles = { categories: "Categoría", suppliers: "Proveedor", customers: "Cliente" };
    var label  = entity ? "Editar " : "Nueva ";

    document.getElementById("entity-modal-title").textContent = label + titles[tab];

    // Construir campos dinámicamente
    var fields = document.getElementById("entity-fields");
    fields.innerHTML = cfg.fields.map(function (f) {
      var val = entity ? (entity[f.key] || "") : "";
      return '<div class="form-group">' +
        '<label class="form-label">' + f.label + '</label>' +
        '<input id="' + f.id + '" class="form-control" value="' + val + '"' +
          (f.required ? ' required' : '') + '>' +
      '</div>';
    }).join("");

    UI.openModal("modal-entity");
  }

  async function saveEntity(e) {
    e.preventDefault();

    var cfg = config[_currentTab];
    var data = { id: _editingEntity ? _editingEntity.id : UI.genId("E") };

    cfg.fields.forEach(function (f) {
      var el = document.getElementById(f.id);
      if (el) data[f.key] = el.value.trim();
    });

    if (!data.nombre) { UI.showToast("El nombre es obligatorio", "error"); return; }

    var res = await cfg.addFn(data);
    if (res.success) {
      // Actualizar cache local
      var arr = caches[_currentTab];
      var idx = arr.findIndex(function (x) { return x.id === data.id; });
      if (idx >= 0) arr[idx] = data; else arr.push(data);

      renderTab(_currentTab);
      UI.closeModal("modal-entity");
      UI.showToast("✅ Guardado");
    } else {
      UI.showToast("Error al guardar", "error");
    }
  }

  function edit(tab, id) {
    var entity = caches[tab].find(function (e) { return String(e.id) === String(id); });
    if (entity) openForm(tab, entity);
  }

  function remove(tab, id) {
    UI.confirmDialog("¿Eliminar este registro?", async function () {
      var res = await config[tab].delFn(id);
      if (res.success) {
        caches[tab] = caches[tab].filter(function (e) { return String(e.id) !== String(id); });
        renderTab(tab);
        UI.showToast("Eliminado");
      } else {
        UI.showToast("Error al eliminar", "error");
      }
    });
  }

  return { init, edit, remove };

})();
