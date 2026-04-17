// ─────────────────────────────────────────────────────────────────────────────
// State.js  —  Capa de acceso a datos (llama a api.js)
// ─────────────────────────────────────────────────────────────────────────────

var State = (function () {

  // ── PRODUCTOS ──────────────────────────────────────────────────────────────
  async function getProducts()       { return await apiGet("productos"); }
  async function getProductById(id)  { return (await getProducts()).find(p => String(p.id) === String(id)); }
  async function addProduct(data)    { return await apiPost("productos", data); }
  async function updateProduct(data) { return await apiPost("productos", data); }
  async function deleteProduct(id)   { return await apiDelete("productos", id); }

  // ── VENTAS ─────────────────────────────────────────────────────────────────
  async function getSales()          { return await apiGet("ventas"); }
  async function confirmSale(data)   { return await apiPost("ventas", data); }

  // ── COMPRAS ────────────────────────────────────────────────────────────────
  async function getPurchases()      { return await apiGet("compras"); }
  async function addPurchase(data)   { return await apiPost("compras", data); }

  // ── ENTIDADES ──────────────────────────────────────────────────────────────
  async function getCategorias()     { return await apiGet("categorias"); }
  async function addCategoria(data)  { return await apiPost("categorias", data); }
  async function deleteCategoria(id) { return await apiDelete("categorias", id); }

  async function getProveedores()     { return await apiGet("proveedores"); }
  async function addProveedor(data)   { return await apiPost("proveedores", data); }
  async function deleteProveedor(id)  { return await apiDelete("proveedores", id); }

  async function getClientes()        { return await apiGet("clientes"); }
  async function addCliente(data)     { return await apiPost("clientes", data); }
  async function deleteCliente(id)    { return await apiDelete("clientes", id); }

  return {
    getProducts, getProductById, addProduct, updateProduct, deleteProduct,
    getSales, confirmSale,
    getPurchases, addPurchase,
    getCategorias, addCategoria, deleteCategoria,
    getProveedores, addProveedor, deleteProveedor,
    getClientes, addCliente, deleteCliente,
  };

})();
