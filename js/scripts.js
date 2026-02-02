// ================== CONFIG (Google Sheets API directo) ==================
// ✅ Como tu página Comidas: NO Apps Script WebApp => NO CORS
const SPREADSHEET_ID = "14JgCUtCv2erwsGIQj_L6OJUEDPzmVrv1BNaxnEltexM";
const SHEET_NAME = "comandos"; // pestaña/hoja

// ================== CONFIG OAUTH (GIS) ==================
const OAUTH_CLIENT_ID = "1066595385287-fp3u67rsvh5c8e0k3rs6nfdda8fb9q23.apps.googleusercontent.com";

// ✅ Igual que Comidas: identidad + userinfo + permiso a Sheets
// (y mantenemos el scope extra "Testing")
const OAUTH_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",

  // ✅ leer/escribir la planilla (Sheets API)
  "https://www.googleapis.com/auth/spreadsheets"
].join(" ");

// ✅ scope mínimo que necesitamos realmente en Comandos
const REQUIRED_SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";

function scopeHas(scopeStr, required) {
  const parts = String(scopeStr || "").split(/\s+/).filter(Boolean);
  return parts.includes(required);
}

// LocalStorage OAuth (clave propia de esta app)
const LS_OAUTH = "comandos_oauth_token_v1";        // {access_token, expires_at}
const LS_OAUTH_EMAIL = "comandos_oauth_email_v1";  // email hint

// ================== HEADER ==================
const header = document.querySelector("header");

const seccionTitulo = document.createElement("section");
seccionTitulo.className = "titulo";
header.appendChild(seccionTitulo);

// fila 1: título + subtítulo
const headerRow1 = document.createElement("div");
headerRow1.className = "header-row header-row-1";
seccionTitulo.appendChild(headerRow1);

const h1 = document.createElement("h1");
h1.innerText = "Comandos Git para siempre";
headerRow1.appendChild(h1);

const subtitulo = document.createElement("p");
subtitulo.className = "subtitulo";
subtitulo.innerText = "Guardá tus snippets de Git, con categorías, tags y botón copiar.";
seccionTitulo.appendChild(subtitulo);

// fila 2: estado (izq) + acciones (der)  ✅ estilo Notas
const headerRow2 = document.createElement("div");
headerRow2.className = "header-row header-row-2";
seccionTitulo.appendChild(headerRow2);

// contenedor izquierdo: pill estado + email
const headerLeft = document.createElement("div");
headerLeft.className = "header-left";
headerRow2.appendChild(headerLeft);

const syncPill = document.createElement("div");
syncPill.className = "sync-pill";
syncPill.innerHTML = `<span class="sync-dot"></span><span class="sync-text">Cargando…</span>`;
headerLeft.appendChild(syncPill);

const accountPill = document.createElement("div");
accountPill.className = "account-pill";
accountPill.style.display = "none";
headerLeft.appendChild(accountPill);

// contenedor derecho: botones
const headerActions = document.createElement("div");
headerActions.className = "header-actions";
headerRow2.appendChild(headerActions);

const btnConnect = document.createElement("button");
btnConnect.className = "btn-connect";
btnConnect.type = "button";
btnConnect.textContent = "Conectar";
btnConnect.dataset.mode = "connect"; // connect | switch
headerActions.appendChild(btnConnect);

const btnRefresh = document.createElement("button");
btnRefresh.className = "btn-refresh";
btnRefresh.type = "button";
btnRefresh.textContent = "↻";
btnRefresh.title = "Reintentar conexión";
btnRefresh.style.display = "none";
headerActions.appendChild(btnRefresh);

function setSync(state, text) {
  syncPill.classList.remove("ok", "saving", "offline");
  if (state) syncPill.classList.add(state);
  syncPill.querySelector(".sync-text").textContent = text;
}

function setAccountUI(email) {
  const e = (email || "").toString().trim().toLowerCase();

  if (!e) {
    accountPill.style.display = "none";
    accountPill.textContent = "";
    btnConnect.textContent = "Conectar";
    btnConnect.dataset.mode = "connect";
    return;
  }

  accountPill.style.display = "inline-flex";
  accountPill.textContent = e;
  btnConnect.textContent = "Cambiar cuenta";
  btnConnect.dataset.mode = "switch";
}

// ================== MAIN ==================
const main = document.querySelector("main")

// ------- Sección agregar -------
const seccionAgregar = document.createElement("section")
seccionAgregar.className = "agregar"
main.appendChild(seccionAgregar)

const form = document.createElement("form")
form.className = "form-grid"
seccionAgregar.appendChild(form)

// Categoria
const labelCat = document.createElement("label")
labelCat.innerText = "Categoría (opcional)"
labelCat.htmlFor = "categoria"
form.appendChild(labelCat)

const inputCat = document.createElement("input")
inputCat.id = "categoria"
inputCat.type = "text"
inputCat.placeholder = "Ej: Ramas / Merge / Diagnóstico"
form.appendChild(inputCat)

// Titulo
const labelTit = document.createElement("label")
labelTit.innerText = "Título *"
labelTit.htmlFor = "titulo"
form.appendChild(labelTit)

const inputTit = document.createElement("input")
inputTit.id = "titulo"
inputTit.type = "text"
inputTit.placeholder = "Ej: Ver repos remotos"
form.appendChild(inputTit)

// Tags
const labelTags = document.createElement("label")
labelTags.innerText = "Tags (opcional)"
labelTags.htmlFor = "tags"
form.appendChild(labelTags)

const inputTags = document.createElement("input")
inputTags.id = "tags"
inputTags.type = "text"
inputTags.placeholder = "Ej: git, remoto, origin"
form.appendChild(inputTags)

// Comando
const labelCmd = document.createElement("label")
labelCmd.innerText = "Comando *"
labelCmd.htmlFor = "comando"
form.appendChild(labelCmd)

const textareaCmd = document.createElement("textarea")
textareaCmd.id = "comando"
textareaCmd.rows = 3
textareaCmd.placeholder = "Ej: git remote -v"
form.appendChild(textareaCmd)

// Explicacion
const labelExp = document.createElement("label")
labelExp.innerText = "Explicación (opcional)"
labelExp.htmlFor = "explicacion"
form.appendChild(labelExp)

const textareaExp = document.createElement("textarea")
textareaExp.id = "explicacion"
textareaExp.rows = 3
textareaExp.placeholder = "Ej: Muestra todas las URLs remotas configuradas."
form.appendChild(textareaExp)

// Acciones
const acciones = document.createElement("div")
acciones.className = "acciones"
form.appendChild(acciones)

const btnAgregar = document.createElement("button")
btnAgregar.type = "submit"
btnAgregar.className = "btn-primary"
btnAgregar.innerText = "Guardar comando"
acciones.appendChild(btnAgregar)

const btnLimpiar = document.createElement("button")
btnLimpiar.type = "button"
btnLimpiar.className = "btn-ghost"
btnLimpiar.innerText = "Limpiar"
acciones.appendChild(btnLimpiar)

// ------- Barra de búsqueda -------
const barra = document.createElement("section")
barra.className = "barra"
main.appendChild(barra)

const inputBuscar = document.createElement("input")
inputBuscar.type = "search"
inputBuscar.placeholder = "Buscar por título, comando, categoría o tags…"
inputBuscar.className = "buscar"
barra.appendChild(inputBuscar)

const contador = document.createElement("div")
contador.className = "contador"
contador.innerText = "0 comandos"
barra.appendChild(contador)

// ------- Mural -------
const mural = document.createElement("section")
mural.className = "mural"
main.appendChild(mural)

// ================== STATE ==================
let comandosCache = []

// ================== OAUTH STATE ==================
let tokenClient = null;
let oauthAccessToken = "";
let oauthExpiresAt = 0;


// Evita carreras (connect doble click)
let connectInFlight = null;

function isOnline() {
  return navigator.onLine !== false;
}

function isTokenValid() {
  return !!oauthAccessToken && Date.now() < (oauthExpiresAt - 10_000);
}

function loadStoredOAuth() {
  try {
    const raw = localStorage.getItem(LS_OAUTH);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed?.access_token || !parsed?.expires_at) return null;
    return { access_token: parsed.access_token, expires_at: Number(parsed.expires_at) };
  } catch {
    return null;
  }
}
function saveStoredOAuth(access_token, expires_at) {
  try { localStorage.setItem(LS_OAUTH, JSON.stringify({ access_token, expires_at })); } catch {}
}
function clearStoredOAuth() {
  try { localStorage.removeItem(LS_OAUTH); } catch {}
}

function loadStoredOAuthEmail() {
  try { return String(localStorage.getItem(LS_OAUTH_EMAIL) || "").trim().toLowerCase(); }
  catch { return ""; }
}
function saveStoredOAuthEmail(email) {
  try { localStorage.setItem(LS_OAUTH_EMAIL, (email || "").toString()); } catch {}
}
function clearStoredOAuthEmail() {
  try { localStorage.removeItem(LS_OAUTH_EMAIL); } catch {}
}

function hardResetAuth(reason = "") {
  // ✅ Nuevo comportamiento:
  // - NO revocamos por defecto (evita loops de re-consent)
  // - NO borramos el email hint (sirve para silent)
  // - Solo limpiamos token + storage de token

  try { console.warn("HARD RESET AUTH", reason); } catch {}

  // limpia token (storage + memoria)
  clearStoredOAuth();
  oauthAccessToken = "";
  oauthExpiresAt = 0;

  // UI (NO tocamos el email guardado)
  try {
    setSync("offline", "Necesita Conectar");
    btnRefresh.style.display = "inline-block";
  } catch {}
}

// opcional: si algún día querés revocar “de verdad”
function revokeCurrentToken() {
  try {
    if (window.google?.accounts?.oauth2?.revoke && oauthAccessToken) {
      google.accounts.oauth2.revoke(oauthAccessToken, () => {});
    }
  } catch {}
}

// ================== DEBUG: forzar expiración token ==================
// Uso:
//   debugExpireToken()          => deja el token "vencido" en memoria + localStorage
//   debugExpireAndTest()        => expira + intenta reconectar silencioso + llama list
// Nota: Esto NO revoca en Google. Solo simula vencimiento local (lo que nos interesa para test).
function debugExpireToken() {
  try {
    console.log("[debugExpireToken] Antes:", {
      hasToken: !!oauthAccessToken,
      expiresAt: oauthExpiresAt,
      msLeft: oauthExpiresAt ? (oauthExpiresAt - Date.now()) : null
    });
  } catch {}

  // 1) marcar como expirado en memoria
  oauthExpiresAt = Date.now() - 60_000;

  // 2) marcar como expirado en storage (si existía)
  try {
    const stored = loadStoredOAuth();
    if (stored?.access_token) {
      saveStoredOAuth(stored.access_token, Date.now() - 60_000);
    }
  } catch {}

  // 3) UI para ver el cambio
  try {
    setSync("offline", "Token expirado (debug)");
    btnRefresh.style.display = "inline-block";
  } catch {}

  try {
    console.log("[debugExpireToken] Después:", {
      hasToken: !!oauthAccessToken,
      expiresAt: oauthExpiresAt,
      msLeft: oauthExpiresAt - Date.now()
    });
    console.log("Ahora probá reconexión silenciosa con: reconnectAndRefresh()");
    console.log("O probá todo junto con: debugExpireAndTest()");
  } catch {}
}

async function debugExpireAndTest() {
  debugExpireToken();

  try {
    console.log("[debugExpireAndTest] Intentando reconectar silencioso (sin popup)...");
    const r = await reconnectAndRefresh(); // runConnectFlow({interactive:false,prompt:""})
    console.log("[debugExpireAndTest] Resultado reconnect:", r);

    console.log("[debugExpireAndTest] Probando API list (sin permitir popup)...");
    const resp = await apiCall("list", {}, { allowInteractive: false });
    console.log("[debugExpireAndTest] apiCall(list) =>", resp);

    if (resp?.error === "needs_interactive_scopes") {
      console.warn("[debugExpireAndTest] Falta scope y NO se pudo abrir popup (correcto). Probá tocar Conectar/↻.");
    }

    return resp;
  } catch (e) {
    console.warn("[debugExpireAndTest] Falló:", e);
    return null;
  }
}

async function fetchUserEmailFromToken(accessToken) {
  const r = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!r.ok) throw new Error("No se pudo obtener userinfo");
  const data = await r.json();
  return (data?.email || "").toString().toLowerCase().trim();
}

function initOAuth() {
  if (!window.google?.accounts?.oauth2?.initTokenClient) {
    throw new Error("GIS no está cargado (falta gsi/client en HTML)");
  }

  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: OAUTH_CLIENT_ID,
    scope: OAUTH_SCOPES,
    include_granted_scopes: true,

    // ✅ Igual que Comidas (a vos te anda bien así)
    use_fedcm_for_prompt: true,

    callback: () => {}
  });
}

// prompt: "" (silent), "consent", "select_account"
// prompt: "" (silent), "consent", "select_account"
function requestAccessToken({ prompt, hint } = {}) {
  return new Promise((resolve, reject) => {
    if (!tokenClient) return reject(new Error("OAuth no inicializado"));

    let done = false;

    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      reject(new Error("popup_timeout_or_closed"));
    }, 45_000);

    tokenClient.callback = (resp) => {
      if (done) return;
      done = true;
      clearTimeout(timer);

      if (!resp || resp.error) {
        const err = String(resp?.error || "oauth_error");
        const sub = String(resp?.error_subtype || "");
        const msg = (err + (sub ? `:${sub}` : "")).toLowerCase();

        const e = new Error(err);
        e.isCanceled =
          msg.includes("popup_closed") ||
          msg.includes("popup_closed_by_user") ||
          msg.includes("access_denied") ||
          msg.includes("user_cancel") ||
          msg.includes("interaction_required");

        return reject(e);
      }

      // ✅ VALIDAR SCOPE DEVUELTO POR GIS (pero sin falsos negativos)
      // A veces GIS/FedCM no devuelve resp.scope (viene vacío/undefined) en el primer grant.
      // Si viene vacío, NO bloqueamos: dejamos que Sheets confirme con el 403 real si faltara scope.
      const gotScope = String(resp.scope || "").trim();
      try { console.log("GIS resp.scope =>", gotScope || "(vacío)"); } catch {}

      // Solo si gotScope trae algo, validamos que contenga Sheets.
      if (gotScope && !scopeHas(gotScope, REQUIRED_SHEETS_SCOPE)) {
        const e = new Error("TOKEN_MISSING_SHEETS_SCOPE");
        e.gotScope = gotScope;
        return reject(e);
      }

      const accessToken = resp.access_token;
      const expiresIn = Number(resp.expires_in || 3600);
      const expiresAt = Date.now() + (expiresIn * 1000);

      oauthAccessToken = accessToken;
      oauthExpiresAt = expiresAt;
      saveStoredOAuth(accessToken, expiresAt);

      resolve({ access_token: accessToken, expires_at: expiresAt, scope: gotScope });
    };

    const req = {};
    if (prompt !== undefined) req.prompt = prompt;
    if (hint && String(hint).includes("@")) req.hint = hint;

    try {
      tokenClient.requestAccessToken(req);
    } catch (e) {
      clearTimeout(timer);
      reject(e);
    }
  });
}

// allowInteractive=false => NO popup
async function ensureOAuthToken(allowInteractive = false, interactivePrompt = "consent") {
  // 1) token en memoria
  if (isTokenValid()) return oauthAccessToken;

  // 2) token guardado válido
  const stored = loadStoredOAuth();
  if (stored?.access_token && stored?.expires_at && Date.now() < (stored.expires_at - 10_000)) {
    oauthAccessToken = stored.access_token;
    oauthExpiresAt = Number(stored.expires_at);
    return oauthAccessToken;
  }

  const hintEmail = loadStoredOAuthEmail();

  // Si NO es interactivo y no tengo hint, no llamo GIS
  if (!allowInteractive && !hintEmail) {
    throw new Error("TOKEN_NEEDS_INTERACTIVE");
  }

  // 3) Silent real (prompt:"")
  try {
    await requestAccessToken({ prompt: "", hint: hintEmail || undefined });
    if (isTokenValid()) return oauthAccessToken;
  } catch (e) {
    if (!allowInteractive) throw new Error("TOKEN_NEEDS_INTERACTIVE");
  }

  // 4) Interactivo
  await requestAccessToken({ prompt: interactivePrompt ?? "consent", hint: hintEmail || undefined });

  if (!isTokenValid()) throw new Error("TOKEN_NEEDS_INTERACTIVE");
  return oauthAccessToken;
}

// ================== API POST (rápido, sin preflight) ==================
async function apiPost_(payload) {
  // payload esperado: { mode, access_token, item? }
  const mode = (payload?.mode || "").toString().toLowerCase();
  const token = (payload?.access_token || "").toString();

  if (!token) return { ok: false, error: "auth_required" };

  const sheetEsc = encodeURIComponent(SHEET_NAME);

  // helper para armar un error rico
  const fail = async (errorCode, r) => {
    let txt = "";
    try { txt = await r.text(); } catch {}
    return {
      ok: false,
      error: errorCode,
      status: r?.status ?? 0,
      detail: (txt || "").slice(0, 12000)
    };
  };

  try {
    // ---------- WHOAMI ----------
    if (mode === "whoami") {
      const r = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!r.ok) return await fail("whoami_failed", r);

      const data = await r.json();
      const email = (data?.email || "").toString().toLowerCase().trim();
      return { ok: true, email };
    }

    // ---------- LIST ----------
    if (mode === "list") {
      const url =
        `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(SPREADSHEET_ID)}` +
        `/values/${sheetEsc}!A2:F?majorDimension=ROWS`;

      const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) return await fail("list_failed", r);

      const json = await r.json();
      const values = Array.isArray(json?.values) ? json.values : [];

      const items = values
        .filter(row => (row?.[1] || "").toString().trim() !== "") // titulo
        .map(row => ({
          categoria: (row?.[0] || "").toString(),
          titulo: (row?.[1] || "").toString(),
          comando: (row?.[2] || "").toString(),
          explicacion: (row?.[3] || "").toString(),
          tags: (row?.[4] || "").toString(),
          timestamp: (row?.[5] || "").toString(),
        }));

      items.reverse();
      return { ok: true, items };
    }

    // ---------- ADD ----------
    if (mode === "add") {
      const item = payload?.item || {};
      const clean = {
        categoria: (item?.categoria || "").toString().trim(),
        titulo: (item?.titulo || "").toString().trim(),
        comando: (item?.comando || "").toString().trim(),
        explicacion: (item?.explicacion || "").toString().trim(),
        tags: (item?.tags || "").toString().trim(),
      };

      if (!clean.titulo || !clean.comando) return { ok: false, error: "missing_required" };

      const url =
        `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(SPREADSHEET_ID)}` +
        `/values/${sheetEsc}!A:F:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

      const body = {
        values: [[
          clean.categoria,
          clean.titulo,
          clean.comando,
          clean.explicacion,
          clean.tags,
          new Date().toISOString()
        ]]
      };

      const r = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      if (!r.ok) return await fail("add_failed", r);

      return { ok: true };
    }

    // ---------- PING ----------
    if (mode === "ping") return { ok: true, pong: true };

    return { ok: false, error: "bad_mode" };
  } catch (e) {
    return { ok: false, error: "network_error", detail: String(e?.message || e) };
  }
}

async function apiCall(mode, payload = {}, opts = {}) {
  const allowInteractive = !!opts.allowInteractive;
  const interactivePrompt = opts.interactivePrompt || "consent";

  // 1) Token (silencioso si se puede, interactivo solo si se permite)
  let token = await ensureOAuthToken(allowInteractive, interactivePrompt);

  const body = { mode, access_token: token, ...(payload || {}) };
  let data = await apiPost_(body);

  // Helpers para inspeccionar el error de Sheets (viene JSON en resp.detail)
  const safeJsonParse = (s) => { try { return JSON.parse(s); } catch { return null; } };
  const detailObj = safeJsonParse(data?.detail || "");
  const reason =
    detailObj?.error?.details?.[0]?.reason ||
    detailObj?.error?.status ||
    "";

  const msg = (detailObj?.error?.message || "").toString().toLowerCase();
  const err = (data?.error || "").toString().toLowerCase();
  const detail = (data?.detail || "").toString().toLowerCase();

  const isScopeInsufficient =
    reason === "ACCESS_TOKEN_SCOPE_INSUFFICIENT" ||
    msg.includes("insufficient authentication scopes") ||
    detail.includes("access_token_scope_insufficient") ||
    detail.includes("insufficient authentication scopes");

  // 2) Si es SCOPE_INSUFFICIENT:
  // - limpiamos token (porque es un grant viejo/sin scope)
  // - si NO podemos abrir popup (no hay click), devolvemos error especial
  if (!data?.ok && isScopeInsufficient) {
    // ✅ En vez de matar todo, solo limpiamos token (dejamos hint)
    hardResetAuth("scope_insufficient");

    // 🚫 Sin gesto de usuario: no podemos abrir popup
    if (!allowInteractive) {
      return { ok: false, error: "needs_interactive_scopes", detail: data?.detail || "" };
    }

    // ✅ Con click: pedimos CONSENT directo (no select_account)
    // Esto fuerza a Google a otorgar el scope faltante.
    try {
      const hintEmail = (loadStoredOAuthEmail() || "").trim().toLowerCase();
      await requestAccessToken({ prompt: "consent", hint: hintEmail || undefined });
    } catch (e) {
      // si el usuario canceló, devolvemos algo razonable
      if (e?.isCanceled) return { ok: false, error: "user_canceled_consent" };
      throw e;
    }

    // reintento con token nuevo
    body.access_token = oauthAccessToken;
    data = await apiPost_(body);
    return data || { ok: false, error: "empty_response" };
  }

  // 3) Retry 1 vez si parece tema auth/permisos (solo si podemos abrir popup)
  const looksAuth =
    err.includes("auth") ||
    err.includes("missing_scope") ||
    err.includes("wrong_audience") ||
    detail.includes("invalid") ||
    detail.includes("unauth") ||
    detail.includes("permission") ||
    detail.includes("insufficient") ||
    detail.includes("scope") ||
    detail.includes("accessnotconfigured");

  if (!data?.ok && looksAuth && allowInteractive) {
    token = await ensureOAuthToken(true, interactivePrompt);
    body.access_token = token;
    data = await apiPost_(body);
  }

  return data || { ok: false, error: "empty_response" };
}

async function verifyBackendAccessOrThrow(allowInteractive) {
  const who = await apiCall("whoami", {}, { allowInteractive });
  if (!who?.ok) {
    const msg = (who?.error || "no_access") + (who?.detail ? ` | ${who.detail}` : "");
    throw new Error(msg);
  }

  // ✅ guardo email (hint) para reconexión silenciosa
  const email = (who?.email || "").toString().toLowerCase().trim();
  if (email) saveStoredOAuthEmail(email);

  // ✅ actualizar UI de cuenta
  setAccountUI(email);

  // ✅ pill corto
  if (email) setSync("ok", "Listo ✅");

  return who;
}

// ================== CONNECT FLOW (auto + silent) ==================
async function runConnectFlow({ interactive, prompt } = { interactive: false, prompt: "consent" }) {
  try {
    if (!isOnline()) {
      setSync("offline", "Sin conexión");
      btnRefresh.style.display = "none";
      return { ok: false, offline: true };
    }

    setSync("saving", interactive ? "Conectando…" : "Reconectando…");

    // 1) token
    await ensureOAuthToken(!!interactive, prompt || "consent");

    // 2) whoami (valida + guarda email + setAccountUI)
    await verifyBackendAccessOrThrow(!!interactive);

    // 3) cargar lista
    // ✅ CLAVE: si interactive=true (viene de un click), permitimos popup/consent en la carga
    btnRefresh.style.display = "none";
    await cargarComandos(!!interactive);

    setSync("ok", "Listo ✅");
    return { ok: true };
  } catch (e) {
    // si falla, no estás conectado
    setAccountUI("");

    const msg = String(e?.message || e || "");
    if (msg === "TOKEN_NEEDS_INTERACTIVE") {
      setSync("offline", "Necesita Conectar");
      btnRefresh.style.display = "inline-block";
      return { ok: false, needsInteractive: true };
    }

    if (e?.isCanceled) {
      setSync("offline", "Conexión cancelada");
      btnRefresh.style.display = "inline-block";
      return { ok: false, canceled: true };
    }

    setSync("offline", "Necesita Conectar");
    btnRefresh.style.display = "inline-block";
    return { ok: false, error: msg };
  }
}

async function reconnectAndRefresh() {
  return await runConnectFlow({ interactive: false, prompt: "" });
}

// ================== API ==================
async function cargarComandos(allowInteractive = false) {
  let resp = null;

  try {
    // token silencioso si se puede
    if (!isTokenValid()) {
      try { await ensureOAuthToken(false); } catch {}
    }

    // si no hay token válido, mostrar “necesita conectar”
    if (!isTokenValid()) {
      setSync("offline", "Necesita Conectar");
      btnRefresh.style.display = "inline-block";
      mural.innerHTML = `<p class="error">Necesitás conectar tu cuenta para ver/guardar comandos.</p>`;
      return;
    }

    setSync("saving", "Cargando…");

    // ✅ IMPORTANTE: si allowInteractive=true (viene de un click), apiCall puede abrir popup y pedir CONSENT si faltan scopes
    resp = await apiCall("list", {}, { allowInteractive: !!allowInteractive, interactivePrompt: "consent" });

    // 👇 Si falta scope y NO podemos abrir popup desde acá:
    if (resp?.error === "needs_interactive_scopes") {
      setSync("offline", "Necesita Conectar");
      btnRefresh.style.display = "inline-block";

      mural.innerHTML = `
        <p class="error">Tu sesión no tiene permisos de Google Sheets.</p>
        <p class="error" style="opacity:.85;margin-top:8px">
          Tocá <b>Conectar</b> (o <b>↻</b>) para autorizar permisos y volver a intentar.
        </p>
        <pre class="error-detail" style="white-space:pre-wrap;word-break:break-word;margin-top:10px">${escapeHtml(resp?.detail || "")}</pre>
      `;
      return;
    }

    // ✅ ACÁ: si falla, MOSTRAMOS el detail real del 403
    if (!resp?.ok) {
      const statusTxt = resp?.status ? `HTTP ${resp.status}` : "HTTP ?";
      const detailTxt = (resp?.detail || "").toString().trim();

      console.error("LIST ERROR =>", resp);

      setSync("offline", "No se pudo cargar");
      btnRefresh.style.display = "inline-block";

      mural.innerHTML = `
        <p class="error">No se pudieron cargar los comandos. Conectá o reintentá.</p>

        <p class="error" style="opacity:.85;margin-top:8px">
          Detalle: ${escapeHtml(`${resp?.error || "list_failed"} (${statusTxt})`)}
        </p>

        ${detailTxt ? `
          <pre class="error-detail" style="white-space:pre-wrap;word-break:break-word;margin-top:10px">${escapeHtml(detailTxt)}</pre>
        ` : `
          <p class="error" style="opacity:.85;margin-top:8px">
            (No llegó detail. Mirá igual en Console: “LIST ERROR =>”)
          </p>
        `}

        <p class="error" style="opacity:.85;margin-top:10px">
          Si es <b>HTTP 403</b>, lo más común es:
          <br>• <b>PERMISSION_DENIED</b>: la planilla no está compartida con esa cuenta
          <br>• <b>TIP</b>: compartí la planilla 14Jg… con esa cuenta (Viewer o Editor) o ponela “Cualquier persona con el link” (si te sirve)
          <br>• <b>accessNotConfigured</b>: la Google Sheets API no está habilitada en el proyecto del Client ID
        </p>
      `;
      return;
    }

    comandosCache = Array.isArray(resp?.items) ? resp.items : [];
    render(comandosCache);

    setSync("ok", "Listo ✅");
    btnRefresh.style.display = "none";
  } catch (err) {
    console.error("Error al cargar comandos (catch)", err, resp);

    const msg = String(err?.message || err || "");
    const maybeDetail = (resp?.detail || "").toString().trim();

    setSync("offline", "No se pudo cargar");
    btnRefresh.style.display = "inline-block";

    mural.innerHTML = `
      <p class="error">No se pudieron cargar los comandos. Conectá o reintentá.</p>
      <p class="error" style="opacity:.85;margin-top:8px">Detalle: ${escapeHtml(msg)}</p>
      ${maybeDetail ? `
        <pre class="error-detail" style="white-space:pre-wrap;word-break:break-word;margin-top:10px">${escapeHtml(maybeDetail)}</pre>
      ` : ``}
    `;
  }
}

async function agregarComandoAPI(item) {
  // intento silencioso primero
  if (!isTokenValid()) {
    try { await ensureOAuthToken(false); } catch {}
  }

  // si no se pudo silencioso, permito popup SOLO al guardar (mejor UX)
  const allowInteractive = !isTokenValid();

  const resp = await apiCall("add", { item }, { allowInteractive, interactivePrompt: "consent" });
  if (!resp?.ok) throw new Error(resp?.error || "add_failed");
}

function escapeHtml(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ================== RENDER ==================
function render(lista) {
  mural.innerHTML = ""

  contador.innerText = `${lista.length} comando${lista.length === 1 ? "" : "s"}`

  lista.forEach((it) => {
    const card = document.createElement("article")
    card.className = "card"

    // header card
    const top = document.createElement("div")
    top.className = "card-top"
    card.appendChild(top)

    const left = document.createElement("div")
    left.className = "card-left"
    top.appendChild(left)

    const titulo = document.createElement("h2")
    titulo.innerText = it.titulo || "(sin título)"
    left.appendChild(titulo)

    const meta = document.createElement("div")
    meta.className = "meta"
    left.appendChild(meta)

    if (it.categoria) {
      const chipCat = document.createElement("span")
      chipCat.className = "chip"
      chipCat.innerText = it.categoria
      meta.appendChild(chipCat)
    }

    if (it.tags) {
      const chipTags = document.createElement("span")
      chipTags.className = "chip chip-soft"
      chipTags.innerText = it.tags
      meta.appendChild(chipTags)
    }

    const right = document.createElement("div")
    right.className = "card-right"
    top.appendChild(right)

    const btnCopiar = document.createElement("button")
    btnCopiar.className = "btn-copy"
    btnCopiar.type = "button"
    btnCopiar.innerText = "Copiar"
    right.appendChild(btnCopiar)

    // comando (code)
    const pre = document.createElement("pre")
    pre.className = "code"
    const code = document.createElement("code")
    code.innerText = it.comando || ""
    pre.appendChild(code)
    card.appendChild(pre)

    // explicacion
    if (it.explicacion) {
      const p = document.createElement("p")
      p.className = "exp"
      p.innerText = it.explicacion
      card.appendChild(p)
    }

    // fecha
    if (it.timestamp) {
      const fecha = new Date(it.timestamp)
      const small = document.createElement("div")
      small.className = "fecha"
      small.innerText = isNaN(fecha.getTime())
        ? ""
        : fecha.toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })
      card.appendChild(small)
    }

    // evento copiar
    btnCopiar.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(it.comando || "")
        btnCopiar.innerText = "Copiado ✓"
        setTimeout(() => (btnCopiar.innerText = "Copiar"), 900)
      } catch (e) {
        console.error("No se pudo copiar", e)
        btnCopiar.innerText = "Error"
        setTimeout(() => (btnCopiar.innerText = "Copiar"), 900)
      }
    })

    mural.appendChild(card)
  })
}

function filtrar(texto) {
  const q = (texto || "").toLowerCase().trim()
  if (!q) return comandosCache

  return comandosCache.filter((it) => {
    const blob = [
      it.categoria,
      it.titulo,
      it.comando,
      it.explicacion,
      it.tags
    ].join(" ").toLowerCase()
    return blob.includes(q)
  })
}

// ================== EVENTOS ==================
form.addEventListener("submit", async (e) => {
  e.preventDefault()

  const item = {
    categoria: (inputCat.value || "").trim(),
    titulo: (inputTit.value || "").trim(),
    comando: (textareaCmd.value || "").trim(),
    explicacion: (textareaExp.value || "").trim(),
    tags: (inputTags.value || "").trim(),
  }

  if (!item.titulo || !item.comando) return

  btnAgregar.disabled = true
  btnAgregar.innerText = "Guardando..."

  try {
    await agregarComandoAPI(item)
    inputCat.value = ""
    inputTit.value = ""
    textareaCmd.value = ""
    textareaExp.value = ""
    inputTags.value = ""
    inputTit.focus()
    await cargarComandos()
  } catch (err) {
    console.error("Error al guardar", err)
  } finally {
    btnAgregar.disabled = false
    btnAgregar.innerText = "Guardar comando"
  }
})

btnLimpiar.addEventListener("click", () => {
  inputCat.value = ""
  inputTit.value = ""
  textareaCmd.value = ""
  textareaExp.value = ""
  inputTags.value = ""
  inputTit.focus()
})

inputBuscar.addEventListener("input", (e) => {
  render(filtrar(e.target.value))
})

// ================== UI: Conectar / Refresh ==================
btnConnect.addEventListener("click", () => {
  try {
    setSync("saving", "Abriendo Google…");

    const hintEmail = (loadStoredOAuthEmail() || "").trim().toLowerCase();
    const isSwitch = (btnConnect.dataset.mode === "switch");

    // Si cambia cuenta, ahí sí limpiamos hint/email para no empujar a la anterior
    if (isSwitch) {
      try { clearStoredOAuth(); } catch {}
      try { clearStoredOAuthEmail(); } catch {}
      oauthAccessToken = "";
      oauthExpiresAt = 0;
    }

    // ✅ Reglas:
    // - connect => consent (para garantizar scopes)
    // - switch  => select_account (para elegir cuenta)
    const prompt = isSwitch ? "select_account" : "consent";

    requestAccessToken({
      prompt,
      hint: (!isSwitch && hintEmail) ? hintEmail : undefined
    })
      .then(async () => {
        await verifyBackendAccessOrThrow(true);
        btnRefresh.style.display = "none";
        await cargarComandos(true);
      })
      .catch((e) => {
        if (e?.isCanceled) setSync("offline", "Conexión cancelada");
        else setSync("offline", "Necesita Conectar");

        btnRefresh.style.display = "inline-block";
        console.warn("No se pudo conectar:", e);
      });

  } catch (e) {
    setSync("offline", "Necesita Conectar");
    btnRefresh.style.display = "inline-block";
    console.warn("Error abriendo popup:", e);
  }
});

btnRefresh.addEventListener("click", async () => {
  // ✅ Click del usuario => podemos abrir popup y pedir consent
  await runConnectFlow({ interactive: true, prompt: "consent" });
});

// Online/offline UX
window.addEventListener("online", () => {
  if (syncPill?.querySelector(".sync-text")?.textContent?.includes("Necesita Conectar")) return;
  reconnectAndRefresh();
});
window.addEventListener("offline", () => {
  setSync("offline", "Sin conexión");
});

// auto-refresh silencioso (evita popups)
setInterval(async () => {
  try {
    if (document.visibilityState !== "visible") return;
    if (!oauthAccessToken) return;
    if (connectInFlight) return;

    // si falta poco para expirar, intento silencioso
    if (Date.now() < (oauthExpiresAt - 120_000)) return;
    await ensureOAuthToken(false);

    // si se renovó bien y estábamos “Necesita Conectar”, refrescamos sin popup
    if (isTokenValid() && syncPill.querySelector(".sync-text")?.textContent?.includes("Necesita Conectar")) {
      await reconnectAndRefresh();
    }
  } catch {}
}, 20_000);

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible") return;
  if (connectInFlight) return;
  if (syncPill.querySelector(".sync-text")?.textContent?.includes("Necesita Conectar")) {
    reconnectAndRefresh();
  }
});

// ================== INIT (sin popup) ==================
window.addEventListener("load", async () => {
  // init OAuth
  try {
    initOAuth();

    const stored = loadStoredOAuth();
    if (stored?.access_token && Date.now() < (stored.expires_at - 10_000)) {
      oauthAccessToken = stored.access_token;
      oauthExpiresAt = stored.expires_at;

      // UI email si existe
      setAccountUI(loadStoredOAuthEmail());
    } else {
      setAccountUI(loadStoredOAuthEmail());
    }
  } catch {}

  // arranque: si hay hint/token, intentá reconectar silencioso
  if (isOnline()) {
    const emailHint = loadStoredOAuthEmail();
    const stored = loadStoredOAuth();

    if (emailHint || (stored?.access_token && stored?.expires_at)) {
      await reconnectAndRefresh(); // NO popup
    } else {
      setSync("offline", "Necesita Conectar");
      btnRefresh.style.display = "inline-block";
      // igual render vacío
      comandosCache = [];
      render(comandosCache);
    }
  } else {
    setSync("offline", "Sin conexión");
    btnRefresh.style.display = "none";
  }
});
