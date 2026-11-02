/* ============================================================
   discovery.js — découverte des profils, filtres, actions
   Passer / J'aime / Favoris / Message. Match simulé quand le
   profil démo « t'aime en retour ».
   ============================================================ */

"use strict";

const discovery = {
  index: 0,

  render() {
    // Remplir les selects de filtres une fois
    const citySel = $("#f-city");
    if (citySel.options.length === 1) {
      [...new Set(DEMO_PROFILES.map((p) => p.city))].forEach((c) => {
        citySel.insertAdjacentHTML("beforeend", `<option>${esc(c)}</option>`);
      });
      const intSel = $("#f-interest");
      ALL_INTERESTS.forEach((i) => intSel.insertAdjacentHTML("beforeend", `<option>${esc(i)}</option>`));
    }
    ["#f-city", "#f-lang", "#f-relation", "#f-interest"].forEach((s) =>
      $(s).addEventListener("change", () => { discovery.index = 0; discovery._renderDeck(); }));
    ["#f-age-min", "#f-age-max"].forEach((s) =>
      $(s).addEventListener("input", () => {
        const min = +$("#f-age-min").value, max = +$("#f-age-max").value;
        $("#f-age-label").textContent = `${Math.min(min, max)} – ${Math.max(min, max)}`;
        discovery._renderDeck();
      }));
    $("#f-compat").addEventListener("input", () => {
      $("#f-compat-label").textContent = $("#f-compat").value + "%";
      discovery._renderDeck();
    });
    $("#f-reset").addEventListener("click", () => {
      $("#f-city").value = ""; $("#f-lang").value = ""; $("#f-relation").value = "";
      $("#f-interest").value = ""; $("#f-compat").value = 0; $("#f-compat-label").textContent = "0%";
      $("#f-age-min").value = 18; $("#f-age-max").value = 60; $("#f-age-label").textContent = "18 – 60";
      discovery.index = 0; discovery._renderDeck();
    });
    discovery._renderDeck();
  },

  _pool() {
    const user = data.currentUser();
    const hidden = data.hidden(), blocks = data.blocks();
    const passes = data.passes();
    const min = Math.min(+$("#f-age-min").value, +$("#f-age-max").value);
    const max = Math.max(+$("#f-age-min").value, +$("#f-age-max").value);
    const compatMin = +$("#f-compat").value;

    return DEMO_PROFILES
      .filter((p) => !hidden.includes(p.id) && !blocks.includes(p.id))
      .filter((p) => !passes.includes(p.id))
      .filter((p) => !$("#f-city").value || p.city === $("#f-city").value)
      .filter((p) => !$("#f-lang").value || p.languages.includes($("#f-lang").value))
      .filter((p) => p.age >= min && p.age <= max)
      .filter((p) => !$("#f-interest").value || p.interests.includes($("#f-interest").value))
      .map((p) => ({ ...p, compat: matching.compute(user, p) }))
      .filter((p) => p.compat.score >= compatMin)
      .sort((a, b) => b.compat.score - a.compat.score);
  },

  _renderDeck() {
    const root = $("#discover-root");
    const pool = discovery._pool();
    if (discovery.index >= pool.length) discovery.index = 0;

    if (!pool.length) {
      root.innerHTML = `
        <div class="empty-card" style="max-width:440px; margin:40px auto">
          ${icon("search")}
          <p>Aucun profil ne correspond à ces filtres.<br>Essaie d'élargir tes critères.</p>
          <button class="btn btn-gold btn-sm mt" id="empty-reset">Réinitialiser les filtres</button>
        </div>`;
      $("#empty-reset").addEventListener("click", () => $("#f-reset").click());
      return;
    }

    const p = pool[discovery.index];
    const favs = data.favorites();
    root.innerHTML = `
      <div class="profile-card">
        <div class="profile-card-photo">
          <img src="${p.photo}" alt="Photo de ${esc(p.name)}">
          ${p.verified ? `<span class="profile-verified">${icon("check")} Vérifié · démo</span>` : ""}
          ${matching.ring(p.compat.score)}
        </div>
        <div class="profile-card-body">
          <h2>${esc(p.name)}, ${p.age} ${p.verified ? icon("check") : ""}</h2>
          <p class="pc-loc">${icon("map-pin")} ${esc(p.city)} · ${p.distanceKm} km · ${p.online ? "En ligne" : "Hors ligne"}</p>
          <p class="pc-desc">${esc(p.bio)}</p>
          <div class="pc-tags">
            ${p.interests.map((i) => `<span class="tag">${esc(i)}</span>`).join("")}
          </div>
        </div>
      </div>
      <div class="discover-actions">
        <button class="action-round pass" data-act="pass" aria-label="Passer" title="Passer">${icon("x")}</button>
        <button class="action-round fav ${favs.includes(p.id) ? "like" : ""}" data-act="fav" aria-label="Favoris" title="Favoris">${icon("star")}</button>
        <button class="action-round like" data-act="like" aria-label="J'aime" title="J'aime">${icon("heart")}</button>
        <button class="action-round msg" data-act="msg" aria-label="Envoyer un message" title="Message">${icon("send")}</button>
      </div>
      <p class="small muted" style="text-align:center; margin-top:14px">
        ${discovery.index + 1} / ${pool.length} — ${p.compat.reasons.join(" · ")}
      </p>`;

    $$("[data-act]", root).forEach((btn) => btn.addEventListener("click", () => {
      discovery._act(btn.dataset.act, p);
    }));
  },

  async _act(act, profile) {
    switch (act) {
      case "pass": {
        const passes = data.passes(); passes.push(profile.id); data.savePasses(passes);
        discovery.index++; discovery._renderDeck();
        break;
      }
      case "fav": {
        const favs = data.favorites();
        const i = favs.indexOf(profile.id);
        if (i >= 0) { favs.splice(i, 1); toast(`${profile.name} retiré de tes favoris.`, "info"); }
        else {
          favs.push(profile.id);
          toast(`${profile.name} ajouté à tes favoris.`, "success");
          notifications.push("star", "Nouveau favori", `Tu as ajouté ${profile.name} à tes favoris.`);
        }
        data.saveFavorites(favs);
        discovery._renderDeck();
        break;
      }
      case "like": {
        const likes = data.likes();
        if (!likes.includes(profile.id)) {
          likes.push(profile.id); data.saveLikes(likes);
        }
        const matches = data.matches();
        if (profile.likedMe && !matches.includes(profile.id)) {
          matches.push(profile.id); data.saveMatches(matches);
          chat.seedConversation(profile.id);
          notifications.push("heart", "Nouveau match", `Toi et ${profile.name} vous aimez mutuellement !`);
          app.showMatch(profile);
        } else {
          toast(`Tu as aimé ${profile.name}.`, "success");
        }
        discovery.index++; discovery._renderDeck();
        break;
      }
      case "msg": {
        // Aimer d'abord (déclenche un match si mutuel), puis ouvrir la conversation
        const likes = data.likes();
        if (!likes.includes(profile.id)) likes.push(profile.id), data.saveLikes(likes);
        chat.seedConversation(profile.id);
        location.hash = "#/chat/" + profile.id;
        break;
      }
    }
  },
};
