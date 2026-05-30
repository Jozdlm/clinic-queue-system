/* app.js — Queue · Sala de Espera */

/* ─── CONFIG ─── */
const Config = (() => {
  const BASE = "https://hospital-university-production.up.railway.app".replace(
    /\/$/,
    "",
  );
  const BASE_WS = BASE.replace(/^https/, "wss").replace(/^http/, "ws");
  return {
    HTTP_STATE: `${BASE}/api/waiting-room/state`,
    WS_URL: `${BASE_WS}/api/waiting-room`,
    RECONNECT_MS: 3000,
    TOAST_MS: 4500,
  };
})();

/* ─── STATE ─── */
const State = (() => {
  let clinics = new Map();

  function setAll(arr) {
    clinics.clear();
    arr.forEach((c) => {
      clinics.set(c.clinic_id, {
        clinic_id: c.clinic_id,
        clinic_name: c.clinic_name,
        current_ticket: c.current_ticket || c.current_clinic || "",
        next_ticket: c.next_ticket || "",
        waiting_count: c.waiting_count ?? 0,
      });
    });
  }

  function update(patch) {
    const normalized = {
      clinic_id: patch.clinic_id,
      clinic_name: patch.clinic_name,
      current_ticket: patch.current_ticket || patch.current_clinic || "",
      next_ticket: patch.next_ticket || "",
      waiting_count: patch.waiting_count ?? 0,
    };
    const existing = clinics.get(normalized.clinic_id);
    clinics.set(
      normalized.clinic_id,
      existing ? { ...existing, ...normalized } : normalized,
    );
    return clinics.get(normalized.clinic_id);
  }

  function getAll() {
    return Array.from(clinics.values());
  }
  function get(id) {
    return clinics.get(id);
  }

  return { setAll, update, getAll, get };
})();

/* ─── UI ─── */
const UI = (() => {
  const grid = document.getElementById("clinics-grid");

  const THEMES = [
    { icon: "🩺", iconBg: "#e0f7f4", accent: "#2bbfaa" },
    { icon: "👁️", iconBg: "#e3f0fd", accent: "#4a90d9" },
    { icon: "⚡", iconBg: "#f0e9fb", accent: "#9b6dd6" },
    { icon: "❤️", iconBg: "#fdeaea", accent: "#e86060" },
    { icon: "🦷", iconBg: "#fff3e3", accent: "#f09a3e" },
  ];

  function esc(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function cardHTML(clinic, index) {
    const t = THEMES[index % THEMES.length];
    const hasTicket = clinic.current_ticket.trim() !== "";
    const hasNext = clinic.next_ticket.trim() !== "";
    const codeText = hasTicket
      ? esc(clinic.current_ticket)
      : "Sin turno activo";
    const nextText = hasNext ? esc(clinic.next_ticket) : "—";

    return `<article
      class="clinic-card${hasTicket ? " is-active" : ""}"
      id="card-${clinic.clinic_id}"
      data-id="${clinic.clinic_id}"
      style="animation-delay:${index * 90}ms; --card-accent:${t.accent};">
      <header class="card__header">
        <div class="card__icon" style="background:${t.iconBg};">${t.icon}</div>
        <span class="card__name">${esc(clinic.clinic_name)}</span>
      </header>
      <div class="card__body">
        <div class="card__current">
          <p class="card__section-label">Turno Actual</p>
          <span class="card__ticket-code${hasTicket ? "" : " empty"}"
            style="${hasTicket ? `color:${t.accent}` : ""}">${codeText}</span>
        </div>
        <div class="card__next-box">
          <span class="card__section-label" style="margin-bottom:0;">Siguiente</span>
          <span class="card__next-code${hasNext ? "" : " empty"}">${nextText}</span>
        </div>
        <div class="card__waiting">
          <p class="card__section-label">En espera</p>
          <span class="card__waiting-count" style="color:${t.accent};">${clinic.waiting_count}</span>
        </div>
      </div>
    </article>`;
  }

  function renderAll() {
    grid.innerHTML = State.getAll()
      .map((c, i) => cardHTML(c, i))
      .join("");
  }

  function updateCard(clinic) {
    const card = document.getElementById(`card-${clinic.clinic_id}`);
    if (!card) return;

    const hasTicket = clinic.current_ticket.trim() !== "";
    const hasNext = clinic.next_ticket.trim() !== "";
    const accent =
      getComputedStyle(card).getPropertyValue("--card-accent").trim() ||
      "#2bbfaa";

    card.classList.toggle("is-active", hasTicket);

    const codeEl = card.querySelector(".card__ticket-code");
    const newCode = hasTicket ? clinic.current_ticket : "Sin turno activo";
    if (codeEl && codeEl.textContent.trim() !== newCode.trim()) {
      codeEl.textContent = newCode;
      codeEl.className = "card__ticket-code" + (hasTicket ? "" : " empty");
      codeEl.style.color = hasTicket ? accent : "";
      codeEl.classList.remove("flash");
      void codeEl.offsetWidth;
      codeEl.classList.add("flash");
      setTimeout(() => codeEl.classList.remove("flash"), 500);
    }

    const nextEl = card.querySelector(".card__next-code");
    if (nextEl) {
      nextEl.textContent = hasNext ? clinic.next_ticket : "—";
      nextEl.className = "card__next-code" + (hasNext ? "" : " empty");
    }

    const waitEl = card.querySelector(".card__waiting-count");
    if (waitEl) waitEl.textContent = clinic.waiting_count;
  }

  function showSkeleton(n = 5) {
    grid.innerHTML = Array.from(
      { length: n },
      (_, i) => `
      <article class="clinic-card is-loading" style="animation-delay:${i * 80}ms;">
        <header class="card__header">
          <div class="card__icon" style="background:#eef1f6;">⋯</div>
          <span class="card__name">Cargando…</span>
        </header>
        <div class="card__body"></div>
      </article>`,
    ).join("");
  }

  return { renderAll, updateCard, showSkeleton };
})();

/* ─── CLOCK ─── */
const Clock = (() => {
  const el = document.getElementById("clock");
  const pad = (n) => String(n).padStart(2, "0");
  function tick() {
    const d = new Date();
    el.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }
  function start() {
    tick();
    setInterval(tick, 1000);
  }
  return { start };
})();

/* ─── TOAST ─── */
const Toast = (() => {
  const toast = document.getElementById("call-toast");
  const codeEl = document.getElementById("toast-code");
  const clinicEl = document.getElementById("toast-clinic");
  let timer = null;

  function show(code, name) {
    codeEl.textContent = code || "—";
    clinicEl.textContent = name || "—";
    toast.classList.add("show");
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => toast.classList.remove("show"), Config.TOAST_MS);
  }

  return { show };
})();

/* ─── WEBSOCKET ─── */
const WSClient = (() => {
  const dot = document.getElementById("ws-dot");
  const label = document.getElementById("ws-label");
  let ws = null;
  let retryTimer = null;
  let destroyed = false;

  function status(s) {
    dot.className =
      "header__dot" +
      (s === "connected" ? " connected" : s === "error" ? " error" : "");
    label.textContent =
      s === "connected"
        ? "En vivo"
        : s === "error"
          ? "Sin conexión"
          : "Conectando…";
  }

  function connect() {
    if (destroyed) return;
    status("connecting");
    ws = new WebSocket(Config.WS_URL);

    ws.onopen = () => {
      status("connected");
      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
    };

    ws.onmessage = (e) => {
      let data;
      try {
        data = JSON.parse(e.data);
      } catch {
        return;
      }
      const updated = State.update(data);
      UI.updateCard(updated);
      if (updated.current_ticket)
        Toast.show(updated.current_ticket, updated.clinic_name);
    };

    ws.onerror = () => status("error");

    ws.onclose = () => {
      status("error");
      if (!destroyed) retryTimer = setTimeout(connect, Config.RECONNECT_MS);
    };
  }

  function disconnect() {
    destroyed = true;
    if (retryTimer) clearTimeout(retryTimer);
    if (ws) ws.close();
  }

  return { connect, disconnect };
})();

/* ─── HTTP ─── */
const HTTPClient = (() => {
  async function loadInitialState() {
    const res = await fetch(Config.HTTP_STATE);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.data.clinics;
  }
  return { loadInitialState };
})();

/* ─── INIT ─── */
(async function init() {
  Clock.start();
  UI.showSkeleton(5);

  try {
    const clinics = await HTTPClient.loadInitialState();
    State.setAll(clinics);
    UI.renderAll();
  } catch (err) {
    console.error("[Init] Error en carga inicial:", err);
    State.setAll(
      Array.from({ length: 5 }, (_, i) => ({
        clinic_id: i + 1,
        clinic_name: `Clínica ${i + 1}`,
        current_ticket: "",
        next_ticket: "",
        waiting_count: 0,
      })),
    );
    UI.renderAll();
  }

  WSClient.connect();
  window.addEventListener("beforeunload", () => WSClient.disconnect());
})();
