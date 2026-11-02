/* ============================================================
   app.js — routeur, navigation, thème, vues générales, boot
   ============================================================ */

"use strict";

const app = {
  routes: {
    home:       { title: "Accueil", render: () => app.renderHome() },
    discover:   { title: "Découverte", render: () => discovery.render() },
    matches:    { title: "Matchs", render: () => app.renderMatches() },
    chat:       { title: "Messagerie", render: (arg) => app.renderChat(arg) },
    favorites:  { title: "Favoris", render: () => app.renderFavorites() },
    profile:    { title: "Mon Profil", render: () => profile.render() },
    personality:{ title: "Test de personnalité", render: () => personality.render() },
    ai:         { title: "Anderson IA", render: () => andersonAI.render() },
    premium:    { title: "Premium", render: () => premium.render() },
    notifications: { title: "Notifications", render: () => notifications.render() },
    settings:   { title: "Paramètres", render: () => app.renderSettings() },
    admin:      { title: "Administration", render: () => admin.render() },
  },

  /* ---------- Démarrage ---------- */
  boot() {
    seedIfNeeded();
    app.applyTheme();
    auth.init();
    chat.init();
    andersonAI.init();
    app.buildNav();
    app.bindChrome();
    hydrateIcons();
    app.enter();
    window.addEventListener("hashchange", () => app.route());
    // PWA : fonctionnement hors ligne (sert l'application depuis le cache)
    if ("serviceWorker" in navigator && location.protocol !== "file:") {
      navigator.serviceWorker.register("service-worker.js").catch((err) =>
        console.warn("Service worker non enregistré :", err));
    }
  },

  /** Affiche gate OU app selon la session, puis route. */
  enter() {
    const logged = auth.showGateIfNeeded();
    if (logged) {
      app.buildNav(); // rôle possiblement changé
      app.route();
      app.refreshBadges();
    }
  },

  /* ---------- Navigation / coquille ---------- */
  navItems() {
    const user = data.currentUser();
    const items = [
      { section: "Menu" },
      { id: "home", label: "Accueil", icon: "home" },
      { id: "discover", label: "Découvrir", icon: "compass" },
      { id: "matches", label: "Matchs", icon: "heart" },
      { id: "chat", label: "Messages", icon: "chat", badge: () => app.unreadMessages() },
      { id: "profile", label: "Profil", icon: "user" },
      { section: "Outils" },
      { id: "ai", label: "Anderson IA", icon: "robot" },
      { id: "favorites", label: "Favoris", icon: "star" },
      { id: "notifications", label: "Notifications", icon: "bell", badge: () => notifications.unread() },
      { id: "premium", label: "Premium", icon: "crown" },
      { id: "personality", label: "Test de personnalité", icon: "sparkles" },
      { id: "settings", label: "Paramètres", icon: "settings" },
    ];
    if (user?.role === "admin") {
      items.push({ section: "Démo" }, { id: "admin", label: "Administration", icon: "shield" });
    }
    return items;
  },

  buildNav() {
    const items = app.navItems();
    $("#side-nav").innerHTML = items.map((it) => it.section
      ? `<div class="nav-section">${it.section.toUpperCase()}</div>`
      : `<button class="nav-item" data-nav="${it.id}">${icon(it.icon)}<span>${it.label}</span><span class="badge-dot" data-badge="${it.id}" hidden></span></button>`
    ).join("");
    $$("[data-nav]").forEach((b) => b.addEventListener("click", () => { location.hash = "#/" + b.dataset.nav; }));

    const tabs = [
      { id: "home", label: "Accueil", icon: "home" },
      { id: "discover", label: "Découvrir", icon: "compass" },
      { id: "matches", label: "Matchs", icon: "heart" },
      { id: "chat", label: "Messages", icon: "chat", badge: () => app.unreadMessages() },
      { id: "profile", label: "Profil", icon: "user" },
    ];
    $("#tabbar").innerHTML = tabs.map((t) => `
      <button class="tab-item" data-nav="${t.id}">${icon(t.icon)}<span>${t.label}</span>
      <span class="badge-dot" data-badge="${t.id}" hidden></span></button>`).join("");
    $$("#tabbar [data-nav]").forEach((b) => b.addEventListener("click", () => { location.hash = "#/" + b.dataset.nav; }));
    app.refreshBadges();
  },

  bindChrome() {
    $("#btn-theme").addEventListener("click", app.toggleTheme);
    $("#btn-notif").addEventListener("click", () => { location.hash = "#/notifications"; });
    $("#btn-logout").innerHTML = icon("logout");
    $("#btn-logout").addEventListener("click", auth.logout);
  },

  refreshBadges() {
    const user = data.currentUser();
    if (!user) return;
    app.navItems().forEach((it) => {
      if (!it.badge) return;
      const n = it.badge();
      $$(`[data-badge="${it.id}"]`).forEach((b) => {
        b.hidden = !n;
        b.textContent = n > 9 ? "9+" : n;
      });
    });
  },

  unreadMessages() {
    return Object.values(data.conversations()).reduce((n, c) => n + (c.unread || 0), 0);
  },

  /* ---------- Routeur ---------- */
  route() {
    if (!$("#app") || $("#app").hidden) return;
    const raw = location.hash.replace(/^#\//, "") || "home";
    const [name, arg] = raw.split("/");
    const route = app.routes[name] || app.routes.home;

    // Si non autorisé (admin), retour accueil
    const user = data.currentUser();
    if (name === "admin" && user?.role !== "admin") {
      toast("Zone réservée à l'administrateur de démo.", "error");
      location.hash = "#/home";
      return;
    }

    $$("#content .view").forEach((v) => { v.hidden = true; });
    const view = $("#view-" + (name in app.routes ? name : "home"));
    if (view) view.hidden = false;
    $("#page-title").textContent = route.title;
    $("#btn-chat-back").style.display = name === "chat" ? "" : "none";

    // état actif nav
    $$("[data-nav]").forEach((b) => b.classList.toggle("active", b.dataset.nav === name));

    route.render(arg);
    $("#content").scrollTop = 0;
    app.refreshBadges();
  },

  /* ---------- Vues générales ---------- */
  renderHome() {
    const user = data.currentUser();
    const root = $("#home-root");
    const matches = data.matches().map(demoProfile).filter(Boolean);
    const favs = data.favorites().map(demoProfile).filter(Boolean);
    const pool = DEMO_PROFILES
      .map((p) => ({ ...p, compat: matching.compute(user, p) }))
      .sort((a, b) => b.compat.score - a.compat.score).slice(0, 3);
    const lastConv = Object.values(data.conversations()).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
    const hour = new Date().getHours();
    const hello = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

    root.innerHTML = `
      <div class="hero-strip">
        <img src="assets/images/couple.png" alt="">
        <div class="hero-strip-body">
          <h2>${hello}, ${esc(user.name)} 💚</h2>
          <p>${user.personalityDone
            ? "Ta personnalité est analysée — découvre tes compatibilités du jour."
            : "Passe le test de personnalité pour débloquer tes compatibilités."}</p>
          <div class="flex wrap">
            ${user.personalityDone
              ? `<a class="btn btn-gold btn-sm" href="#/discover">${icon("compass")} Découvrir</a>`
              : `<a class="btn btn-gold btn-sm" href="#/personality">${icon("sparkles")} Passer le test</a>`}
            <a class="btn btn-ghost btn-sm" href="#/ai" style="color:#fff; border-color:rgba(255,255,255,.3)">${icon("robot")} Parler à Anderson</a>
          </div>
        </div>
      </div>

      <div class="home-grid mb">
        <div class="card stat-card"><div class="stat-ico">${icon("heart")}</div><div><b>${matches.length}</b><span>Matchs</span></div></div>
        <div class="card stat-card"><div class="stat-ico">${icon("chat")}</div><div><b>${app.unreadMessages()}</b><span>Messages non lus</span></div></div>
        <div class="card stat-card"><div class="stat-ico">${icon("star")}</div><div><b>${favs.length}</b><span>Favoris</span></div></div>
        <div class="card stat-card"><div class="stat-ico">${icon("sparkles")}</div><div><b>${user.personalityDone ? "Fait" : "À faire"}</b><span>Test de personnalité</span></div></div>
      </div>

      ${lastConv ? `
      <div class="card mb">
        <div class="flex-between">
          <h3 style="margin:0">${icon("chat")} Continuer la conversation</h3>
          <a class="small" href="#/chat/${lastConv.id}">Ouvrir</a>
        </div>
        ${(() => {
          const p = demoProfile(lastConv.id);
          const last = lastConv.messages[lastConv.messages.length - 1];
          return `
          <div class="person-row mt" style="cursor:pointer" data-open-conv="${lastConv.id}">
            <img src="${p.photo}" alt="">
            <div class="pr-body">
              <div class="pr-name">${esc(p.name)}</div>
              <div class="pr-meta">${esc(last ? last.text.slice(0, 60) : "")}</div>
            </div>
            <span class="small muted">${fmtTime(lastConv.updatedAt)}</span>
          </div>`;
        })()}
      </div>` : ""}

      <div class="card">
        <div class="flex-between">
          <h3 style="margin:0">${icon("sparkles")} Meilleures compatibilités</h3>
          <a class="small" href="#/discover">Tout voir</a>
        </div>
        <div class="mt" style="display:flex; flex-direction:column; gap:10px">
          ${pool.map((p) => `
            <div class="person-row" style="cursor:pointer" data-open-conv="${p.id}">
              <img src="${p.photo}" alt="">
              <div class="pr-body">
                <div class="pr-name">${esc(p.name)}, ${p.age} ${p.verified ? icon("check") : ""}</div>
                <div class="pr-meta">${esc(p.city)} · ${esc(p.interests.slice(0, 3).join(", "))}</div>
              </div>
              <span class="compat-pill">${p.compat.score}%</span>
            </div>`).join("")}
        </div>
      </div>`;
    hydrateIcons(root);
    $$("[data-open-conv]", root).forEach((el) => el.addEventListener("click", () => {
      location.hash = "#/chat/" + el.dataset.openConv;
    }));
  },

  renderMatches() {
    const user = data.currentUser();
    const root = $("#matches-root");
    const matches = data.matches().map(demoProfile).filter(Boolean);
    if (!matches.length) {
      root.innerHTML = `
        <div class="empty-card">${icon("heart")}<p>Aucun match pour l'instant.<br>Aime des profils dans Découvrir !</p>
        <a class="btn btn-gold btn-sm mt" href="#/discover">${icon("compass")} Découvrir</a></div>`;
      hydrateIcons(root);
      return;
    }
    root.innerHTML = matches.map((p) => {
      const compat = matching.compute(user, p);
      return `
        <div class="person-row">
          <img src="${p.photo}" alt="">
          <div class="pr-body">
            <div class="pr-name">${esc(p.name)}, ${p.age} ${p.verified ? icon("check") : ""}</div>
            <div class="pr-meta">${esc(p.city)} · match du ${new Date().toLocaleDateString("fr-FR")}</div>
          </div>
          <span class="compat-pill">${compat.score}%</span>
          <div class="row-actions">
            <button class="btn-icon" data-msg="${p.id}" title="Envoyer un message">${icon("send")}</button>
            <button class="btn-icon" data-view="${p.id}" title="Détails">${icon("eye")}</button>
          </div>
        </div>`;
    }).join("");
    hydrateIcons(root);
    $$("[data-msg]", root).forEach((b) => b.addEventListener("click", () => {
      location.hash = "#/chat/" + b.dataset.msg;
    }));
    $$("[data-view]", root).forEach((b) => b.addEventListener("click", () => {
      const p = demoProfile(b.dataset.view);
      const compat = matching.compute(user, p);
      openSheet(`
        <h3>${esc(p.name)}, ${p.age} — ${compat.score}% compatible</h3>
        <p class="sheet-text">${esc(p.bio)}</p>
        <p class="small muted"><b>Points communs :</b> ${compat.common.join(", ")}<br>
        <b>Pourquoi ça matche :</b> ${compat.reasons.join(" ; ")}.<br>
        <b>Suggestion :</b> ${compat.suggestions[0]}</p>
        <div class="sheet-actions"><button class="btn btn-gold" data-sheet-close>Compris</button></div>`);
    }));
  },

  renderChat(arg) {
    chat.list();
    if (arg && demoProfile(arg)) chat.open(arg);
    else {
      chat.activeId = null;
      $("#chat-head").innerHTML = `<div class="chat-empty" style="width:100%"><p>${icon("chat")}<br>Choisis une conversation pour commencer.</p></div>`;
      $("#chat-messages").innerHTML = "";
      $("#chat-layout").classList.remove("show-conv");
      hydrateIcons($("#chat-head"));
    }
  },

  renderFavorites() {
    const user = data.currentUser();
    const root = $("#favorites-root");
    const favs = data.favorites().map(demoProfile).filter(Boolean);
    if (!favs.length) {
      root.innerHTML = `<div class="empty-card">${icon("star")}<p>Aucun favori. Touche l'étoile sur un profil !</p></div>`;
      hydrateIcons(root);
      return;
    }
    root.innerHTML = favs.map((p) => {
      const compat = matching.compute(user, p);
      return `
        <div class="person-row">
          <img src="${p.photo}" alt="">
          <div class="pr-body">
            <div class="pr-name">${esc(p.name)}, ${p.age}</div>
            <div class="pr-meta">${esc(p.city)} · ${esc(p.interests.slice(0, 3).join(", "))}</div>
          </div>
          <span class="compat-pill">${compat.score}%</span>
          <div class="row-actions">
            <button class="btn-icon" data-msg="${p.id}" title="Message">${icon("send")}</button>
            <button class="btn-icon" data-unfav="${p.id}" title="Retirer des favoris">${icon("trash")}</button>
          </div>
        </div>`;
    }).join("");
    hydrateIcons(root);
    $$("[data-msg]", root).forEach((b) => b.addEventListener("click", () => {
      location.hash = "#/chat/" + b.dataset.msg;
    }));
    $$("[data-unfav]", root).forEach((b) => b.addEventListener("click", async () => {
      if (await confirmSheet({ title: "Retirer des favoris ?", text: "Tu pourras toujours l'ajouter à nouveau.", confirm: "Retirer", danger: true })) {
        data.saveFavorites(data.favorites().filter((id) => id !== b.dataset.unfav));
        app.renderFavorites();
        app.refreshBadges();
      }
    }));
  },

  renderSettings() {
    const user = data.currentUser();
    const root = $("#settings-root");
    const theme = store.read(DB.theme, "dark");
    root.innerHTML = `
      <div class="card">
        <h3>${icon("settings")} Préférences</h3>
        <div class="info-row">
          <span class="k">${icon(theme === "dark" ? "moon" : "sun")} Thème</span>
          <button class="btn btn-ghost btn-sm" id="set-theme">${theme === "dark" ? "Sombre (vert/or)" : "Clair (blanc/or)"} — changer</button>
        </div>
        <div class="info-row">
          <span class="k">${icon("globe")} Langue de l'interface</span>
          <span class="v">Français</span>
        </div>
        <p class="small muted mt">Créole haïtien, anglais, espagnol et portugais sont prévus dans l'outil de traduction de la messagerie.</p>
      </div>
      <div class="card">
        <h3>${icon("shield")} Sécurité et données</h3>
        <div class="info-row"><span class="k">${icon("user")} Compte</span><span class="v">${esc(user.email)}</span></div>
        <div class="info-row"><span class="k">${icon("crown")} Premium</span><span class="v">${user.premium ? "Actif (démo)" : "Non"}</span></div>
        <hr class="divider-v">
        <div class="flex wrap">
          <button class="btn btn-danger" id="set-reset">${icon("refresh")} Réinitialiser mes données de démo</button>
        </div>
        <p class="small muted mt">Les comptes et messages sont stockés uniquement dans ce navigateur : non synchronisés entre appareils, non sécurisés — voir le README.</p>
      </div>
      <div class="card">
        <h3>${icon("info")} À propos</h3>
        <div class="info-row"><span class="k">Application</span><span class="v">ANDERSON THE BEST FRIEND</span></div>
        <div class="info-row"><span class="k">Version</span><span class="v">1.0.0 — démonstration</span></div>
        <div class="info-row"><span class="k">Technologie</span><span class="v">HTML · CSS · JS vanilla · LocalStorage</span></div>
      </div>`;
    hydrateIcons(root);
    $("#set-theme").addEventListener("click", app.toggleTheme);
    $("#set-reset").addEventListener("click", async () => {
      if (await confirmSheet({
        title: "Réinitialiser tes données ?",
        text: "Matchs, conversations, favoris et notifications seront effacés de ce navigateur (les comptes de démo seront recréés).",
        confirm: "Réinitialiser", danger: true,
      })) {
        const uidNow = user.id;
        resetDemoData();
        data.setSession(uidNow, true);
        toast("Données réinitialisées.", "success");
        app.enter();
      }
    });
  },

  /* ---------- Thème ---------- */
  applyTheme() {
    const theme = store.read(DB.theme, "dark");
    document.documentElement.dataset.theme = theme;
    $("#btn-theme").innerHTML = icon(theme === "dark" ? "sun" : "moon");
  },
  toggleTheme() {
    const next = store.read(DB.theme, "dark") === "dark" ? "light" : "dark";
    store.write(DB.theme, next);
    app.applyTheme();
    if (!$("#view-settings").hidden) app.renderSettings();
    toast(next === "dark" ? "Mode sombre activé." : "Mode clair activé.", "info", 1600);
  },

  /* ---------- Match ---------- */
  showMatch(profile) {
    const user = data.currentUser();
    const compat = matching.compute(user, profile);
    const myPhoto = user.photo
      ? `<img src="${user.photo}" alt="Toi">`
      : `<div style="width:118px;height:118px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,var(--gold-light),var(--gold));color:#082D22;font-size:44px;font-weight:800;border:4px solid var(--gold)">${esc(user.name[0] || "?")}</div>`;
    const root = $("#match-root");
    root.innerHTML = `
      <div class="match-overlay">
        <div class="match-card">
          <div class="match-title">C'est un Match !</div>
          <div class="match-photos">
            ${myPhoto}
            <div class="match-heart">${icon("heart")}</div>
            <img src="${profile.photo}" alt="${esc(profile.name)}">
          </div>
          <p>Vous avez une compatibilité de <b style="color:var(--gold-light)">${compat.score}%</b> !<br>Une belle histoire peut commencer.</p>
          <div class="match-actions">
            <button class="btn btn-ghost" id="match-close">Continuer</button>
            <button class="btn btn-gold" id="match-msg">${icon("send")} Envoyer un message</button>
          </div>
        </div>
      </div>`;
    $("#match-close").addEventListener("click", () => { root.innerHTML = ""; });
    $("#match-msg").addEventListener("click", () => {
      root.innerHTML = "";
      location.hash = "#/chat/" + profile.id;
    });
    // confettis dorés
    const emo = ["💛", "✨", "💚", "🤎", "⭐"];
    for (let i = 0; i < 26; i++) {
      const c = document.createElement("span");
      c.className = "confetti";
      c.textContent = emo[i % emo.length];
      c.style.left = Math.random() * 100 + "vw";
      c.style.animationDelay = Math.random() * 0.9 + "s";
      root.querySelector(".match-overlay").appendChild(c);
      setTimeout(() => c.remove(), 3800);
    }
  },

  /* ---------- Signalement ---------- */
  reportProfile(profileId) {
    const p = demoProfile(profileId);
    const sheet = openSheet(`
      <h3>${icon("flag")} Signaler ${esc(p.name)}</h3>
      <p class="sheet-text">Signalement local de démonstration — sans serveur, il ne sera visible que dans le tableau de bord admin de ce navigateur.</p>
      <div class="field">
        <label for="rep-reason">Motif</label>
        <select class="input" id="rep-reason">
          <option>Comportement inapproprié</option>
          <option>Photo douteuse</option>
          <option>Spam ou arnaque</option>
          <option>Harcèlement</option>
          <option>Autre</option>
        </select>
      </div>
      <div class="sheet-actions">
        <button class="btn btn-ghost" data-sheet-close>Annuler</button>
        <button class="btn btn-danger" id="rep-send">Signaler</button>
      </div>`);
    $("#rep-send").addEventListener("click", () => {
      const reports = data.reports();
      reports.push({ id: uid(), profileId, reason: $("#rep-reason").value, at: timeNow(), resolved: false });
      data.saveReports(reports);
      closeSheet();
      notifications.push("flag", "Signalement enregistré", `${p.name} a été signalé (démo locale).`);
      toast("Merci, le signalement a été enregistré.", "success");
    });
  },
};

document.addEventListener("DOMContentLoaded", app.boot);
