// ============================================================
// api.js - Comunicación con Google Sheets via Apps Script
// ============================================================

const API_URL =
  "https://script.google.com/macros/s/AKfycbyAS_PF_xYT21FGYwSYowx73fQuE0w9srSnGyy5yrk9FMWn5I1taJ8VL62UmW0-1t7a/exec";

let apiRequestCounter = 0;

function getApiLoaderElement() {
  return document.getElementById("apiLoader");
}

function updateApiLoaderVisibility() {
  const loader = getApiLoaderElement();
  if (!loader) return;
  loader.classList.toggle("api-loader--visible", apiRequestCounter > 0);
}

function startApiLoader() {
  apiRequestCounter += 1;
  updateApiLoaderVisibility();
}

function stopApiLoader() {
  apiRequestCounter = Math.max(0, apiRequestCounter - 1);
  updateApiLoaderVisibility();
}

function logAPI(action, resource, status, data = null) {
  const timestamp = new Date().toLocaleTimeString("es-CO");

  const statusEmoji = {
    request: "⬆️",
    response: "⬇️",
    success: "✅",
    error: "❌",
  };

  const emoji = statusEmoji[status] || "📡";

  const color =
    {
      request: "#ffe4bb",
      response: "#8bb0cf",
      success: "#8ecb90",
      error: "#e5aaa6",
    }[status] || "#666";

  console.log(
    `%c${emoji} [${timestamp}] ${action.toUpperCase()} ${resource}`,
    `color: ${color}; font-weight: bold; font-size: 12px;`
  );

  if (data) console.log(data);
}

const RESOURCE_ALIASES = {
  categorias: ["Categorias"],
  proveedores: ["Proveedores"],
  clientes: ["Clientes"],
  productos: ["Productos"],
  compras: ["Compras"],
  ventas: ["Ventas"],
};

function resolveResourceAliases(resource) {
  if (!resource) return [resource];
  return RESOURCE_ALIASES[resource.toLowerCase()] || [resource];
}

function isSheetNotFoundError(message) {
  if (!message) return false;
  const normalized = message.toString().toLowerCase();

  return [
    "cannot read properties of null",
    "sheet not found",
    "no such sheet",
  ].some((part) => normalized.includes(part));
}

async function fetchApi(resource, options = {}, action = null) {
  const aliases = resolveResourceAliases(resource);

  let lastJson = {
    success: false,
    message: "No se pudo conectar con el servidor.",
  };

  startApiLoader();

  try {
    for (const alias of aliases) {
      const url = `${API_URL}?resource=${encodeURIComponent(alias)}${
        action ? `&action=${action}` : ""
      }`;

      logAPI(
        options.method || "REQUEST",
        alias,
        "request",
        options.body ? JSON.parse(options.body) : null
      );

      const response = await fetch(url, options);

      let json;

      try {
        json = await response.json();
      } catch (err) {
        console.error(
          `Error parseando JSON de ${options.method || "FETCH"}:`,
          err
        );
        json = {
          success: false,
          message: "Respuesta no válida del servidor.",
        };
      }

      if (!response.ok) {
        json.success = false;
        json.message =
          json.message || `HTTP ${response.status} ${response.statusText}`;
      }

      logAPI(
        options.method || "REQUEST",
        alias,
        json.success ? "success" : "error",
        json
      );

      if (json.success || !isSheetNotFoundError(json.message)) {
        return json;
      }

      lastJson = json;
      console.warn(`Reintentando con alias de recurso: ${alias}`);
    }

    return lastJson;
  } finally {
    stopApiLoader();
  }
}

// ============================
// CRUD
// ============================

// GET
async function apiGet(resource) {
  const json = await fetchApi(resource);
  return json.data;
}

// POST
async function apiPost(resource, data) {
  const json = await fetchApi(resource, {
    method: "POST",
    body: JSON.stringify(data),
  });

  return json;
}

// UPDATE
async function apiUpdate(resource, data) {
  const json = await fetchApi(
    resource,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    "update"
  );

  return json;
}

// DELETE
async function apiDelete(resource, data) {
  const json = await fetchApi(
    resource,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    "delete"
  );

  if (!json.success) {
    throw new Error(json.message || "Error eliminando en Sheets.");
  }

  return json;
}

// ============================
// DIAGNÓSTICO
// ============================

async function diagnoseGoogleSheets() {
  console.log(
    "%c🔍 Iniciando diagnóstico de Google Sheets...",
    "color: orange; font-weight: bold;"
  );

  // 1. GET
  try {
    const response = await fetch(`${API_URL}?resource=categorias`);

    console.log(`Status: ${response.status} ${response.statusText}`);

    const json = await response.json();
    console.log("Respuesta:", json);
  } catch (error) {
    console.error("Error GET:", error);
  }

  // 2. POST
  try {
    const testData = {
      id: Date.now(),
      nombre: "Prueba",
    };

    const response = await fetch(`${API_URL}?resource=categorias`, {
      method: "POST",
      body: JSON.stringify(testData),
    });

    const json = await response.json();
    console.log("POST:", json);
  } catch (error) {
    console.error("Error POST:", error);
  }
}

// usar en consola
window.diagnoseSheets = diagnoseGoogleSheets;