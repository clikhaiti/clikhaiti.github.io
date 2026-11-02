/* ============================================================
   matching.js — moteur de compatibilité 100% local
   Le score combine : tempérament, intérêts communs, objectifs,
   langues, ville et préférences de l'utilisateur courant.
   ============================================================ */

"use strict";

const matching = {

  /** Score global 0–100 + détails exploitables pour l'affichage. */
  compute(user, profile) {
    const reasons = [];
    const common = [];
    const differences = [];
    let score = 30; // base de bienvenue

    // 1. Tempérament (30 pts) : similarité entre profils de tempérament
    const tScore = matching._temperamentScore(user.temperament, profile.temperament);
    score += Math.round(tScore * 0.30);
    if (tScore > 70) reasons.push("vos tempéraments sont très complémentaires");
    else if (tScore > 45) reasons.push("vos personnalités se répondent bien");

    // 2. Intérêts communs (25 pts)
    const shared = (user.interests || []).filter((i) => profile.interests.includes(i));
    common.push(...shared);
    const iScore = Math.min(100, (shared.length / Math.max(1, Math.min(6, user.interests.length))) * 100);
    score += Math.round(iScore * 0.25);
    if (shared.length) reasons.push(`intérêts communs : ${shared.join(", ").toLowerCase()}`);
    const diff = profile.interests.filter((i) => !(user.interests || []).includes(i));
    differences.push(...diff.slice(0, 3));

    // 3. Objectifs de vie (15 pts)
    const sharedGoals = (user.goals || []).filter((g) => profile.goals.includes(g));
    if (sharedGoals.length) {
      score += Math.min(15, sharedGoals.length * 10);
      reasons.push(`mêmes objectifs : ${sharedGoals.join(", ").toLowerCase()}`);
    }

    // 4. Langue commune (10 pts)
    const userLangs = [user.language, ...(user.preferences?.languages || [])].filter(Boolean);
    const langShared = profile.languages.filter((l) => userLangs.includes(l));
    if (langShared.length) {
      score += 10;
      reasons.push(`vous parlez tous les deux ${langShared.join(" et ")}`);
    }

    // 5. Proximité (10 pts)
    if (profile.city === user.city) { score += 10; reasons.push(`vous habitez tous les deux ${profile.city}`); }
    else if (profile.distanceKm <= 50) score += 6;
    else if (profile.distanceKm <= 500) score += 3;

    // 6. Bonus préférences (10 pts) : âge et relation dans les critères choisis
    const prefs = user.preferences || DEFAULT_PREFS;
    if (profile.age >= (prefs.ageMin || 18) && profile.age <= (prefs.ageMax || 60)) score += 6;
    else differences.push(`âge (${profile.age} ans) hors de ta tranche choisie`);
    if (!prefs.relation || prefs.relation === "Sérieuse") score += 4;

    const final = clamp(Math.round(score), 8, 99);
    return {
      score: final,
      common: common.length ? common : ["curiosité mutuelle pour la vie"],
      differences,
      reasons: reasons.length ? reasons : ["une belle énergie partagée"],
      suggestions: matching._suggestions(shared, profile),
    };
  },

  _temperamentScore(a, b) {
    if (!a || !b) return 50; // test pas encore fait : neutre
    const keys = ["melancolique", "sanguin", "colerique", "flegmatique"];
    const dist = keys.reduce((sum, k) => sum + Math.abs((a[k] || 0) - (b[k] || 0)), 0);
    return clamp(100 - dist / 2, 0, 100);
  },

  _suggestions(shared, profile) {
    const out = [];
    if (shared.includes("Musique"))
      out.push(`Demande à ${profile.name} quel morceau la met de bonne humeur — c'est un excellent brise-glace.`);
    if (shared.includes("Voyage"))
      out.push(`Parlez d'un voyage rêvé : ${profile.name} adore découvrir de nouveaux horizons.`);
    if (shared.includes("Cuisine"))
      out.push(`Propose un échange de plats préférés, puis d'une recette à cuisiner ensemble.`);
    if (shared.includes("Lecture"))
      out.push(`Demande le dernier livre qui a marqué ${profile.name}.`);
    if (!out.length)
      out.push(`Commence par un message sincère sur ce qui t'a plu dans le profil de ${profile.name}.`);
    out.push("Reste toi-même : la constance crée la confiance.");
    return out;
  },

  /** Anneau SVG de compatibilité. */
  ring(score, size = 56) {
    const r = (size - 8) / 2;
    const c = 2 * Math.PI * r;
    const off = c * (1 - score / 100);
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="compat-ring" role="img" aria-label="Compatibilité ${score} %">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="rgba(8,45,34,.55)" stroke="rgba(255,255,255,.18)" stroke-width="5"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="url(#gld${size})" stroke-width="5" stroke-linecap="round"
        stroke-dasharray="${c}" stroke-dashoffset="${off}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
      <defs><linearGradient id="gld${size}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#F4D98A"/><stop offset="1" stop-color="#D9B45B"/>
      </linearGradient></defs>
      <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" fill="#fff" font-size="${size / 3.6}" font-weight="800">${score}%</text>
    </svg>`;
  },
};
