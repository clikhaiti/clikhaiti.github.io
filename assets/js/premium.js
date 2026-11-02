/* ============================================================
   premium.js — écran Premium (prix d'exemple, paiement simulé)
   ============================================================ */

"use strict";

const PLANS = [
  { id: "1m", name: "1 MOIS", price: "9,99 $", save: "", featured: false },
  { id: "3m", name: "3 MOIS", price: "24,99 $", save: "-17%", featured: true },
  { id: "12m", name: "12 MOIS", price: "59,99 $", save: "-50%", featured: false },
];

const PERKS = [
  ["sparkles", "Conversation IA approfondie"],
  ["chart", "Analyse de personnalité détaillée"],
  ["heart", "Matching avancé"],
  ["star", "Priorité dans les suggestions"],
  ["translate", "Traduction illimitée"],
  ["shield", "Statistiques personnelles"],
];

const premium = {
  render() {
    const user = data.currentUser();
    const root = $("#premium-root");
    const isPremium = Boolean(user?.premium);
    root.innerHTML = `
      <div class="premium-hero">
        <div class="premium-crown">${icon("crown")}</div>
        <h2>${isPremium ? "Tu es Premium !" : "Passer Premium"}</h2>
        <p>${isPremium
          ? "Merci pour ta confiance (abonnement de démonstration actif)."
          : "Débloque tout le potentiel d'Anderson !"}</p>
      </div>
      <div class="card mb">
        <h3>${icon("check")} Avantages Premium</h3>
        <ul class="perk-list">
          ${PERKS.map(([ic, t]) => `<li>${icon(ic)}<span>${t}</span></li>`).join("")}
        </ul>
      </div>
      <div class="plans mb">
        ${PLANS.map((p) => `
          <div class="card plan-card ${p.featured ? "featured" : ""}">
            ${p.featured ? `<span class="plan-badge tag tag-gold">Populaire</span>` : ""}
            <div class="plan-name">${p.name}</div>
            <div class="plan-price">${p.price}<small> / période</small></div>
            <div class="plan-save">${p.save || " "}</div>
            <button class="btn ${p.featured ? "btn-gold" : "btn-ghost"} btn-block" data-plan="${p.id}" ${isPremium ? "disabled" : ""}>
              ${isPremium ? "Abonné" : "S'abonner"}
            </button>
          </div>`).join("")}
      </div>
      <div class="card">
        <h3>Gratuit vs Premium</h3>
        <table class="compare-table">
          <thead><tr><th>Fonctionnalité</th><th>Gratuit</th><th>Premium</th></tr></thead>
          <tbody>
            <tr><td>Discovery et likes</td><td class="yes">${icon("check")}</td><td class="yes">${icon("check")}</td></tr>
            <tr><td>Messagerie locale</td><td class="yes">${icon("check")}</td><td class="yes">${icon("check")}</td></tr>
            <tr><td>Test de personnalité</td><td class="yes">${icon("check")}</td><td class="yes">${icon("check")}</td></tr>
            <tr><td>Anderson IA (réponses démo)</td><td class="yes">${icon("check")}</td><td class="yes">${icon("check")}</td></tr>
            <tr><td>Analyse approfondie + stats</td><td class="no">${icon("x")}</td><td class="yes">${icon("check")}</td></tr>
            <tr><td>Traduction illimitée (futur)</td><td class="no">${icon("x")}</td><td class="yes">${icon("check")}</td></tr>
            <tr><td>Priorité dans les suggestions</td><td class="no">${icon("x")}</td><td class="yes">${icon("check")}</td></tr>
          </tbody>
        </table>
        <p class="small muted mt">⚠️ Paiement 100% simulé : aucune information bancaire n'est demandée et aucun prélèvement réel n'a lieu. Les prix sont des exemples à configurer.</p>
      </div>`;
    hydrateIcons(root);
    $$("[data-plan]", root).forEach((btn) => btn.addEventListener("click", () => premium._subscribe(btn.dataset.plan)));
  },

  async _subscribe(planId) {
    const plan = PLANS.find((p) => p.id === planId);
    const ok = await confirmSheet({
      title: "Confirmer l'abonnement (démo)",
      text: `Plan ${plan.name} à ${plan.price} — paiement simulé, aucune donnée bancaire requise. Confirmer ?`,
      confirm: "Souscrire (démo)",
    });
    if (!ok) return;
    const user = data.currentUser();
    user.premium = true;
    user.premiumPlan = planId;
    user.premiumSince = timeNow();
    data.saveCurrentUser(user);
    notifications.push("star", "Bienvenue Premium !", `Ton abonnement de démonstration ${plan.name} est actif.`);
    toast("Abonnement Premium activé (démonstration).", "success");
    premium.render();
  },
};
