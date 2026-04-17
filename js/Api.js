// ─────────────────────────────────────────────────────────────────────────────
// api.js  —  Comunicación con Google Apps Script (fetch + async/await)
// ─────────────────────────────────────────────────────────────────────────────

const API_URL = "https://script.google.com/macros/s/AKfycbwwWjrrhBA_VycM6sw-CZLNPHg8Y0xF7v8PGBjr5ZCGKhKzZrHEjdjiv8CGv3FPX00/exec";

/** GET — obtener registros de una hoja */
async function apiGet(resource) {
  try {
    const response = await fetch(`${API_URL}?resource=${resource}`);
    const data = await response.json();
    return data.data || [];
  } catch (e) {
    console.error(`apiGet(${resource}):`, e);
    return [];
  }
}

/** POST — guardar un registro */
async function apiPost(resource, data) {
  try {
    await fetch(API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resource, ...data }),
    });
    return { success: true };
  } catch (e) {
    console.error(`apiPost(${resource}):`, e);
    return { success: false };
  }
}

/** DELETE — eliminar por ID (via POST con action=delete) */
async function apiDelete(resource, id) {
  try {
    await fetch(API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resource, action: "delete", id }),
    });
    return { success: true };
  } catch (e) {
    console.error(`apiDelete(${resource}, ${id}):`, e);
    return { success: false };
  }
}
