import { t as tr } from "./i18n.js";
import { createBackend } from "./store.js";

const api = createBackend();

const EMOJI = [
  "😀","🙂","😉","😍","😘","😢","😂","🙌",
  "👍","👎","👏","🔥","✨","💙","❤️","🤍",
  "🌊","🌙","☀️","☕","🌿","🏠","✉️","📎",
  "✅","⚠️","❓","💡","🎵","📷","🕐","📍",
];

const AVATAR_TONES = ["#3d4f66", "#3a5560", "#4a5060", "#4a5d4a", "#5c4a42", "#524a5c"];

const ICONS = {
  cove: `<svg class="brand-mark" viewBox="0 0 36 36" fill="none" aria-hidden="true"><path d="M8 18c0-5.5 4.5-10 10-10a10 10 0 1 1 0 20" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M14 18c0-2.2 1.8-4 4-4a4 4 0 1 1 0 8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  search: `<svg class="icon icon-sm search-ic" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="6.5" stroke="currentColor" stroke-width="1.6"/><path d="M16 16l4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  plus: `<svg class="icon" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  back: `<svg class="icon icon-back" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  more: `<svg class="icon" viewBox="0 0 24 24" fill="none"><circle cx="6" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="18" cy="12" r="1.4" fill="currentColor"/></svg>`,
  send: `<svg class="icon" viewBox="0 0 24 24" fill="none"><path d="M5 12h12M13 6l6 6-6 6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  attach: `<svg class="icon" viewBox="0 0 24 24" fill="none"><path d="M8 12.5l7.2-7.2a3.2 3.2 0 1 1 4.5 4.5L10.4 19.1a4.5 4.5 0 0 1-6.4-6.4L14 2.7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  emoji: `<svg class="icon" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.25" stroke="currentColor" stroke-width="1.6"/><path d="M8.5 10h.01M15.5 10h.01M8.8 14.2c.9 1.2 2 1.8 3.2 1.8s2.3-.6 3.2-1.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  close: `<svg class="icon" viewBox="0 0 24 24" fill="none"><path d="M7 7l10 10M17 7L7 17" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  settings: `<svg class="icon" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.6"/><path d="M12 4.5v1.6M12 17.9v1.6M4.5 12h1.6M17.9 12h1.6M6.4 6.4l1.1 1.1M16.5 16.5l1.1 1.1M17.6 6.4l-1.1 1.1M7.5 16.5l-1.1 1.1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  camera: `<svg class="icon icon-sm" viewBox="0 0 24 24" fill="none"><path d="M8 8l1.4-2h5.2L16 8h2.5A1.5 1.5 0 0 1 20 9.5v8A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5v-8A1.5 1.5 0 0 1 5.5 8H8z" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="13" r="3" stroke="currentColor" stroke-width="1.6"/></svg>`,
  file: `<svg class="icon icon-sm" viewBox="0 0 24 24" fill="none"><path d="M8 4h6l4 4v12H8V4z" stroke="currentColor" stroke-width="1.6"/><path d="M14 4v4h4" stroke="currentColor" stroke-width="1.6"/></svg>`,
  emptyCove: `<svg class="empty-art" viewBox="0 0 88 88" fill="none"><path d="M18 44c0-14.4 11.6-26 26-26a26 26 0 1 1 0 52" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M32 44c0-6.6 5.4-12 12-12a12 12 0 1 1 0 24" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
};

const state = {
  user: null,
  authMode: "login",
  authError: "",
  authLoading: false,
  authDraft: { name: "", username: "", email: "", password: "" },
  fieldErrors: {},
  conversations: [],
  messages: [],
  people: [],
  activeId: null,
  overlay: null, // settings | profile | new | user
  profileUser: null,
  query: "",
  peopleQuery: "",
  composer: "",
  pending: null,
  emojiOpen: false,
  menuOpen: false,
  lightbox: null,
  toast: "",
  settings: api.getSettings(),
  stickBottom: true,
  needsSetup: !api.isConfigured(),
  bootLoading: true,
  listLoading: false,
  messagesLoading: false,
  peopleLoading: false,
  sending: false,
  uploading: false,
  hasMoreMessages: false,
  setupError: "",
  setupSaving: false,
  setupDraft: { url: "", anonKey: "" },
};

let root;
let toastTimer = null;
let media = null;

function lang() {
  return state.settings.language === "ar" ? "ar" : "en";
}

function t(key, vars) {
  return tr(lang(), key, vars);
}

function esc(s) {
  const map = {
    "&": "&" + "amp;",
    "<": "&" + "lt;",
    ">": "&" + "gt;",
    '"': "&" + "quot;",
    "'": "&#39;",
  };
  return String(s ?? "").replace(/[&<>"']/g, (ch) => map[ch]);
}

function initials(name) {
  const p = String(name || "?").trim().split(/\s+/).slice(0, 2);
  return p.map((x) => x[0]?.toUpperCase() || "").join("") || "?";
}

function tone(id) {
  let n = 0;
  for (const c of String(id || "")) n = (n + c.charCodeAt(0)) % AVATAR_TONES.length;
  return AVATAR_TONES[n];
}

function avatarHtml(person, size = "") {
  if (!person) return "";
  const cls = `avatar ${size}`.trim();
  const inner = person.avatarUrl
    ? `<img src="${esc(person.avatarUrl)}" alt="">`
    : esc(initials(person.displayName));
  const online = api.isOnline(person)
    ? `<span class="presence" title="${esc(t("online"))}"></span>`
    : "";
  return `<span class="${cls}" style="background:${tone(person.id)}">${inner}${online}</span>`;
}

function locale() {
  return lang() === "ar" ? "ar" : "en";
}

function formatClock(ts) {
  return new Intl.DateTimeFormat(locale(), { hour: "numeric", minute: "2-digit" }).format(new Date(ts));
}

function formatListTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const diff = Date.now() - ts;
  if (diff < 60_000) return t("justNow");
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (d >= start) return formatClock(ts);
  const y = new Date(start);
  y.setDate(y.getDate() - 1);
  if (d >= y) return t("yesterday");
  if (diff < 6 * 86400000) {
    return new Intl.DateTimeFormat(locale(), { weekday: "short" }).format(d);
  }
  return new Intl.DateTimeFormat(locale(), { month: "short", day: "numeric" }).format(d);
}

function formatDay(ts) {
  const d = new Date(ts);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (d >= start) return t("today");
  const y = new Date(start);
  y.setDate(y.getDate() - 1);
  if (d >= y) return t("yesterday");
  return new Intl.DateTimeFormat(locale(), { month: "long", day: "numeric" }).format(d);
}

function lastSeenLabel(person) {
  if (!person) return t("offline");
  if (api.isOnline(person)) return t("activeNow");
  if (person.showLastSeen === false) return t("lastSeenHidden");
  if (!person.lastSeen) return t("offline");
  const diff = Date.now() - person.lastSeen;
  if (diff < 60_000) return t("lastSeenAt", { t: t("justNow").toLowerCase() });
  if (diff < 3600_000) return t("lastSeenAt", { t: t("minutesAgo", { n: Math.max(1, Math.floor(diff / 60000)) }) });
  if (diff < 86400_000) return t("lastSeenAt", { t: t("hoursAgo", { n: Math.floor(diff / 3600000) }) });
  return t("lastSeenAt", { t: t("daysAgo", { n: Math.floor(diff / 86400000) }) });
}

function previewText(last) {
  if (!last) return t("noPreview");
  if (last.attachmentType?.startsWith("image/")) {
    return last.content ? last.content : t("photoMessage");
  }
  if (last.attachmentUrl) return last.content || t("fileMessage");
  return last.content || t("noPreview");
}

function applyTheme() {
  const s = state.settings;
  const sysDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = s.theme === "dark" || (s.theme === "system" && sysDark) || (s.theme !== "light" && s.theme !== "dark" && sysDark);
  const theme = s.theme === "light" ? "light" : s.theme === "dark" ? "dark" : dark ? "dark" : "light";
  document.documentElement.dataset.theme = theme;
  document.documentElement.lang = lang() === "ar" ? "ar" : "en";
  document.documentElement.dir = lang() === "ar" ? "rtl" : "ltr";
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "light" ? "#f3f1ec" : "#0b1018");
}

function mapError(code) {
  const table = {
    INVALID_EMAIL: "invalidEmail",
    PASSWORD_SHORT: "passwordShort",
    NAME_SHORT: "nameShort",
    USERNAME_INVALID: "usernameInvalid",
    USERNAME_TAKEN: "usernameTaken",
    EMAIL_TAKEN: "emailTaken",
    WRONG_CREDENTIALS: "wrongCredentials",
    UNAUTHENTICATED: "sessionExpired",
    STORAGE_FULL: "storageFull",
    FILE_TOO_LARGE: "fileTooLarge",
    UPLOAD_FAILED: "uploadFailed",
    EMPTY: "emptyMessage",
    CONFIG_MISSING: "configMissing",
    NETWORK_ERROR: "networkError",
    EMAIL_CONFIRM: "emailConfirm",
    FORBIDDEN: "forbidden",
    NOT_FOUND: "notFound",
    REALTIME_ERROR: "realtimeError",
  };
  return t(table[code] || "errorGeneric");
}

function toast(msg) {
  state.toast = msg;
  render();
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    state.toast = "";
    const el = root.querySelector(".toast");
    if (el) el.remove();
  }, 2200);
}

function playSound() {
  if (!state.settings.sound) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 784;
    g.gain.value = 0.04;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
    o.stop(ctx.currentTime + 0.14);
  } catch {
    /* ignore */
  }
}

function notify(title, body) {
  if (!state.settings.notifications) return;
  if (document.visibilityState === "visible" && state.activeId) return;
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, silent: !state.settings.sound });
  } catch {
    /* ignore */
  }
}

function activeConv() {
  return state.conversations.find((c) => c.id === state.activeId) || null;
}

function filteredConversations() {
  const q = state.query.trim().toLowerCase();
  if (!q) return state.conversations;
  return state.conversations.filter((c) => {
    const name = c.other?.displayName || "";
    const user = c.other?.username || "";
    const last = previewText(c.last);
    return (
      name.toLowerCase().includes(q) ||
      user.toLowerCase().includes(q) ||
      last.toLowerCase().includes(q)
    );
  });
}

function renderAuth() {
  const signup = state.authMode === "signup";
  const fe = state.fieldErrors;
  return `
    <div class="auth">
      <form class="auth-card" data-form="${signup ? "signup" : "login"}">
        <div class="brand">
          ${ICONS.cove}
          <div>
            <h1>${esc(t("appName"))}</h1>
            <p>${esc(t("tagline"))}</p>
          </div>
        </div>
        <div class="seg" role="tablist">
          <button type="button" role="tab" aria-selected="${!signup}" data-act="auth-mode" data-mode="login">${esc(t("signIn"))}</button>
          <button type="button" role="tab" aria-selected="${signup}" data-act="auth-mode" data-mode="signup">${esc(t("createAccount"))}</button>
        </div>
        ${state.authError ? `<div class="banner" role="alert">${esc(state.authError)}</div>` : ""}
        ${signup ? `
          <div class="field">
            <label for="name">${esc(t("name"))}</label>
            <input id="name" name="name" autocomplete="name" required minlength="2" placeholder="${esc(t("namePh"))}" value="${esc(state.authDraft.name || "")}">
            ${fe.name ? `<div class="err">${esc(fe.name)}</div>` : ""}
          </div>
          <div class="field">
            <label for="username">${esc(t("username"))}</label>
            <input id="username" name="username" autocomplete="username" required placeholder="${esc(t("usernamePh"))}" spellcheck="false" value="${esc(state.authDraft.username || "")}">
            ${fe.username ? `<div class="err">${esc(fe.username)}</div>` : ""}
          </div>
        ` : ""}
        <div class="field">
          <label for="email">${esc(t("email"))}</label>
          <input id="email" name="email" type="email" autocomplete="username" required placeholder="${esc(t("emailPh"))}" value="${esc(state.authDraft.email || "")}">
          ${fe.email ? `<div class="err">${esc(fe.email)}</div>` : ""}
        </div>
        <div class="field">
          <label for="password">${esc(t("password"))}</label>
          <input id="password" name="password" type="password" autocomplete="${signup ? "new-password" : "current-password"}" required minlength="8" placeholder="${esc(t("passwordPh"))}" value="${esc(state.authDraft.password || "")}">
          ${fe.password ? `<div class="err">${esc(fe.password)}</div>` : ""}
        </div>
        <button class="btn btn-primary" type="submit" ${state.authLoading ? "disabled" : ""}>
          ${state.authLoading ? `<span class="spin"></span>${esc(t("working"))}` : esc(signup ? t("submitCreate") : t("submitSignIn"))}
        </button>
        <p class="auth-foot">
          ${esc(signup ? t("haveAccount") : t("noAccount"))}
          <button type="button" data-act="auth-mode" data-mode="${signup ? "login" : "signup"}">${esc(signup ? t("signIn") : t("createAccount"))}</button>
        </p>
        <p class="auth-foot">
          <button type="button" data-act="open-setup">${esc(t("changeBackend"))}</button>
        </p>
      </form>
    </div>
  `;
}

function renderSetup() {
  return `
    <div class="auth">
      <form class="auth-card" data-form="setup">
        <div class="brand">
          ${ICONS.cove}
          <div>
            <h1>${esc(t("setupTitle"))}</h1>
            <p>${esc(t("tagline"))}</p>
          </div>
        </div>
        <p class="setup-copy">${esc(t("setupHint"))}</p>
        ${state.setupError ? `<div class="banner" role="alert">${esc(state.setupError)}</div>` : ""}
        <div class="field">
          <label for="supabaseUrl">${esc(t("setupUrl"))}</label>
          <input id="supabaseUrl" name="url" required spellcheck="false" placeholder="https://xxxx.supabase.co" value="${esc(state.setupDraft.url || "")}">
        </div>
        <div class="field">
          <label for="supabaseKey">${esc(t("setupKey"))}</label>
          <textarea id="supabaseKey" name="anonKey" required spellcheck="false" placeholder="eyJ...">${esc(state.setupDraft.anonKey || "")}</textarea>
        </div>
        <p class="hint">${esc(t("setupWhere"))}</p>
        <p class="hint">${esc(t("setupNeverService"))}</p>
        <button class="btn btn-primary" type="submit" ${state.setupSaving ? "disabled" : ""}>
          ${state.setupSaving ? `<span class="spin"></span>${esc(t("working"))}` : esc(t("setupSave"))}
        </button>
      </form>
    </div>
  `;
}

function renderBoot() {
  return `
    <div class="auth">
      <div class="auth-card boot-card">
        <div class="brand">
          ${ICONS.cove}
          <div>
            <h1>${esc(t("appName"))}</h1>
            <p>${esc(t("connecting"))}</p>
          </div>
        </div>
        <div class="loading-block">
          <span class="spin lg"></span>
        </div>
      </div>
    </div>
  `;
}

function renderList() {
  const rows = filteredConversations();
  let body;
  if (state.listLoading && !state.conversations.length) {
    body = `
      <div class="loading-block">
        <span class="spin lg"></span>
        <p>${esc(t("loadingConversations"))}</p>
      </div>`;
  } else if (!state.conversations.length) {
    body = `
      <div class="empty">
        ${ICONS.emptyCove}
        <h3>${esc(t("noConversations"))}</h3>
        <p>${esc(t("noConversationsHint"))}</p>
        <button class="btn btn-primary" type="button" data-act="open-new">${esc(t("newConversation"))}</button>
      </div>`;
  } else if (!rows.length) {
    body = `
      <div class="empty">
        <h3>${esc(t("noUsers"))}</h3>
        <p>${esc(t("noUsersHint"))}</p>
      </div>`;
  } else {
    body = rows
      .map((c) => {
        const unread = c.unread > 0;
        return `
          <button class="conv ${c.id === state.activeId ? "is-active" : ""} ${unread ? "unread" : ""}" type="button" data-act="open-chat" data-id="${esc(c.id)}">
            ${avatarHtml(c.other)}
            <div class="conv-text">
              <div class="conv-top"><span class="conv-name">${esc(c.other?.displayName || "")}</span></div>
              <div class="conv-preview">${esc(previewText(c.last))}</div>
            </div>
            <div class="conv-meta">
              <span>${esc(formatListTime(c.last?.createdAt || c.updatedAt))}</span>
              ${unread ? `<span class="unread-count">${c.unread > 99 ? "99+" : c.unread}</span>` : ""}
            </div>
          </button>`;
      })
      .join("");
  }

  return `
    <aside class="pane-list">
      <div class="list-head">
        <h2>${esc(t("chats"))}</h2>
        <button class="icon-btn" type="button" data-act="open-new" aria-label="${esc(t("newConversation"))}">${ICONS.plus}</button>
      </div>
      <div class="search-wrap">
        <div class="search-field">
          ${ICONS.search}
          <input type="search" name="query" value="${esc(state.query)}" placeholder="${esc(t("searchChats"))}" autocomplete="off">
        </div>
      </div>
      <div class="conv-list">${body}</div>
      <div class="list-foot">
        <button class="me-btn" type="button" data-act="open-profile">
          ${avatarHtml(state.user, "sm")}
          <span class="grow">
            <div class="me-name">${esc(state.user.displayName)}</div>
            <div class="me-user">@${esc(state.user.username)}</div>
          </span>
        </button>
        <button class="icon-btn" type="button" data-act="open-settings" aria-label="${esc(t("settings"))}">${ICONS.settings}</button>
      </div>
    </aside>
  `;
}

function statusLabel(m) {
  if (!m.mine) return "";
  if (m.status === "failed") return `<button type="button" class="msg-failed" data-act="retry" data-id="${esc(m.id)}">${esc(t("retry"))}</button>`;
  if (m.status === "sending") return esc(t("sending"));
  if (m.status === "read") return `<span class="status-checks read">✓✓</span>`;
  if (m.status === "delivered") return `<span class="status-checks">✓✓</span>`;
  return `<span class="status-checks">✓</span>`;
}

function linkify(text) {
  const safe = esc(text);
  return safe.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>').replace(/\n/g, "<br>");
}

function renderMessages() {
  if (state.messagesLoading && !state.messages.length) {
    return `
      <div class="loading-block">
        <span class="spin lg"></span>
        <p>${esc(t("loadingMessages"))}</p>
      </div>`;
  }
  if (!state.messages.length) {
    return `
      <div class="empty">
        ${ICONS.emptyCove}
        <h3>${esc(t("noMessages"))}</h3>
        <p>${esc(t("noMessagesHint"))}</p>
      </div>`;
  }
  let lastDay = "";
  let lastSender = "";
  const parts = [];
  if (state.hasMoreMessages) {
    parts.push(`
      <div class="load-older">
        <button type="button" data-act="load-older" ${state.messagesLoading ? "disabled" : ""}>
          ${state.messagesLoading ? `<span class="spin"></span>` : ""}${esc(t("loadOlder"))}
        </button>
      </div>`);
  }
  state.messages.forEach((m, i) => {
    const day = formatDay(m.createdAt);
    if (day !== lastDay) {
      parts.push(`<div class="day-chip">${esc(day)}</div>`);
      lastDay = day;
      lastSender = "";
    }
    const next = state.messages[i + 1];
    const groupStart = lastSender !== m.senderId;
    const groupEnd = !next || next.senderId !== m.senderId || formatDay(next.createdAt) !== day;
    lastSender = m.senderId;
    const mine = m.mine ? "mine" : "theirs";
    let media = "";
    if (m.attachmentUrl && m.attachmentType?.startsWith("image/")) {
      media = `<img class="msg-img" src="${esc(m.attachmentUrl)}" alt="${esc(t("image"))}" data-act="lightbox" data-src="${esc(m.attachmentUrl)}">`;
    } else if (m.attachmentUrl) {
      media = `<a class="file-chip" href="${esc(m.attachmentUrl)}" download="${esc(m.attachmentName || "file")}">${ICONS.file}${esc(m.attachmentName || t("file"))}</a>`;
    }
    parts.push(`
      <div class="bubble-row ${mine} ${groupStart ? "group-start" : ""} ${groupEnd ? "group-end" : ""}">
        <div class="bubble">
          ${media}
          ${m.content ? `<div>${linkify(m.content)}</div>` : ""}
          <div class="msg-meta">
            <span>${esc(formatClock(m.createdAt))}</span>
            ${statusLabel(m)}
          </div>
        </div>
      </div>`);
  });
  return parts.join("");
}

function renderChat() {
  const conv = activeConv();
  if (!conv) {
    return `
      <section class="pane-chat">
        <div class="desktop-empty">
          <div class="empty">
            ${ICONS.emptyCove}
            <h3>${esc(t("appName"))}</h3>
            <p>${esc(t("noConversationsHint"))}</p>
          </div>
        </div>
      </section>`;
  }
  const other = conv.other;
  const on = api.isOnline(other);
  return `
    <section class="pane-chat">
      <div class="chat-head">
        <button class="icon-btn icon-back" type="button" data-act="close-chat" aria-label="${esc(t("back"))}">${ICONS.back}</button>
        <button class="peer" type="button" data-act="view-user" data-id="${esc(other.id)}">
          ${avatarHtml(other, "sm")}
          <span class="grow">
            <div class="peer-name">${esc(other.displayName)}</div>
            <div class="peer-status ${on ? "is-on" : ""}">${esc(on ? t("online") : lastSeenLabel(other))}</div>
          </span>
        </button>
        <button class="icon-btn" type="button" data-act="toggle-menu" aria-label="${esc(t("more"))}">${ICONS.more}</button>
      </div>
      ${state.menuOpen ? `
        <div class="menu" role="menu">
          <button type="button" data-act="view-user" data-id="${esc(other.id)}">${esc(t("viewProfile"))}</button>
        </div>` : ""}
      <div class="chat-stage">
        <div class="msg-scroll">${renderMessages()}</div>
        <div class="composer-wrap">
          ${state.emojiOpen ? `<div class="emoji-pop">${EMOJI.map((e) => `<button type="button" data-act="emoji" data-e="${e}">${e}</button>`).join("")}</div>` : ""}
          <form class="composer" data-form="send">
            ${state.uploading && !state.pending ? `
              <div class="pending">
                <span class="spin"></span>
                <span class="grow">${esc(t("sendingFile"))}</span>
              </div>` : ""}
            ${state.pending ? `
              <div class="pending">
                ${state.pending.type?.startsWith("image/") ? `<img src="${esc(state.pending.url)}" alt="">` : ICONS.file}
                <span class="grow">${esc(state.pending.name || t("file"))}</span>
                <button class="icon-btn" type="button" data-act="clear-attach" aria-label="${esc(t("removeAttachment"))}">${ICONS.close}</button>
              </div>` : ""}
            <div class="composer-row">
              <button class="icon-btn" type="button" data-act="attach" aria-label="${esc(t("attach"))}">${ICONS.attach}</button>
              <button class="icon-btn" type="button" data-act="toggle-emoji" aria-label="${esc(t("emoji"))}">${ICONS.emoji}</button>
              <textarea class="composer-input" name="message" rows="1" placeholder="${esc(t("typeMessage"))}" aria-label="${esc(t("typeMessage"))}">${esc(state.composer)}</textarea>
              <button class="send-btn ${state.composer.trim() || state.pending ? "is-on" : ""}" type="submit" aria-label="${esc(t("send"))}" ${state.sending || state.uploading ? "disabled" : ""}>${state.sending || state.uploading ? `<span class="spin"></span>` : ICONS.send}</button>
            </div>
            <input class="sr" id="file-input" type="file" accept="image/*,.pdf,.txt,.zip">
          </form>
        </div>
      </div>
    </section>`;
}

function renderSheet(title, body, extraHead = "") {
  return `
    <div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="sheet-panel">
        <div class="sheet-head">
          <h2>${esc(title)}</h2>
          ${extraHead}
          <button class="icon-btn" type="button" data-act="close-overlay" aria-label="${esc(t("close"))}">${ICONS.close}</button>
        </div>
        <div class="sheet-body">${body}</div>
      </div>
    </div>`;
}

function renderNew() {
  const q = state.peopleQuery.trim();
  const people = state.people;
  let list;
  if (state.peopleLoading && !people.length) {
    list = `
      <div class="loading-block">
        <span class="spin lg"></span>
        <p>${esc(t("loadingPeople"))}</p>
      </div>`;
  } else if (!people.length) {
    list = `
      <div class="empty">
        <h3>${esc(q ? t("noUsers") : t("emptyPeople"))}</h3>
        <p>${esc(q ? t("noUsersHint") : t("emptyPeopleHint"))}</p>
      </div>`;
  } else {
    list = `<div class="people">${people
      .map(
        (p) => `
        <button class="person" type="button" data-act="start-chat" data-id="${esc(p.id)}">
          ${avatarHtml(p)}
          <span class="grow">
            <div class="me-name">${esc(p.displayName)}</div>
            <div class="me-user">@${esc(p.username)}</div>
          </span>
          <span class="peer-status ${api.isOnline(p) ? "is-on" : ""}">${esc(api.isOnline(p) ? t("online") : t("offline"))}</span>
        </button>`,
      )
      .join("")}</div>`;
  }
  return renderSheet(
    t("newConversation"),
    `
      <div class="search-wrap" style="padding:0 0 12px">
        <div class="search-field">
          ${ICONS.search}
          <input type="search" name="peopleQuery" value="${esc(state.peopleQuery)}" placeholder="${esc(t("searchPeople"))}" autocomplete="off">
        </div>
      </div>
      ${list}
    `,
  );
}

function renderSettings() {
  const s = state.settings;
  const u = state.user;
  const tog = (on) => `toggle ${on ? "on" : ""}`;
  return renderSheet(
    t("settings"),
    `
      <section class="section">
        <h3>${esc(t("account"))}</h3>
        <p class="hint">${esc(t("accountHint"))}</p>
        <div class="card-list">
          <button class="row" type="button" data-act="open-profile">
            ${avatarHtml(u, "sm")}
            <span class="grow">
              <div>${esc(u.displayName)}</div>
              <div class="sub">@${esc(u.username)}</div>
            </span>
          </button>
          <button class="row" type="button" data-act="switch-account">
            <span class="grow">${esc(t("switchAccount"))}</span>
          </button>
          <button class="row stack" type="button" data-act="logout">
            <span class="grow">${esc(t("logout"))}</span>
            <span class="sub">${esc(t("signOutHint"))}</span>
          </button>
        </div>
      </section>
      <section class="section">
        <h3>${esc(t("appearance"))}</h3>
        <p class="hint">${esc(t("appearanceHint"))}</p>
        <div class="seg slim">
          <button type="button" aria-selected="${s.theme === "dark"}" data-act="theme" data-v="dark">${esc(t("darkMode"))}</button>
          <button type="button" aria-selected="${s.theme === "light"}" data-act="theme" data-v="light">${esc(t("lightMode"))}</button>
          <button type="button" aria-selected="${s.theme === "system"}" data-act="theme" data-v="system">${esc(t("systemPref"))}</button>
        </div>
      </section>
      <section class="section">
        <h3>${esc(t("notifications"))}</h3>
        <p class="hint">${esc(t("notificationsHint"))}</p>
        <div class="card-list">
          <button class="row" type="button" data-act="toggle-pref" data-k="notifications">
            <span class="grow">${esc(t("messageNotifications"))}</span>
            <span class="${tog(s.notifications)}"></span>
          </button>
          <button class="row" type="button" data-act="toggle-pref" data-k="sound">
            <span class="grow">${esc(t("sound"))}</span>
            <span class="${tog(s.sound)}"></span>
          </button>
        </div>
      </section>
      <section class="section">
        <h3>${esc(t("privacy"))}</h3>
        <p class="hint">${esc(t("privacyHint"))}</p>
        <div class="card-list">
          <button class="row" type="button" data-act="toggle-privacy" data-k="showOnline">
            <span class="grow">${esc(t("showOnline"))}</span>
            <span class="${tog(u.showOnline !== false)}"></span>
          </button>
          <button class="row" type="button" data-act="toggle-privacy" data-k="showLastSeen">
            <span class="grow">${esc(t("showLastSeen"))}</span>
            <span class="${tog(u.showLastSeen !== false)}"></span>
          </button>
        </div>
      </section>
      <section class="section">
        <h3>${esc(t("language"))}</h3>
        <p class="hint">${esc(t("languageHint"))}</p>
        <div class="seg slim">
          <button type="button" aria-selected="${lang() === "en"}" data-act="lang" data-v="en">${esc(t("english"))}</button>
          <button type="button" aria-selected="${lang() === "ar"}" data-act="lang" data-v="ar">${esc(t("arabic"))}</button>
        </div>
      </section>
      <p class="hint" style="text-align:center">${esc(t("version"))}</p>
    `,
  );
}

function renderProfile() {
  const u = state.user;
  return renderSheet(
    t("editProfile"),
    `
      <form data-form="profile">
        <div class="profile-hero">
          <div class="avatar-edit">
            ${avatarHtml(u, "lg")}
            <button class="change" type="button" data-act="pick-avatar" aria-label="${esc(t("changeAvatar"))}">${ICONS.camera}</button>
            <input class="sr" id="avatar-input" type="file" accept="image/*">
          </div>
        </div>
        <div class="field">
          <label for="displayName">${esc(t("displayName"))}</label>
          <input id="displayName" name="displayName" value="${esc(u.displayName)}" required>
        </div>
        <div class="field">
          <label for="editUsername">${esc(t("username"))}</label>
          <input id="editUsername" name="username" value="${esc(u.username)}" required>
        </div>
        <div class="field">
          <label for="bio">${esc(t("bio"))}</label>
          <textarea id="bio" name="bio" maxlength="140" placeholder="${esc(t("bioPh"))}">${esc(u.bio || "")}</textarea>
        </div>
        <button class="btn btn-primary" type="submit">${esc(t("save"))}</button>
      </form>
    `,
  );
}

function renderUser() {
  const p = state.profileUser;
  if (!p) return "";
  const on = api.isOnline(p);
  return renderSheet(
    t("profile"),
    `
      <div class="profile-hero">
        ${avatarHtml(p, "lg")}
        <h3>${esc(p.displayName)}</h3>
        <div class="uname">@${esc(p.username)}</div>
        <div class="peer-status ${on ? "is-on" : ""}">${esc(on ? t("online") : lastSeenLabel(p))}</div>
        ${p.bio ? `<p class="bio">${esc(p.bio)}</p>` : ""}
        <button class="btn btn-primary" type="button" data-act="start-chat" data-id="${esc(p.id)}" style="width:auto;padding:0 22px">${esc(t("messageUser"))}</button>
      </div>
    `,
  );
}

function renderOverlays() {
  if (state.overlay === "new") return renderNew();
  if (state.overlay === "settings") return renderSettings();
  if (state.overlay === "profile") return renderProfile();
  if (state.overlay === "user") return renderUser();
  return "";
}

function render() {
  if (!root) return;
  applyTheme();
  const scrollEl = root.querySelector(".msg-scroll");
  const prevScroll = scrollEl ? scrollEl.scrollTop : 0;
  const prevHeight = scrollEl ? scrollEl.scrollHeight : 0;
  const composerEl = root.querySelector(".composer-input");
  const caret = composerEl ? composerEl.selectionStart : null;
  const active = document.activeElement;
  const activeName = active?.getAttribute?.("name") || active?.id || "";

  if (state.bootLoading) {
    root.innerHTML = renderBoot();
  } else if (state.needsSetup) {
    root.innerHTML = renderSetup();
  } else if (!state.user) {
    root.innerHTML = renderAuth();
  } else {
    const open = !!state.activeId;
    root.innerHTML = `
      <div class="shell ${open ? "is-chat-open" : ""}">
        ${renderList()}
        ${renderChat()}
      </div>
      ${renderOverlays()}
      ${state.lightbox ? `<div class="lightbox" data-act="close-lightbox"><img src="${esc(state.lightbox)}" alt=""></div>` : ""}
      ${state.toast ? `<div class="toast" role="status">${esc(state.toast)}</div>` : ""}
    `;
  }

  const nextScroll = root.querySelector(".msg-scroll");
  if (nextScroll) {
    if (state.stickBottom) nextScroll.scrollTop = nextScroll.scrollHeight;
    else nextScroll.scrollTop = prevScroll + (nextScroll.scrollHeight - prevHeight);
  }
  const nextComposer = root.querySelector(".composer-input");
  if (nextComposer) autosize(nextComposer);

  if (activeName) {
    const el = root.querySelector(`[name="${activeName}"], #${activeName}`);
    if (el && typeof el.focus === "function") {
      el.focus();
      if (caret != null && el.setSelectionRange) {
        try {
          el.setSelectionRange(caret, caret);
        } catch {
          /* ignore */
        }
      }
    }
  }
}

function autosize(el) {
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 160) + "px";
}

async function refreshConversations() {
  if (!state.user) return;
  const first = !state.conversations.length;
  if (first) state.listLoading = true;
  try {
    state.conversations = await api.listConversations();
  } catch (err) {
    console.error(err);
    toast(mapError(err.message));
  } finally {
    state.listLoading = false;
  }
}

async function refreshMessages({ silent = false } = {}) {
  if (!state.activeId) {
    state.messages = [];
    state.hasMoreMessages = false;
    return;
  }
  if (!silent && !state.messages.length) state.messagesLoading = true;
  try {
    const rows = await api.listMessages(state.activeId);
    state.hasMoreMessages = rows.length >= 80;
    state.messages = rows;
    await api.markRead(state.activeId);
    await refreshConversations();
  } catch (err) {
    console.error(err);
    toast(mapError(err.message));
  } finally {
    state.messagesLoading = false;
  }
}

async function loadOlderMessages() {
  if (!state.activeId || !state.messages.length || state.messagesLoading) return;
  state.messagesLoading = true;
  render();
  try {
    const oldest = state.messages[0];
    const older = await api.listMessages(state.activeId, { before: oldest.createdAt });
    state.hasMoreMessages = older.length >= 80;
    const seen = new Set(state.messages.map((m) => m.id));
    state.messages = [...older.filter((m) => !seen.has(m.id)), ...state.messages];
    state.stickBottom = false;
  } catch (err) {
    toast(mapError(err.message));
  } finally {
    state.messagesLoading = false;
    render();
  }
}

async function refreshPeople() {
  if (!state.people.length) state.peopleLoading = true;
  try {
    state.people = await api.searchUsers(state.peopleQuery);
  } catch (err) {
    console.error(err);
    state.people = [];
    toast(mapError(err.message));
  } finally {
    state.peopleLoading = false;
  }
}

async function openChat(id) {
  const switched = state.activeId !== id;
  state.activeId = id;
  state.menuOpen = false;
  state.emojiOpen = false;
  state.overlay = null;
  state.stickBottom = true;
  if (switched) {
    state.messages = [];
    state.hasMoreMessages = false;
  }
  await refreshMessages();
  render();
  root.querySelector(".composer-input")?.focus();
}

async function startChatWith(userId) {
  try {
    const conv = await api.getOrCreateConversation(userId);
    state.overlay = null;
    await refreshConversations();
    await openChat(conv.id);
  } catch (err) {
    toast(mapError(err.message));
  }
}

async function send() {
  const text = state.composer.trim();
  const attachment = state.pending;
  if (!text && !attachment) return;
  if (!state.activeId) return;
  if (state.sending) return;
  const snapshot = state.composer;
  state.composer = "";
  state.pending = null;
  state.emojiOpen = false;
  state.sending = true;
  render();
  try {
    await api.sendMessage({
      conversationId: state.activeId,
      content: snapshot,
      attachment,
    });
    state.stickBottom = true;
    await refreshMessages({ silent: true });
    state.sending = false;
    render();
    root.querySelector(".composer-input")?.focus();
  } catch (err) {
    state.composer = snapshot;
    state.pending = attachment;
    state.sending = false;
    toast(mapError(err.message) === t("errorGeneric") ? t("failedSend") : mapError(err.message));
    render();
  }
}

function validateAuth(form) {
  const errors = {};
  const signup = state.authMode === "signup";
  const email = form.email.value.trim();
  const password = form.password.value;
  if (!email) errors.email = t("required");
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = t("invalidEmail");
  if (!password) errors.password = t("required");
  else if (password.length < 8) errors.password = t("passwordShort");
  if (signup) {
    const name = form.name.value.trim();
    const username = form.username.value.trim();
    if (name.length < 2) errors.name = t("nameShort");
    if (!/^[a-zA-Z][a-zA-Z0-9_]{2,23}$/.test(username)) errors.username = t("usernameInvalid");
  }
  state.fieldErrors = errors;
  return Object.keys(errors).length === 0;
}

async function onSubmit(e) {
  const form = e.target.closest("form");
  if (!form) return;
  e.preventDefault();
  const kind = form.dataset.form;
  if (kind === "setup") {
    state.setupError = "";
    state.setupDraft = {
      url: form.url.value,
      anonKey: form.anonKey.value,
    };
    state.setupSaving = true;
    render();
    try {
      api.saveConnection({
        url: form.url.value,
        anonKey: form.anonKey.value,
      });
      window.location.reload();
    } catch (err) {
      state.setupError = mapError(err.message);
      state.setupSaving = false;
      render();
    }
    return;
  }
  if (kind === "login" || kind === "signup") {
    state.authError = "";
    state.authDraft = {
      name: form.name?.value || "",
      username: form.username?.value || "",
      email: form.email.value,
      password: form.password.value,
    };
    if (!validateAuth(form)) {
      render();
      return;
    }
    state.authLoading = true;
    render();
    try {
      if (kind === "signup") {
        state.user = await api.signUp({
          name: form.name.value,
          username: form.username.value,
          email: form.email.value,
          password: form.password.value,
        });
      } else {
        state.user = await api.login({
          email: form.email.value,
          password: form.password.value,
        });
      }
      await afterLogin();
      state.authDraft = { name: "", username: "", email: "", password: "" };
    } catch (err) {
      state.authError = mapError(err.message);
      if (kind === "login" && err.message === "WRONG_CREDENTIALS") {
        state.authError = t("failedLogin");
      }
      if (kind === "signup" && !["USERNAME_TAKEN", "EMAIL_TAKEN", "USERNAME_INVALID", "NAME_SHORT", "PASSWORD_SHORT", "INVALID_EMAIL", "EMAIL_CONFIRM", "NETWORK_ERROR", "CONFIG_MISSING"].includes(err.message)) {
        state.authError = t("failedSignup");
      }
      if (err.message === "CONFIG_MISSING") {
        state.needsSetup = true;
      }
      state.authLoading = false;
      render();
    }
    return;
  }
  if (kind === "send") {
    await send();
    return;
  }
  if (kind === "profile") {
    try {
      state.user = await api.updateProfile({
        displayName: form.displayName.value,
        username: form.username.value,
        bio: form.bio.value,
      });
      toast(t("saved"));
      state.overlay = "settings";
      await refreshConversations();
      render();
    } catch (err) {
      toast(mapError(err.message));
    }
  }
}

async function afterLogin() {
  state.authLoading = false;
  state.authError = "";
  state.fieldErrors = {};
  state.needsSetup = false;
  api.startPresence();
  await refreshConversations();
  render();
}

async function onClick(e) {
  const lightbox = e.target.closest(".lightbox");
  if (lightbox && e.target === lightbox) {
    state.lightbox = null;
    render();
    return;
  }
  const img = e.target.closest("[data-act=lightbox]");
  if (img) {
    state.lightbox = img.dataset.src;
    render();
    return;
  }
  const btn = e.target.closest("[data-act]");
  if (!btn) {
    if (state.menuOpen || state.emojiOpen) {
      if (!e.target.closest(".menu") && !e.target.closest(".emoji-pop")) {
        state.menuOpen = false;
        state.emojiOpen = false;
        render();
      }
    }
    return;
  }
  const act = btn.dataset.act;
  if (act === "open-setup") {
    state.needsSetup = true;
    state.user = null;
    state.setupError = "";
    render();
    return;
  }
  if (act === "load-older") {
    await loadOlderMessages();
    return;
  }
  if (act === "auth-mode") {
    state.authMode = btn.dataset.mode;
    state.authError = "";
    state.fieldErrors = {};
    render();
    return;
  }
  if (act === "open-chat") {
    await openChat(btn.dataset.id);
    return;
  }
  if (act === "close-chat") {
    state.activeId = null;
    state.menuOpen = false;
    state.emojiOpen = false;
    render();
    return;
  }
  if (act === "open-new") {
    state.overlay = "new";
    state.peopleQuery = "";
    state.people = [];
    render();
    await refreshPeople();
    render();
    root.querySelector("[name=peopleQuery]")?.focus();
    return;
  }
  if (act === "open-settings") {
    state.overlay = "settings";
    render();
    return;
  }
  if (act === "open-profile") {
    state.overlay = "profile";
    render();
    return;
  }
  if (act === "close-overlay") {
    state.overlay = null;
    render();
    return;
  }
  if (act === "start-chat") {
    await startChatWith(btn.dataset.id);
    return;
  }
  if (act === "view-user") {
    state.menuOpen = false;
    state.profileUser = await api.getProfile(btn.dataset.id);
    state.overlay = "user";
    render();
    return;
  }
  if (act === "toggle-menu") {
    state.menuOpen = !state.menuOpen;
    render();
    return;
  }
  if (act === "toggle-emoji") {
    state.emojiOpen = !state.emojiOpen;
    render();
    return;
  }
  if (act === "emoji") {
    state.composer += btn.dataset.e;
    state.emojiOpen = false;
    render();
    root.querySelector(".composer-input")?.focus();
    return;
  }
  if (act === "attach") {
    root.querySelector("#file-input")?.click();
    return;
  }
  if (act === "clear-attach") {
    state.pending = null;
    render();
    return;
  }
  if (act === "theme") {
    state.settings = api.saveSettings({ theme: btn.dataset.v });
    render();
    return;
  }
  if (act === "lang") {
    state.settings = api.saveSettings({ language: btn.dataset.v });
    render();
    return;
  }
  if (act === "toggle-pref") {
    const k = btn.dataset.k;
    const next = !state.settings[k];
    if (k === "notifications" && next && typeof Notification !== "undefined") {
      if (Notification.permission === "default") {
        const perm = await Notification.requestPermission();
        if (perm !== "granted") {
          toast(t("notifyDenied"));
          state.settings = api.saveSettings({ notifications: false });
          render();
          return;
        }
      } else if (Notification.permission !== "granted") {
        toast(t("notifyDenied"));
        return;
      }
    }
    state.settings = api.saveSettings({ [k]: next });
    render();
    return;
  }
  if (act === "toggle-privacy") {
    const k = btn.dataset.k;
    const next = !(state.user[k] !== false);
    state.user = await api.updateProfile({ [k]: next });
    render();
    return;
  }
  if (act === "logout") {
    await api.logout();
    state.user = null;
    state.conversations = [];
    state.messages = [];
    state.activeId = null;
    state.overlay = null;
    render();
    return;
  }
  if (act === "switch-account") {
    await api.switchAccount();
    state.user = null;
    state.activeId = null;
    state.overlay = null;
    state.authMode = "login";
    render();
    return;
  }
  if (act === "pick-avatar") {
    root.querySelector("#avatar-input")?.click();
    return;
  }
  if (act === "close-lightbox") {
    state.lightbox = null;
    render();
    return;
  }
}

async function onInput(e) {
  const el = e.target;
  if (["name", "username", "email", "password"].includes(el.name) && !state.user) {
    state.authDraft[el.name] = el.value;
    return;
  }
  if (el.name === "query") {
    state.query = el.value;
    const list = root.querySelector(".conv-list");
    if (list) {
      const tmp = document.createElement("div");
      // re-render list body only via full render for simplicity
      render();
      const q = root.querySelector("[name=query]");
      if (q) {
        q.focus();
        try {
          q.setSelectionRange(el.value.length, el.value.length);
        } catch {
          /* ignore */
        }
      }
    }
    return;
  }
  if (el.name === "peopleQuery") {
    state.peopleQuery = el.value;
    await refreshPeople();
    render();
    const q = root.querySelector("[name=peopleQuery]");
    if (q) {
      q.focus();
      try {
        q.setSelectionRange(el.value.length, el.value.length);
      } catch {
        /* ignore */
      }
    }
    return;
  }
  if (el.name === "message") {
    state.composer = el.value;
    autosize(el);
    const sendBtn = root.querySelector(".send-btn");
    if (sendBtn) sendBtn.classList.toggle("is-on", !!(state.composer.trim() || state.pending));
  }
}

async function onKeyDown(e) {
  if (e.key === "Escape") {
    if (state.lightbox) {
      state.lightbox = null;
      render();
      return;
    }
    if (state.emojiOpen || state.menuOpen) {
      state.emojiOpen = false;
      state.menuOpen = false;
      render();
      return;
    }
    if (state.overlay) {
      state.overlay = null;
      render();
      return;
    }
  }
  if (e.target.name === "message" && e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    await send();
  }
}

async function onChange(e) {
  if (e.target.id === "file-input" && e.target.files?.[0]) {
    try {
      state.uploading = true;
      render();
      state.pending = await api.readFile(e.target.files[0]);
    } catch (err) {
      toast(mapError(err.message));
    } finally {
      state.uploading = false;
      render();
    }
    e.target.value = "";
  }
  if (e.target.id === "avatar-input" && e.target.files?.[0]) {
    try {
      state.uploading = true;
      render();
      const file = e.target.files[0];
      const att = await api.compressImage(file, 512, 0.82);
      state.user = await api.updateProfile({ avatarUrl: att.url, avatarBlob: att.blob });
      toast(t("saved"));
    } catch (err) {
      toast(mapError(err.message));
    } finally {
      state.uploading = false;
      render();
    }
    e.target.value = "";
  }
}

function onPaste(e) {
  const items = e.clipboardData?.items;
  if (!items || !state.activeId) return;
  for (const item of items) {
    if (item.type.startsWith("image/")) {
      const file = item.getAsFile();
      if (file) {
        e.preventDefault();
        api.readFile(file).then((att) => {
          state.pending = att;
          render();
        }).catch((err) => toast(mapError(err.message)));
      }
      break;
    }
  }
}

async function boot() {
  applyTheme();
  if (!media) {
    media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", () => {
      if (state.settings.theme === "system") render();
    });
  }
  if (!api.isConfigured()) {
    state.needsSetup = true;
    state.bootLoading = false;
    render();
    return;
  }
  try {
    state.user = await api.getSession();
  } catch (err) {
    console.error(err);
    state.authError = mapError(err.message);
  }
  state.bootLoading = false;
  if (state.user) {
    api.startPresence();
    state.listLoading = true;
    render();
    await refreshConversations();
  }
  api.subscribe(async (type, payload) => {
    if (type === "realtime-error") {
      toast(t("realtimeError"));
      return;
    }
    if (!state.user) return;
    if (type === "session" && payload == null) return;
    const prevUnread = state.conversations.reduce((n, c) => n + c.unread, 0);
    await refreshConversations();
    if (state.activeId) await refreshMessages({ silent: true });
    if (state.overlay === "new") await refreshPeople();
    if (state.overlay === "user" && state.profileUser) {
      try {
        state.profileUser = await api.getProfile(state.profileUser.id);
      } catch (err) {
        console.error(err);
      }
    }
    const nextUnread = state.conversations.reduce((n, c) => n + c.unread, 0);
    if (type === "message" && payload?.message?.senderId !== state.user.id) {
      playSound();
      const conv = state.conversations.find((c) => c.id === payload.conversationId);
      notify(conv?.other?.displayName || t("appName"), previewText(payload.message));
    } else if (nextUnread > prevUnread) {
      playSound();
    }
    render();
  });
  render();
}

export function start() {
  root = document.getElementById("cove-root");
  if (!root || root.dataset.ready === "1") return;
  root.dataset.ready = "1";
  root.addEventListener("click", (e) => onClick(e));
  root.addEventListener("submit", (e) => onSubmit(e));
  root.addEventListener("input", (e) => onInput(e));
  root.addEventListener("keydown", (e) => onKeyDown(e));
  root.addEventListener("change", (e) => onChange(e));
  root.addEventListener("paste", (e) => onPaste(e));
  root.addEventListener("scroll", (e) => {
    if (!e.target.classList?.contains("msg-scroll")) return;
    const el = e.target;
    state.stickBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }, true);
  boot();
}

start();
