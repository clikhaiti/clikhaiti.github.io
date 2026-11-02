/* ============================================================
   storage.js — couche de stockage local centralisée + utilitaires
   Toutes les données vivent dans localStorage (aucun backend).
   ============================================================ */

"use strict";

const DB = {
  users: "atbf.users",
  session: "atbf.session",
  theme: "atbf.theme",
  matches: "atbf.matches",
  favorites: "atbf.favorites",
  likes: "atbf.likes",
  passes: "atbf.passes",
  blocks: "atbf.blocks",
  reports: "atbf.reports",
  hidden: "atbf.hidden",
  conversations: "atbf.conversations",
  notifications: "atbf.notifications",
  seeded: "atbf.seeded.v1",
};

const store = {
  read(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (err) {
      console.warn("Lecture localStorage impossible pour", key, err);
      return fallback;
    }
  },
  write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.error("Écriture localStorage impossible pour", key, err);
      toast("Stockage local plein ou indisponible.", "error");
      return false;
    }
  },
  remove(key) { try { localStorage.removeItem(key); } catch (_) { /* noop */ } },
};

/* ---------- Utilitaires ---------- */

const esc = (value) => String(value ?? "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

function timeNow() { return new Date().toISOString(); }

function fmtTime(iso) {
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  return sameDay
    ? d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function ageFrom(birthIso) {
  const b = new Date(birthIso);
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}

/* ---------- Toasts ---------- */

function toast(message, type = "info", ms = 2800) {
  const root = $("#toast-root");
  if (!root) return;
  const iconName = type === "success" ? "check" : type === "error" ? "alert" : "info";
  const node = document.createElement("div");
  node.className = `toast ${type}`;
  node.innerHTML = `${icon(iconName)}<span>${esc(message)}</span>`;
  root.appendChild(node);
  setTimeout(() => {
    node.classList.add("leaving");
    setTimeout(() => node.remove(), 220);
  }, ms);
}

/* ---------- Sheets / modales ---------- */

function openSheet(html, { center = false } = {}) {
  const root = $("#sheet-root");
  root.innerHTML = `
    <div class="sheet-root ${center ? "modal-center" : ""}" role="dialog" aria-modal="true">
      <div class="sheet-backdrop" data-sheet-close></div>
      <div class="sheet">
        <div class="sheet-grip"></div>
        ${html}
      </div>
    </div>`;
  root.querySelectorAll("[data-sheet-close]").forEach((el) =>
    el.addEventListener("click", closeSheet));
  return root.firstElementChild;
}

function closeSheet() { $("#sheet-root").innerHTML = ""; }

function confirmSheet({ title, text, confirm = "Confirmer", cancel = "Annuler", danger = false }) {
  return new Promise((resolve) => {
    const sheet = openSheet(`
      <h3>${esc(title)}</h3>
      <p class="sheet-text">${esc(text)}</p>
      <div class="sheet-actions">
        <button class="btn btn-ghost" data-act="cancel">${esc(cancel)}</button>
        <button class="btn ${danger ? "btn-danger" : "btn-gold"}" data-act="ok">${esc(confirm)}</button>
      </div>`, { center: true });
    sheet.querySelector('[data-act="cancel"]').addEventListener("click", () => { closeSheet(); resolve(false); });
    sheet.querySelector('[data-act="ok"]').addEventListener("click", () => { closeSheet(); resolve(true); });
    sheet.querySelector(".sheet-backdrop").addEventListener("click", () => resolve(false));
  });
}

/* ---------- Icônes SVG inline ---------- */

const ICONS = {
  heart: '<path d="M12 20.5S4.5 15.6 4.5 10.3C4.5 7.4 6.8 5.5 9.2 5.5c1.5 0 2.4.7 2.8 1.4.4-.7 1.3-1.4 2.8-1.4 2.4 0 4.7 1.9 4.7 4.8 0 5.3-7.5 10.2-7.5 10.2Z"/>',
  home: '<path d="M4 11 12 4l8 7"/><path d="M6 10v9h12v-9"/>',
  compass: '<circle cx="12" cy="12" r="8.5"/><path d="m15.5 8.5-2 5-5 2 2-5Z"/>',
  chat: '<path d="M21 12a8 8 0 0 1-8 8H5l-2 2V12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8Z"/>',
  user: '<circle cx="12" cy="8" r="3.6"/><path d="M5 20c.8-3.4 3.6-5 7-5s6.2 1.6 7 5"/>',
  users: '<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19c.7-2.9 2.9-4.4 5.5-4.4s4.8 1.5 5.5 4.4"/><path d="M15.5 5.7a3 3 0 1 1 .6 5.8M17 14.8c1.9.5 3 1.8 3.5 4.2"/>',
  star: '<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9Z"/>',
  bell: '<path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/><path d="M10 19a2.2 2.2 0 0 0 4 0"/>',
  crown: '<path d="M3 8.5 7 12l5-6.5L17 12l4-3.5L19 18H5Z"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1"/>',
  robot: '<rect x="5" y="8" width="14" height="10" rx="3"/><path d="M12 8V4.5"/><circle cx="12" cy="3.5" r="1"/><circle cx="9.3" cy="12.5" r="1.1"/><circle cx="14.7" cy="12.5" r="1.1"/><path d="M9.5 15.5h5"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.3-4.3"/>',
  sliders: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  "chevron-left": '<path d="M14.5 5.5 8 12l6.5 6.5"/>',
  "chevron-right": '<path d="m9.5 5.5 6.5 6.5-6.5 6.5"/>',
  eye: '<path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.6"/>',
  "eye-off": '<path d="M4 4l16 16"/><path d="M10.6 6c.5-.1.9-.2 1.4-.2 6 0 9.5 6.2 9.5 6.2a17 17 0 0 1-2.7 3.4M6.6 6.9A16.5 16.5 0 0 0 2.5 12S6 18.2 12 18.2c1.4 0 2.7-.4 3.8-1"/>',
  camera: '<path d="M4 8h3l1.5-2.5h7L17 8h3a1.5 1.5 0 0 1 1.5 1.5V18a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 18V9.5A1.5 1.5 0 0 1 4 8Z"/><circle cx="12" cy="13" r="3.4"/>',
  "map-pin": '<path d="M12 21s-6.5-5.6-6.5-10.3A6.5 6.5 0 0 1 12 4.2a6.5 6.5 0 0 1 6.5 6.5C18.5 15.4 12 21 12 21Z"/><circle cx="12" cy="10.7" r="2.2"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c-5.5 5-5.5 12 0 17M12 3.5c5.5 5 5.5 12 0 17"/>',
  flag: '<path d="M5 21V4"/><path d="M5 4.5h12.5l-2.5 3.5 2.5 3.5H5"/>',
  ban: '<circle cx="12" cy="12" r="8.5"/><path d="M6 6l12 12"/>',
  trash: '<path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13"/>',
  send: '<path d="M21 3 10.5 13.5M21 3l-6.8 18-3.7-7.5L3 9.8Z"/>',
  smile: '<circle cx="12" cy="12" r="8.5"/><path d="M8.5 14s1.2 1.8 3.5 1.8 3.5-1.8 3.5-1.8"/><circle cx="9.3" cy="9.8" r=".4"/><circle cx="14.7" cy="9.8" r=".4"/>',
  translate: '<path d="M4 6h8M8 4v2c0 3.5-2.5 6.5-5 8"/><path d="M5.5 9.5c1.5 2 3.7 3.6 6.5 4.2"/><path d="m12.5 20 4-9 4 9M14 17.5h5"/>',
  logout: '<path d="M14 4H6.5A1.5 1.5 0 0 0 5 5.5v13A1.5 1.5 0 0 0 6.5 20H14"/><path d="M17 8l4 4-4 4M21 12H10"/>',
  shield: '<path d="M12 3 5 5.8v5.4c0 4.5 3 7.7 7 9.8 4-2.1 7-5.3 7-9.8V5.8Z"/><path d="m9 12 2.2 2.2L15.5 9.8"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5 5l1.4 1.4M17.6 17.6 19 19M19 5l-1.4 1.4M6.4 17.6 5 19"/>',
  edit: '<path d="M4 20h4l11-11a2.3 2.3 0 0 0-3.3-3.3L4.7 16.7Z"/><path d="m13.5 7.5 3 3"/>',
  phone: '<path d="M6.5 3.5h3l1.5 4.5-2.2 1.7a13 13 0 0 0 5.5 5.5l1.7-2.2 4.5 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2Z"/>',
  mail: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/>',
  lock: '<rect x="5" y="10.5" width="14" height="9.5" rx="2"/><path d="M8 10.5V8a4 4 0 1 1 8 0v2.5"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5"/><circle cx="12" cy="8" r=".5"/>',
  alert: '<path d="M12 3.5 22 20H2Z"/><path d="M12 10v4"/><circle cx="12" cy="17" r=".5"/>',
  chart: '<path d="M4 4v16h16"/><path d="M8 16v-5M12 16V8M16 16v-3"/>',
  refresh: '<path d="M20 12a8 8 0 1 1-2.3-5.6M20 3.5V8h-4.5"/>',
  sparkles: '<path d="m12 4 1.4 3.6L17 9l-3.6 1.4L12 14l-1.4-3.6L7 9l3.6-1.4Z"/><path d="m18.5 14 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8Z"/>',
  "arrow-left": '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  message: '<path d="M21 12a8 8 0 0 1-8 8H4l2.3-2.9A8 8 0 1 1 21 12Z"/>',
  gift: '<rect x="4" y="9" width="16" height="11" rx="1.5"/><path d="M12 9v11M4 13h16M12 9S9 9 7.8 7.8a2 2 0 1 1 2.8-2.8C12 6.5 12 9 12 9Zm0 0s3 0 4.2-1.2a2 2 0 1 0-2.8-2.8C12 6.5 12 9 12 9Z"/>',
  copy: '<rect x="9" y="9" width="11.5" height="11.5" rx="2"/><path d="M5.5 15h-1A1.5 1.5 0 0 1 3 13.5v-9A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5v1"/>',
};

function icon(name, cls = "ico") {
  const body = ICONS[name] || ICONS.info;
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

function hydrateIcons(root = document) {
  $$("[data-icon]", root).forEach((el) => {
    el.innerHTML = icon(el.dataset.icon);
    el.removeAttribute("data-icon");
  });
}

/* ============================================================
   Profils de démonstration (seed)
   ============================================================ */

const DEMO_PROFILES = [
  {
    id: "marie", name: "Marie", age: 28, gender: "Femme", city: "Port-au-Prince",
    languages: ["Français", "Créole haïtien"], distanceKm: 12,
    bio: "Optimiste et rayonnante, j'aime les discussions profondes autour d'un bon café et les couchers de soleil en bord de mer.",
    interests: ["Voyage", "Musique", "Sport", "Lecture", "Amour"],
    goals: ["Famille", "Stabilité"],
    temperament: { melancolique: 15, sanguin: 45, colerique: 15, flegmatique: 25 },
    photo: "assets/images/profiles/marie.png", verified: true, online: true, likedMe: true,
  },
  {
    id: "david", name: "David", age: 32, gender: "Homme", city: "Port-au-Prince",
    languages: ["Français", "Créole haïtien"], distanceKm: 15,
    bio: "Calme et posé, je valorise la sincérité avant tout. Entrepreneur le jour, musicien le soir.",
    interests: ["Musique", "Sport", "Cuisine", "Voyage"],
    goals: ["Famille", "Carrière"],
    temperament: { melancolique: 20, sanguin: 20, colerique: 10, flegmatique: 50 },
    photo: "assets/images/profiles/david.png", verified: true, online: true, likedMe: true,
  },
  {
    id: "jenny", name: "Jenny", age: 26, gender: "Femme", city: "Cap-Haïtien",
    languages: ["Créole haïtien", "Français"], distanceKm: 130,
    bio: "Énergique et spontanée, je vis au rythme de la musique kompa. J'adore rire et faire rire.",
    interests: ["Danse", "Musique", "Sorties", "Cuisine"],
    goals: ["Découverte", "Carrière"],
    temperament: { melancolique: 10, sanguin: 55, colerique: 20, flegmatique: 15 },
    photo: "assets/images/profiles/jenny.png", verified: false, online: false, likedMe: true,
  },
  {
    id: "alex", name: "Alexandre", age: 30, gender: "Homme", city: "Montréal",
    languages: ["Français", "Anglais"], distanceKm: 2850,
    bio: "Déterminé et ambitieux, je cherche une relation construite sur le respect et les projets communs.",
    interests: ["Sport", "Technologie", "Lecture", "Voyage"],
    goals: ["Carrière", "Famille"],
    temperament: { melancolique: 15, sanguin: 20, colerique: 45, flegmatique: 20 },
    photo: "assets/images/profiles/alex.png", verified: true, online: false, likedMe: false,
  },
  {
    id: "sophia", name: "Sophia", age: 29, gender: "Femme", city: "Paris",
    languages: ["Français", "Espagnol"], distanceKm: 7350,
    bio: "Rêveuse et attentive, j'écris beaucoup. Je crois aux rencontres qui changent une vie.",
    interests: ["Lecture", "Art", "Cinéma", "Voyage"],
    goals: ["Famille", "Création"],
    temperament: { melancolique: 55, sanguin: 15, colerique: 10, flegmatique: 20 },
    photo: "assets/images/profiles/sophia.png", verified: true, online: true, likedMe: true,
  },
  {
    id: "james", name: "James", age: 42, gender: "Homme", city: "Miami",
    languages: ["Anglais", "Créole haïtien"], distanceKm: 1120,
    bio: "Père de deux merveilles, équilibré et patient. La famille d'abord, le reste ensuite.",
    interests: ["Famille", "Sport", "Musique", "Nature"],
    goals: ["Famille", "Sérénité"],
    temperament: { melancolique: 15, sanguin: 15, colerique: 15, flegmatique: 55 },
    photo: "assets/images/profiles/james.png", verified: false, online: false, likedMe: false,
  },
  {
    id: "sarah", name: "Sarah", age: 31, gender: "Femme", city: "Madrid",
    languages: ["Espagnol", "Français"], distanceKm: 7100,
    bio: "Directe et passionnée, je sais ce que je veux. Passionnée de gastronomie et de salsa.",
    interests: ["Danse", "Cuisine", "Sport", "Sorties"],
    goals: ["Carrière", "Découverte"],
    temperament: { melancolique: 10, sanguin: 30, colerique: 45, flegmatique: 15 },
    photo: "assets/images/profiles/sarah.png", verified: true, online: true, likedMe: false,
  },
];

const ALL_INTERESTS = [...new Set(DEMO_PROFILES.flatMap((p) => p.interests))].sort();

const DEFAULT_PREFS = {
  relation: "Sérieuse",
  ageMin: 25, ageMax: 45,
  maxDistance: 5000,
  languages: [],
};

/* ---------- Accès aux données ---------- */

const data = {
  users: () => store.read(DB.users, []),
  saveUsers: (u) => store.write(DB.users, u),

  session: () => store.read(DB.session, null),
  setSession: (userId, remember = true) => {
    const payload = { userId, at: timeNow() };
    if (remember) store.write(DB.session, payload);
    else { try { sessionStorage.setItem(DB.session, JSON.stringify(payload)); } catch (_) { /* noop */ } }
  },
  clearSession: () => { store.remove(DB.session); try { sessionStorage.removeItem(DB.session); } catch (_) { /* noop */ } },

  currentUser() {
    const s = data.session() || (() => { try { return JSON.parse(sessionStorage.getItem(DB.session) || "null"); } catch (_) { return null; } })();
    if (!s) return null;
    return data.users().find((u) => u.id === s.userId) || null;
  },
  saveCurrentUser(updated) {
    const users = data.users();
    const i = users.findIndex((u) => u.id === updated.id);
    if (i >= 0) { users[i] = updated; data.saveUsers(users); }
  },

  matches: () => store.read(DB.matches, []),
  saveMatches: (m) => store.write(DB.matches, m),
  favorites: () => store.read(DB.favorites, []),
  saveFavorites: (f) => store.write(DB.favorites, f),
  likes: () => store.read(DB.likes, []),
  saveLikes: (l) => store.write(DB.likes, l),
  passes: () => store.read(DB.passes, []),
  savePasses: (p) => store.write(DB.passes, p),
  blocks: () => store.read(DB.blocks, []),
  saveBlocks: (b) => store.write(DB.blocks, b),
  reports: () => store.read(DB.reports, []),
  saveReports: (r) => store.write(DB.reports, r),
  hidden: () => store.read(DB.hidden, []),
  saveHidden: (h) => store.write(DB.hidden, h),
  conversations: () => store.read(DB.conversations, {}),
  saveConversations: (c) => store.write(DB.conversations, c),
  notifications: () => store.read(DB.notifications, []),
  saveNotifications: (n) => store.write(DB.notifications, n),
};

function demoProfile(id) { return DEMO_PROFILES.find((p) => p.id === id) || null; }

/* Graine initiale : comptes de démonstration + quelques conversations/notifications */
function seedIfNeeded() {
  if (store.read(DB.seeded)) return;
  const now = timeNow();
  const users = [
    {
      id: "user-demo", name: "Chris", email: "demo@anderson.app", phone: "+509 3700 0000",
      password: "demo1234", birth: "1995-04-12", gender: "Homme", city: "Port-au-Prince",
      language: "Français", role: "user", premium: false,
      photo: "", bio: "Nouveau sur Anderson, curieux de découvrir des personnes sincères.",
      interests: ["Musique", "Voyage", "Sport"],
      preferences: { ...DEFAULT_PREFS },
      temperament: null, personalityDone: false,
      createdAt: now,
    },
    {
      id: "user-admin", name: "Administrateur", email: "admin@anderson.app", phone: "",
      password: "admin1234", birth: "1990-01-01", gender: "Homme", city: "Port-au-Prince",
      language: "Français", role: "admin", premium: true,
      photo: "", bio: "Compte administrateur de démonstration.",
      interests: [], preferences: { ...DEFAULT_PREFS },
      temperament: null, personalityDone: false,
      createdAt: now,
    },
  ];
  data.saveUsers(users);

  // Quelques notifications de démarrage
  data.saveNotifications([
    { id: uid(), type: "match", title: "Nouveau match", body: "Marie t'aime en retour — c'est un match à 92% !", at: now, read: false },
    { id: uid(), type: "message", title: "Nouveau message", body: "David : On se voit bientôt ?", at: now, read: false },
  ]);

  store.write(DB.seeded, true);
}

function resetDemoData() {
  Object.values(DB).forEach((key) => store.remove(key));
  seedIfNeeded();
}
