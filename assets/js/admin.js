/* ============================================================
   admin.js — tableau de bord administrateur (démonstration)
   ⚠️ Une administration côté navigateur n'est PAS sécurisée :
   ce n'est pas une administration de production.
   ============================================================ */

"use strict";

const admin = {
  tab: "dash",

  render() {
    const user = data.currentUser();
    const root = $("#admin-root");
    if (!user || user.role !== "admin") {
      root.innerHTML = `<div class="empty-card">${icon("shield")}<p>Réservé au compte administrateur de démonstration.</p></div>`;
      return;
    }
    const menu = $("#admin-menu");
    const items = [
      ["dash", "Tableau de bord", "chart"],
      ["users", "Utilisateurs", "users"],
      ["reports", "Signalements", "flag"],
      ["profiles", "Profils démo", "heart"],
      ["settings", "Paramètres", "settings"],
    ];
    menu.innerHTML = items.map(([id, label, ic]) =>
      `<button class="nav-item ${admin.tab === id ? "active" : ""}" data-atab="${id}">${icon(ic)} ${label}</button>`).join("");
    $$("[data-atab]", menu).forEach((b) => b.addEventListener("click", () => {
      admin.tab = b.dataset.atab;
      admin.render();
    }));

    ({ dash: admin._dash, users: admin._users, reports: admin._reports,
       profiles: admin._profiles, settings: admin._settings })[admin.tab](root);
  },

  _dash(root) {
    const users = data.users();
    const convs = Object.values(data.conversations());
    const msgCount = convs.reduce((n, c) => n + c.messages.length, 0);
    const stats = [
      [users.length, "Comptes (démo)", "users"],
      [data.matches().length, "Matchs", "heart"],
      [msgCount, "Messages locaux", "chat"],
      [data.favorites().length, "Favoris", "star"],
      [data.reports().length, "Signalements", "flag"],
    ];
    root.innerHTML = `
      <div class="stats-row">
        ${stats.map(([n, label, ic]) => `
          <div class="card stat-card">
            <div class="stat-ico">${icon(ic)}</div>
            <div><b>${n}</b><span>${label}</span></div>
          </div>`).join("")}
      </div>
      <div class="card">
        <h3>${icon("chart")} Activité des 7 derniers jours</h3>
        ${admin._sparkline()}
        <p class="small muted mt">Graphique simulé à partir des données locales de démonstration.</p>
      </div>
      <div class="card">
        <h3>${icon("activity")} Activité récente</h3>
        ${data.notifications().slice(0, 5).map((n) => `
          <div class="notif-item">
            <div class="notif-ico">${icon(n.type === "match" ? "heart" : n.type === "message" ? "chat" : "bell")}</div>
            <div class="notif-body"><b>${esc(n.title)}</b><span>${esc(n.body)}</span></div>
            <span class="notif-time">${fmtTime(n.at)}</span>
          </div>`).join("") || `<p class="muted small">Aucune activité.</p>`}
      </div>`;
    hydrateIcons(root);
  },

  _sparkline() {
    // courbe SVG pseudo-aléatoire stable (seed fixe) pour la démo
    const pts = [12, 18, 14, 24, 20, 32, 28];
    const max = Math.max(...pts);
    const w = 100 / (pts.length - 1);
    const coords = pts.map((v, i) => `${(i * w).toFixed(2)},${(60 - (v / max) * 52).toFixed(2)}`).join(" ");
    return `<svg class="spark" viewBox="0 0 100 60" preserveAspectRatio="none" style="height:90px">
      <polyline points="${coords}" fill="none" stroke="var(--gold)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
      ${pts.map((v, i) => `<circle cx="${(i * w).toFixed(2)}" cy="${(60 - (v / max) * 52).toFixed(2)}" r="2.2" fill="var(--gold-light)" vector-effect="non-scaling-stroke"/>`).join("")}
    </svg>`;
  },

  _users(root) {
    const users = data.users();
    root.innerHTML = `
      <div class="card">
        <h3>${icon("users")} Comptes de démonstration</h3>
        <table class="admin-table">
          <thead><tr><th></th><th>Nom</th><th>Email</th><th>Rôle</th><th>Premium</th><th>Créé le</th><th></th></tr></thead>
          <tbody>
            ${users.map((u) => `
              <tr>
                <td><div style="width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,var(--gold-light),var(--gold));color:#082D22;font-weight:800">${esc(u.name[0] || "?")}</div></td>
                <td><b>${esc(u.name)}</b></td>
                <td class="muted">${esc(u.email)}</td>
                <td><span class="status-pill ${u.role === "admin" ? "status-info" : "status-ok"}">${u.role}</span></td>
                <td>${u.premium ? icon("crown") : "—"}</td>
                <td class="muted small">${new Date(u.createdAt).toLocaleDateString("fr-FR")}</td>
                <td>${u.role !== "admin" ? `<button class="btn btn-danger btn-sm" data-del-user="${u.id}">${icon("trash")}</button>` : ""}</td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>`;
    hydrateIcons(root);
    $$("[data-del-user]", root).forEach((b) => b.addEventListener("click", async () => {
      const u = data.users().find((x) => x.id === b.dataset.delUser);
      if (await confirmSheet({ title: "Supprimer ce compte ?", text: `Le compte de démonstration de ${u.name} sera effacé de ce navigateur.`, confirm: "Supprimer", danger: true })) {
        data.saveUsers(data.users().filter((x) => x.id !== u.id));
        toast("Compte supprimé.", "success");
        admin.render();
      }
    }));
  },

  _reports(root) {
    const reports = data.reports();
    root.innerHTML = `
      <div class="card">
        <h3>${icon("flag")} Signalements locaux</h3>
        ${reports.length ? reports.map((r) => `
          <div class="notif-item">
            <div class="notif-ico">${icon("flag")}</div>
            <div class="notif-body"><b>${esc(demoProfile(r.profileId)?.name || r.profileId)}</b>
              <span>Motif : ${esc(r.reason)} · signalé le ${new Date(r.at).toLocaleString("fr-FR")}</span></div>
            <button class="btn btn-ghost btn-sm" data-resolve="${r.id}">${icon("check")} Résoudre</button>
          </div>`).join("") : `<div class="empty-card">${icon("shield")}<p>Aucun signalement. La communauté démo est sagement sage.</p></div>`}
        <p class="small muted mt">⚠️ Sans serveur, ces signalements restent sur cet appareil et ne protègent personne réellement.</p>
      </div>`;
    hydrateIcons(root);
    $$("[data-resolve]", root).forEach((b) => b.addEventListener("click", () => {
      data.saveReports(data.reports().filter((r) => r.id !== b.dataset.resolve));
      toast("Signalement résolu (local).", "success");
      admin.render();
    }));
  },

  _profiles(root) {
    const user = data.currentUser();
    root.innerHTML = `
      <div class="card">
        <h3>${icon("heart")} Profils de démonstration</h3>
        <table class="admin-table">
          <thead><tr><th></th><th>Nom</th><th>Ville</th><th>Âge</th><th>Compat.</th><th>Statut</th><th></th></tr></thead>
          <tbody>
            ${DEMO_PROFILES.map((p) => {
              const compat = matching.compute(user, p);
              const blocked = data.blocks().includes(p.id);
              return `
              <tr>
                <td><img src="${p.photo}" alt="" style="width:36px;height:36px;border-radius:50%;object-fit:cover"></td>
                <td><b>${esc(p.name)}</b></td>
                <td class="muted">${esc(p.city)}</td>
                <td>${p.age} ans</td>
                <td><span class="compat-pill">${compat.score}%</span></td>
                <td><span class="status-pill ${blocked ? "status-warn" : p.online ? "status-ok" : "status-info"}">${blocked ? "Bloqué" : p.online ? "En ligne" : "Hors ligne"}</span></td>
                <td>${blocked ? `<button class="btn btn-ghost btn-sm" data-unblock="${p.id}">Débloquer</button>` : ""}</td>
              </tr>`;
            }).join("")}
          </tbody>
        </table>
      </div>`;
    $$("[data-unblock]", root).forEach((b) => b.addEventListener("click", () => {
      data.saveBlocks(data.blocks().filter((id) => id !== b.dataset.unblock));
      toast("Profil débloqué.", "success");
      admin.render();
    }));
  },

  _settings(root) {
    root.innerHTML = `
      <div class="card">
        <h3>${icon("settings")} Paramètres de l'application</h3>
        <div class="info-row"><span class="k">Nom de l'application</span><span class="v">ANDERSON THE BEST FRIEND</span></div>
        <div class="info-row"><span class="k">Version</span><span class="v">1.0.0 (démo locale)</span></div>
        <div class="info-row"><span class="k">Mode</span><span class="v">100% navigateur, sans backend</span></div>
        <hr class="divider-v">
        <p class="small muted mb">Réinitialise toutes les données de démonstration (comptes, matchs, conversations, notifications) puis recharge l'application.</p>
        <div class="flex wrap">
          <button class="btn btn-danger" id="btn-reset-demo">${icon("refresh")} Réinitialiser les données de démo</button>
        </div>
        <p class="small muted mt">⚠️ Administration de démonstration uniquement : sans backend sécurisé, tout compte « admin » côté client peut être contourné.</p>
      </div>`;
    hydrateIcons(root);
    $("#btn-reset-demo").addEventListener("click", async () => {
      if (await confirmSheet({
        title: "Réinitialiser toutes les données ?",
        text: "Comptes, matchs, conversations et notifications de démonstration seront effacés de ce navigateur.",
        confirm: "Tout réinitialiser", danger: true,
      })) {
        resetDemoData();
        data.clearSession();
        toast("Données réinitialisées.", "success");
        setTimeout(() => location.reload(), 600);
      }
    });
  },
};
