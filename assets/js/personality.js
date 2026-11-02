/* ============================================================
   personality.js — test de personnalité (12 questions)
   Quatre tempéraments : mélancolique, sanguin, colérique,
   flegmatique. Résultat enregistré dans le profil local.
   ============================================================ */

"use strict";

const TEMPERAMENTS = {
  melancolique: {
    label: "Mélancolique",
    icon: "moon",
    traits: ["Réflexif", "Sensible", "Perfectionniste", "Loyal", "Créatif"],
    love: "En amour, tu es profond et fidèle. Tu as besoin de lien authentique : prends le temps de t'ouvrir, ta sensibilité est une force rare.",
    advice: "Exprime tes besoins clairement : ton partenaire ne devine pas toujours tes pensées. Les mots doux sortis de ta tête valent de l'or.",
  },
  sanguin: {
    label: "Sanguin",
    icon: "sun",
    traits: ["Enthousiaste", "Sociable", "Spontané", "Optimiste", "Chaleureux"],
    love: "En amour, tu rayonnes et tu fais rire ton entourage. Ta joie est contagieuse — garde aussi de l'attention pour les moments calmes à deux.",
    advice: "Ta spontanéité séduit, mais la constance rassure : petits messages réguliers et promesses tenues renforcent la confiance.",
  },
  colerique: {
    label: "Colérique",
    icon: "flag",
    traits: ["Déterminé", "Direct", "Leader", "Passionné", "Efficace"],
    love: "En amour, tu sais ce que tu veux et tu investis sans demi-mesure. Apprends à écouter avant de conclure : ta force devient alors sagesse.",
    advice: "Lâche prise sur les détails : une relation n'est pas un projet à optimiser. La douceur dans le ton désamorce 90% des tensions.",
  },
  flegmatique: {
    label: "Flegmatique",
    icon: "shield",
    traits: ["Calme", "Patient", "Équilibré", "Fiable", "À l'écoute"],
    love: "En amour, tu es un roc rassurant. Ta patience est un cadeau — ose aussi montrer ton enthousiasme, il est attendu.",
    advice: "Prends des initiatives, même petites : inviter, surprendre, dire je t'aime en premier. Le calme posé + l'audace = équilibre parfait.",
  },
};

const QUIZ = [
  { q: "Comment réagis-tu face aux défis ?", a: [
    ["Je relève avec enthousiasme", "sanguin"],
    ["Je réfléchis calmement avant d'agir", "melancolique"],
    ["Je m'adapte selon la situation", "flegmatique"],
    ["J'attaque directement le problème", "colerique"] ] },
  { q: "Une soirée entre amis, idéalement…", a: [
    ["Je fais rire tout le monde", "sanguin"],
    ["Je discute en petit comité, profond", "melancolique"],
    ["Je m'assure que tout le monde est bien", "flegmatique"],
    ["J'organise et je mène la soirée", "colerique"] ] },
  { q: "Quand tu es contrarié(e)…", a: [
    ["Je le dis cash, tout de suite", "colerique"],
    ["Je le garde pour moi et j'analyse", "melancolique"],
    ["Ça passe vite, je passe à autre chose", "sanguin"],
    ["Je garde mon calme et j'attends", "flegmatique"] ] },
  { q: "Ton rôle naturel dans un groupe ?", a: [
    ["L'animateur", "sanguin"],
    ["Le cerveau qui réfléchit", "melancolique"],
    ["Le leader qui décide", "colerique"],
    ["Le médiateur qui apaise", "flegmatique"] ] },
  { q: "Face à un projet important…", a: [
    ["Je me lance, j'ajusterai en route", "sanguin"],
    ["Je prépare un plan détaillé", "melancolique"],
    ["Je pilote avec détermination", "colerique"],
    ["J'avance régulièrement, sans stress", "flegmatique"] ] },
  { q: "Ce qui te fait vibrer chez quelqu'un ?", a: [
    ["Son humour et son énergie", "sanguin"],
    ["Sa profondeur et sa sensibilité", "melancolique"],
    ["Son ambition et sa franc-parler", "colerique"],
    ["Sa douceur et sa stabilité", "flegmatique"] ] },
  { q: "Ton week-end idéal ?", a: [
    ["Sorties, musique, monde", "sanguin"],
    ["Un bon livre et du calme", "melancolique"],
    ["Sport ou défi à relever", "colerique"],
    ["Détente simple avec les proches", "flegmatique"] ] },
  { q: "On te décrit souvent comme…", a: [
    ["Le soleil du groupe", "sanguin"],
    ["La personne de bon conseil", "flegmatique"],
    ["L'idéaliste exigeant", "melancolique"],
    ["Le caractère fort", "colerique"] ] },
  { q: "Dans une dispute de couple…", a: [
    ["Je veux tout régler immédiatement", "colerique"],
    ["J'ai besoin de temps pour digérer", "melancolique"],
    ["Je détends l'atmosphère avec humour", "sanguin"],
    ["J'écoute, puis je propose une solution", "flegmatique"] ] },
  { q: "Tes décisions, tu les prends…", a: [
    ["Au feeling, vite", "sanguin"],
    ["Après mûre réflexion", "melancolique"],
    ["Avec assurance et logique", "colerique"],
    ["En pesant le pour et le contre, cool", "flegmatique"] ] },
  { q: "Ce qui te ressemble le plus ?", a: [
    ["Le feu qui illumine", "sanguin"],
    ["L'océan qui pense", "melancolique"],
    ["L'orage franc", "colerique"],
    ["La montagne stable", "flegmatique"] ] },
  { q: "Ton approche de la nouveauté ?", a: [
    ["J'adore, je fonce !", "sanguin"],
    ["J'observe d'abord, prudemment", "melancolique"],
    ["Je teste si c'est utile", "colerique"],
    ["Je laisse venir, sans pression", "flegmatique"] ] },
];

const personality = {
  step: 0,
  answers: [],

  render() {
    const user = data.currentUser();
    const root = $("#personality-root");
    if (!user) { root.innerHTML = `<div class="empty-card">${icon("info")}<p>Connecte-toi pour passer le test.</p></div>`; return; }

    if (user.personalityDone && user.temperament) {
      personality._renderResult(root, user.temperament, true);
      return;
    }
    personality.step = 0;
    personality.answers = new Array(QUIZ.length).fill(null);
    personality._renderQuestion(root);
  },

  _renderQuestion(root) {
    const i = personality.step;
    const item = QUIZ[i];
    const pct = Math.round((i / QUIZ.length) * 100);
    root.innerHTML = `
      <div class="quiz-card">
        <p class="page-eyebrow">TEST DE PERSONNALITÉ</p>
        <h2 class="page-title">Découvre ton tempérament</h2>
        <p class="page-sub">12 questions pour révéler ta personnalité amoureuse.</p>
        <div class="card">
          <div class="quiz-step">QUESTION ${i + 1} / ${QUIZ.length}</div>
          <div class="quiz-progress"><i style="width:${pct}%"></i></div>
          <h3 class="quiz-q">${esc(item.q)}</h3>
          <div class="quiz-opts">
            ${item.a.map(([text, key], idx) => `
              <button class="quiz-opt ${personality.answers[i] === key ? "selected" : ""}" data-opt="${key}">
                <span class="radio"></span><span>${esc(text)}</span>
              </button>`).join("")}
          </div>
          <div class="quiz-nav">
            <button class="btn btn-ghost" id="quiz-prev" ${i === 0 ? "disabled" : ""}>${icon("chevron-left")} Précédent</button>
            <button class="btn btn-gold" id="quiz-next">${i === QUIZ.length - 1 ? "Voir mon résultat" : "Suivant"} ${icon("chevron-right")}</button>
          </div>
        </div>
      </div>`;

    $$(".quiz-opt", root).forEach((btn) => {
      btn.addEventListener("click", () => {
        personality.answers[i] = btn.dataset.opt;
        $$(".quiz-opt", root).forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
      });
    });
    $("#quiz-prev", root)?.addEventListener("click", () => { if (i > 0) { personality.step--; personality._renderQuestion(root); } });
    $("#quiz-next", root).addEventListener("click", () => {
      if (!personality.answers[i]) return toast("Choisis une réponse pour continuer.", "error");
      if (i < QUIZ.length - 1) { personality.step++; personality._renderQuestion(root); }
      else personality._finish(root);
    });
  },

  _finish(root) {
    const counts = { melancolique: 0, sanguin: 0, colerique: 0, flegmatique: 0 };
    personality.answers.forEach((k) => { if (k) counts[k]++; });
    // conversion en pourcentages pondérés
    const total = QUIZ.length;
    const temperament = {
      melancolique: Math.round((counts.melancolique / total) * 100),
      sanguin: Math.round((counts.sanguin / total) * 100),
      colerique: Math.round((counts.colerique / total) * 100),
      flegmatique: Math.round((counts.flegmatique / total) * 100),
    };
    const user = data.currentUser();
    user.temperament = temperament;
    user.personalityDone = true;
    data.saveCurrentUser(user);
    notifications.push("sparkles", "Résultat du test", "Ton tempérament a été analysé — découvre tes conseils personnalisés !");
    personality._renderResult(root, temperament, false);
    toast("Personnalité enregistrée dans ton profil.", "success");
  },

  _renderResult(root, temperament, alreadyDone) {
    const dominantKey = Object.entries(temperament).sort((a, b) => b[1] - a[1])[0][0];
    const dom = TEMPERAMENTS[dominantKey];
    root.innerHTML = `
      <div class="quiz-card">
        <p class="page-eyebrow">TEST DE PERSONNALITÉ</p>
        <div class="card result-temperament">
          <div class="temperament-badge">${icon(dom.icon)}</div>
          <h2 class="temperament-name">${dom.label}</h2>
          <p class="muted">${alreadyDone ? "Voici ton tempérament enregistré." : "Ton tempérament dominant"}</p>
          <div class="interest-cloud" style="justify-content:center; margin-top:12px">
            ${dom.traits.map((t) => `<span class="tag tag-gold">${esc(t)}</span>`).join("")}
          </div>
          <div class="score-bars">
            ${Object.entries(temperament).map(([k, v]) => `
              <div class="score-bar">
                <span>${TEMPERAMENTS[k].label}</span>
                <span class="track"><i style="width:${v}%"></i></span>
                <b>${v}%</b>
              </div>`).join("")}
          </div>
        </div>
        <div class="card">
          <h3>${icon("heart")} Toi en amour</h3>
          <p class="muted" style="margin:0 0 12px">${dom.love}</p>
          <h3>${icon("sparkles")} Conseil d'Anderson</h3>
          <p class="muted" style="margin:0">${dom.advice}</p>
        </div>
        <div class="flex mt">
          <button class="btn btn-ghost" id="quiz-restart">Repasser le test</button>
          <a class="btn btn-gold" href="#/discover">Voir mes compatibilités</a>
        </div>
      </div>`;
    $("#quiz-restart", root).addEventListener("click", () => {
      const user = data.currentUser();
      user.personalityDone = false; user.temperament = null;
      data.saveCurrentUser(user);
      personality.render();
    });
  },
};
