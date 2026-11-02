/* ============================================================
   profile.js — profil utilisateur : affichage, édition,
   photo (fichier local → dataURL), préférences, confidentialité
   ============================================================ */

"use strict";

const RELATION_TYPES = ["Sérieuse", "Amitié", "Discuter"];

const profile = {
  render() {
    const user = data.currentUser();
    const root = $("#profile-root");
    if (!user) { root.innerHTML = `<div class="empty-card">${icon("user")}<p>Connecte-toi pour gérer ton profil.</p></div>`; return; }

    const photo = user.photo
      ? `<img src="${user.photo}" alt="Photo de ${esc(user.name)}">`
      : `<div style="width:100%;height:100%;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,var(--gold-light),var(--gold));color:#082D22;font-size:52px;font-weight:800">${esc(user.name[0] || "?")}</div>`;

    root.innerHTML = `
      <div class="profile-grid">
        <div class="card profile-side">
          <div class="avatar-xl">
            ${photo}
            <button class="cam" id="btn-photo" title="Changer la photo">${icon("camera")}</button>
            <input type="file" id="photo-input" accept="image/*" hidden>
          </div>
          <h3 style="margin-bottom:2px">${esc(user.name)}${user.premium ? ` <span class="tag tag-gold">${icon("crown")} Premium</span>` : ""}</h3>
          <p class="muted small">${user.email}</p>
          ${user.temperament ? `<span class="tag tag-gold mt">${icon("sparkles")} ${TEMPERAMENTS[Object.entries(user.temperament).sort((a,b)=>b[1]-a[1])[0][0]].label}</span>` : ""}
          <div class="info-list">
            <div class="info-row"><span class="k">${icon("calendar")} Âge</span><span class="v">${ageFrom(user.birth)} ans</span></div>
            <div class="info-row"><span class="k">${icon("user")} Sexe</span><span class="v">${esc(user.gender || "—")}</span></div>
            <div class="info-row"><span class="k">${icon("map-pin")} Ville</span><span class="v">${esc(user.city || "—")}</span></div>
            <div class="info-row"><span class="k">${icon("globe")} Langue</span><span class="v">${esc(user.language || "—")}</span></div>
          </div>
          <div class="interest-cloud mt">${(user.interests || []).map((i) => `<span class="tag">${esc(i)}</span>`).join("") || `<span class="muted small">Aucun intérêt renseigné</span>`}</div>
        </div>

        <div>
          <div class="card">
            <h3>${icon("edit")} Informations personnelles</h3>
            <form id="form-profile" novalidate>
              <div class="form-grid">
                <div class="field"><label for="pf-name">Prénom</label><input class="input" id="pf-name" value="${esc(user.name)}"></div>
                <div class="field"><label for="pf-birth">Date de naissance</label><input class="input" id="pf-birth" type="date" value="${esc(user.birth)}"></div>
                <div class="field">
                  <label for="pf-gender">Sexe</label>
                  <select class="input" id="pf-gender">
                    <option value="">—</option>
                    ${["Homme", "Femme", "Autre"].map((g) => `<option ${user.gender === g ? "selected" : ""}>${g}</option>`).join("")}
                  </select>
                </div>
                <div class="field"><label for="pf-city">Ville</label><input class="input" id="pf-city" value="${esc(user.city || "")}" placeholder="Ta ville"></div>
                <div class="field">
                  <label for="pf-lang">Langue</label>
                  <select class="input" id="pf-lang">
                    ${["Français", "Créole haïtien", "Anglais", "Espagnol", "Portugais"].map((l) => `<option ${user.language === l ? "selected" : ""}>${l}</option>`).join("")}
                  </select>
                </div>
                <div class="field span-2"><label for="pf-bio">Description personnelle</label><textarea class="input" id="pf-bio" placeholder="Parle de toi…">${esc(user.bio || "")}</textarea></div>
              </div>
              <div class="field">
                <label>Centres d'intérêt</label>
                <div class="interest-cloud" id="pf-interests">
                  ${ALL_INTERESTS.map((i) => `<button type="button" class="chip ${(user.interests || []).includes(i) ? "active" : ""}" data-interest="${esc(i)}">${esc(i)}</button>`).join("")}
                </div>
              </div>
              <button class="btn btn-gold" type="submit">${icon("check")} Enregistrer</button>
            </form>
          </div>

          <div class="card">
            <h3>${icon("sliders")} Préférences de recherche</h3>
            <form id="form-prefs" novalidate>
              <div class="form-grid">
                <div class="field">
                  <label for="pv-relation">Type de relation</label>
                  <select class="input" id="pv-relation">
                    ${RELATION_TYPES.map((r) => `<option ${user.preferences?.relation === r ? "selected" : ""}>${r}</option>`).join("")}
                  </select>
                </div>
                <div class="field">
                  <label for="pv-distance">Distance max (km)</label>
                  <input class="input" id="pv-distance" type="number" min="1" max="20000" value="${user.preferences?.maxDistance ?? 5000}">
                </div>
                <div class="field"><label for="pv-agemin">Âge min</label><input class="input" id="pv-agemin" type="number" min="18" max="60" value="${user.preferences?.ageMin ?? 18}"></div>
                <div class="field"><label for="pv-agemax">Âge max</label><input class="input" id="pv-agemax" type="number" min="18" max="60" value="${user.preferences?.ageMax ?? 60}"></div>
                <div class="field span-2">
                  <label>Langues préférées</label>
                  <div class="interest-cloud" id="pv-langs">
                    ${["Français", "Créole haïtien", "Anglais", "Espagnol", "Portugais"].map((l) =>
                      `<button type="button" class="chip ${(user.preferences?.languages || []).includes(l) ? "active" : ""}" data-lang="${l}">${l}</button>`).join("")}
                  </div>
                </div>
              </div>
              <button class="btn btn-gold" type="submit">${icon("check")} Enregistrer les préférences</button>
            </form>
          </div>

          <div class="card">
            <h3>${icon("lock")} Confidentialité</h3>
            <label class="check mb"><input type="checkbox" id="pv-hide" ${user.hideProfile ? "checked" : ""}> Masquer mon profil des suggestions (démo)</label>
            <p class="small muted">Ces réglages sont locaux à cette démonstration : une vraie confidentialité exige un serveur sécurisé.</p>
          </div>
        </div>
      </div>`;

    hydrateIcons(root);

    // Photo de profil (fichier → aperçu → dataURL)
    $("#btn-photo").addEventListener("click", () => $("#photo-input").click());
    $("#photo-input").addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) return toast("Choisis un fichier image.", "error");
      if (file.size > 2.5 * 1024 * 1024) return toast("Image trop lourde (max 2,5 Mo).", "error");
      const reader = new FileReader();
      reader.onload = () => {
        const u = data.currentUser();
        u.photo = reader.result;
        data.saveCurrentUser(u);
        toast("Photo de profil mise à jour.", "success");
        profile.render();
      };
      reader.onerror = () => toast("Lecture du fichier impossible.", "error");
      reader.readAsDataURL(file);
    });

    // Intérêts (toggle)
    $$("#pf-interests .chip").forEach((c) => c.addEventListener("click", () => c.classList.toggle("active")));

    // Langues préférées (toggle)
    $$("#pv-langs .chip").forEach((c) => c.addEventListener("click", () => c.classList.toggle("active")));

    $("#form-profile").addEventListener("submit", (e) => {
      e.preventDefault();
      const name = $("#pf-name").value.trim();
      if (name.length < 2) return toast("Le prénom est requis.", "error");
      const u = data.currentUser();
      Object.assign(u, {
        name,
        birth: $("#pf-birth").value || u.birth,
        gender: $("#pf-gender").value,
        city: $("#pf-city").value.trim(),
        language: $("#pf-lang").value,
        bio: $("#pf-bio").value.trim(),
        interests: $$("#pf-interests .chip.active").map((c) => c.dataset.interest),
      });
      data.saveCurrentUser(u);
      toast("Profil enregistré.", "success");
      app.refreshBadges();
      profile.render();
    });

    $("#form-prefs").addEventListener("submit", (e) => {
      e.preventDefault();
      const u = data.currentUser();
      u.preferences = {
        relation: $("#pv-relation").value,
        maxDistance: clamp(+$("#pv-distance").value || 5000, 1, 20000),
        ageMin: clamp(+$("#pv-agemin").value || 18, 18, 60),
        ageMax: clamp(+$("#pv-agemax").value || 60, 18, 60),
        languages: $$("#pv-langs .chip.active").map((c) => c.dataset.lang),
      };
      data.saveCurrentUser(u);
      toast("Préférences enregistrées.", "success");
    });

    $("#pv-hide").addEventListener("change", (e) => {
      const u = data.currentUser();
      u.hideProfile = e.target.checked;
      data.saveCurrentUser(u);
      toast(e.target.checked ? "Profil masqué (démo)." : "Profil visible (démo).", "info");
    });
  },
};
