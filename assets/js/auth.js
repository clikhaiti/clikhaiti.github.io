/* ============================================================
   auth.js — inscription, connexion, récupération, session
   Tout est local : aucun mot de passe n'est chiffré, aucun
   email n'est réellement envoyé. Voir README (avertissements).
   ============================================================ */

"use strict";

const auth = {
  init() {
    // Bascules entre les écrans d'accès
    $$("[data-go]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        auth.showGateView(el.dataset.go);
      });
    });

    // Afficher / masquer les mots de passe
    $$("[data-toggle-pass]").forEach((btn) => {
      const input = $("#" + btn.dataset.togglePass);
      btn.innerHTML = icon("eye");
      btn.addEventListener("click", () => {
        const show = input.type === "password";
        input.type = show ? "text" : "password";
        btn.innerHTML = icon(show ? "eye-off" : "eye");
        btn.setAttribute("aria-label", show ? "Masquer le mot de passe" : "Afficher le mot de passe");
      });
    });

    // Boutons Google/Apple : démonstration
    $$("[data-oauth]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const service = btn.dataset.oauth === "google" ? "Google" : "Apple";
        openSheet(`
          <h3>Continuer avec ${service}</h3>
          <p class="sheet-text">L'authentification ${service} réelle nécessite un service externe (OAuth) avec un backend sécurisé. Dans cette démonstration 100 % locale, connecte-toi avec le compte de démonstration ou crée un compte local.</p>
          <div class="sheet-actions">
            <button class="btn btn-ghost" data-sheet-close>Compris</button>
            <button class="btn btn-gold" data-fill-demo>Utiliser la démo</button>
          </div>`, { center: true });
        $("[data-fill-demo]")?.addEventListener("click", () => {
          closeSheet();
          $("#login-id").value = "demo@anderson.app";
          $("#login-pass").value = "demo1234";
          auth.showGateView("login");
        });
      });
    });

    $("#form-login").addEventListener("submit", auth.onLogin);
    $("#form-register").addEventListener("submit", auth.onRegister);
    $("#form-forgot").addEventListener("submit", auth.onForgot);
  },

  showGateView(name) {
    $$("#gate [data-gate-view]").forEach((v) => { v.hidden = v.dataset.gateView !== name; });
    hydrateIcons($("#gate"));
  },

  showGateIfNeeded() {
    const user = data.currentUser();
    const logged = Boolean(user);
    $("#gate").hidden = logged;
    $("#app").hidden = !logged;
    if (!logged) {
      auth.showGateView("welcome");
      history.replaceState(null, "", location.pathname);
    }
    return logged;
  },

  onLogin(e) {
    e.preventDefault();
    const id = $("#login-id").value.trim();
    const pass = $("#login-pass").value;
    const remember = $("#login-remember").checked;

    if (!id || !pass) return toast("Renseigne ton email/téléphone et ton mot de passe.", "error");

    const user = data.users().find((u) =>
      u.email.toLowerCase() === id.toLowerCase() || u.phone === id);

    if (!user || user.password !== pass) {
      return toast("Identifiants incorrects. Vérifie tes informations.", "error");
    }
    data.setSession(user.id, remember);
    toast(`Bienvenue, ${user.name} !`, "success");
    app.enter();
  },

  onRegister(e) {
    e.preventDefault();
    const name = $("#reg-name").value.trim();
    const email = $("#reg-email").value.trim();
    const pass = $("#reg-pass").value;
    const pass2 = $("#reg-pass2").value;
    const birth = $("#reg-birth").value;
    const adult = $("#reg-adult").checked;
    const terms = $("#reg-terms").checked;

    if (name.length < 2) return toast("Entre ton nom complet.", "error");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return toast("Adresse email invalide.", "error");
    if (data.users().some((u) => u.email.toLowerCase() === email.toLowerCase()))
      return toast("Un compte existe déjà avec cet email.", "error");
    if (pass.length < 8) return toast("Le mot de passe doit contenir au moins 8 caractères.", "error");
    if (pass !== pass2) return toast("Les mots de passe ne correspondent pas.", "error");
    if (!birth) return toast("Indique ta date de naissance.", "error");
    const age = ageFrom(birth);
    if (age < 18) return toast("Tu dois avoir au moins 18 ans pour utiliser Anderson.", "error");
    if (!adult) return toast("Tu dois certifier avoir 18 ans ou plus.", "error");
    if (!terms) return toast("Tu dois accepter les conditions d'utilisation.", "error");

    const user = {
      id: uid(), name, email, phone: "", password: pass, birth,
      gender: "", city: "", language: "Français", role: "user", premium: false,
      photo: "", bio: "", interests: [], preferences: { ...DEFAULT_PREFS },
      temperament: null, personalityDone: false, createdAt: timeNow(),
    };
    const users = data.users();
    users.push(user);
    data.saveUsers(users);
    data.setSession(user.id, true);
    toast("Compte créé. Bienvenue sur Anderson !", "success");
    app.enter();
  },

  onForgot(e) {
    e.preventDefault();
    const email = $("#forgot-email").value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))
      return toast("Entre une adresse email valide.", "error");
    openSheet(`
      <h3>Lien de récupération « envoyé »</h3>
      <p class="sheet-text">Démonstration locale : aucun email n'a réellement été envoyé. Dans une version en production, un lien sécurisé serait envoyé à <b>${esc(email)}</b> pour réinitialiser le mot de passe.</p>
      <div class="sheet-actions"><button class="btn btn-gold" data-sheet-close>Compris</button></div>`, { center: true });
  },

  logout() {
    confirmSheet({
      title: "Se déconnecter ?",
      text: "Ta session locale sera fermée. Tes données restent sur cet appareil.",
      confirm: "Se déconnecter",
    }).then((ok) => {
      if (!ok) return;
      data.clearSession();
      app.enter();
      toast("À bientôt !", "info");
    });
  },
};
