/* ============================================================
   notifications.js — centre de notifications local
   ============================================================ */

"use strict";

const notifications = {
  /** Ajoute une notification locale et rafraîchit les badges. */
  push(type, title, body) {
    const list = data.notifications();
    list.unshift({ id: uid(), type, title, body, at: timeNow(), read: false });
    data.saveNotifications(list.slice(0, 50));
    if (window.app) app.refreshBadges();
  },

  unread() { return data.notifications().filter((n) => !n.read).length; },

  render() {
    const root = $("#notif-root");
    const list = data.notifications();
    if (!list.length) {
      root.innerHTML = `<div class="empty-card">${icon("bell")}<p>Aucune notification pour le moment.</p></div>`;
      return;
    }
    const iconFor = { match: "heart", message: "chat", favorite: "star", robot: "robot", account: "shield" };
    root.innerHTML = `
      <div class="flex-between mb">
        <p class="page-sub" style="margin:0">${list.length} notification(s) · ${notifications.unread()} non lue(s)</p>
        <button class="btn btn-ghost btn-sm" id="notif-readall">${icon("check")} Tout marquer lu</button>
      </div>
      ${list.map((n) => `
        <div class="notif-item ${n.read ? "" : "unread"}" data-notif="${n.id}">
          <div class="notif-ico">${icon(iconFor[n.type] || "bell")}</div>
          <div class="notif-body"><b>${esc(n.title)}</b><span>${esc(n.body)}</span></div>
          <span class="notif-time">${fmtTime(n.at)}</span>
        </div>`).join("")}`;
    $("#notif-readall").addEventListener("click", () => {
      data.saveNotifications(data.notifications().map((n) => ({ ...n, read: true })));
      notifications.render();
      app.refreshBadges();
    });
    $$("[data-notif]", root).forEach((el) => el.addEventListener("click", () => {
      const list2 = data.notifications();
      const n = list2.find((x) => x.id === el.dataset.notif);
      if (n) { n.read = true; data.saveNotifications(list2); }
      notifications.render();
      app.refreshBadges();
    }));
  },
};
