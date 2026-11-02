/* ============================================================
   anderson-ai.js — assistant « Anderson » (règles JS locales)
   ⚠️ Ce n'est PAS une vraie IA connectée : réponses de démo.
   Emplacement prévu pour une future API IA sécurisée côté
   serveur — ne jamais mettre de clé secrète ici.
   ============================================================ */

"use strict";

const AI_TOPICS = [
  { id: "love", label: "Conseils amoureux", icon: "heart" },
  { id: "confidence", label: "Améliorer ma confiance", icon: "sparkles" },
  { id: "personality", label: "Comprendre ma personnalité", icon: "user" },
  { id: "communication", label: "Communication dans le couple", icon: "chat" },
  { id: "growth", label: "Développement personnel", icon: "chart" },
  { id: "motivation", label: "Motivation", icon: "sun" },
  { id: "exercise", label: "Exercices de réflexion", icon: "edit" },
  { id: "other", label: "Autre question…", icon: "message" },
];

const AI_ANSWERS = {
  love: [
    "L'amour durable repose sur trois piliers : l'écoute, la cohérence et la bienveillance. Commence par écouter sans préparer ta réponse pendant que l'autre parle.",
    "Un conseil simple et puissant : chaque jour, dis une chose précise que tu apprécies chez la personne. La gratitude nourrit la connexion.",
    "Ne cherche pas la perfection, cherche la compatibilité des valeurs. Pose les questions importantes tôt : famille, projets, visions de la vie.",
  ],
  confidence: [
    "La confiance se construit par de petites promesses tenues à soi-même. Choisis UN objectif de 7 jours et tiens-le.",
    "Remplace « je ne suis pas assez » par « je suis en progrès ». Le dialogue intérieur façonne la réalité.",
    "Tiens-toi droit, souris, marche lentement : le langage corporel influence l'état d'esprit en moins de 2 minutes.",
  ],
  personality: [
    "Quatre tempéraments classiques : mélancolique (profond), sanguin (solaire), colérique (déterminé), flegmatique (stable). Passe le test dans l'app pour découvrir le tien !",
    "Comprendre ton tempérament, c'est comprendre tes besoins relationnels. Un sanguin a besoin d'échange, un mélancolique de profondeur, un colérique d'action, un flegmatique de calme.",
    "Deux tempéraments différents peuvent être complémentaires : la clé est de nommer les besoins plutôt que de juger les différences.",
  ],
  communication: [
    "Règle d'or : parle en « je » plutôt qu'en « tu ». « Je me sens inquiet quand… » désamorce, « Tu ne fais jamais… » attaque.",
    "Avant une conversation importante, écris ce que tu veux dire, ce que tu ressens et ce dont tu as besoin. Trois points, pas plus.",
    "Le silence n'est pas un ennemi : parfois une pause de 10 minutes sauve une soirée entière.",
  ],
  growth: [
    "Un exercice puissant : chaque soir, note 3 choses qui ont bien marché. En 30 jours, ton regard sur ta vie change.",
    "Investis dans toi comme tu investirais dans une relation : temps, attention, patience.",
    "Le développement personnel n'est pas devenir parfait, c'est devenir conscient de ses choix.",
  ],
  motivation: [
    "La motivation suit l'action, pas l'inverse. Commence par 5 minutes seulement — le reste suivra.",
    "Rappelle-toi pourquoi tu as commencé. Écris cette raison et garde-la visible.",
    "Les petits progrès quotidiens composent les grandes transformations. Célèbre chaque pas.",
  ],
  exercise: [
    "Exercice 5-4-3-2-1 : note 5 choses que tu vois, 4 que tu touches, 3 que tu entends, 2 que tu sens, 1 que tu goûtes. Cela ancre dans l'instant présent.",
    "Question de réflexion du jour : « Qu'est-ce qu'une relation saine me ferait ressentir ? » Écris ta réponse sans filtre.",
    "Imagine ta vie dans 3 ans avec la relation idéale. Décris une journée type. Quels comportements peux-tu adopter dès maintenant ?",
  ],
  other: [
    "Bonne question ! Dans cette démo, mes réponses suivent des règles prédéfinies. Choisis un sujet ci-dessus pour des conseils ciblés.",
    "Je suis Anderson, ton assistant de démonstration. Pour les sujets de couple, cœur et confiance, je suis là ! 💚",
    "Note dans un carnet ce qui te préoccupe, puis reformule-le en une question simple. Tu verras souvent la réponse apparaître.",
  ],
};

const andersonAI = {
  init() {
    const root = $("#ai-topics");
    root.innerHTML = AI_TOPICS.map((t) =>
      `<button class="chip" data-topic="${t.id}">${icon(t.icon)} ${esc(t.label)}</button>`).join("");
    $$("[data-topic]", root).forEach((b) =>
      b.addEventListener("click", () => andersonAI.askTopic(b.dataset.topic)));

    $("#ai-send").innerHTML = icon("send");
    $("#ai-send").addEventListener("click", () => andersonAI.send());
    $("#ai-input").addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); andersonAI.send(); }
    });

    if (!$("#ai-messages").children.length) {
      andersonAI._addBubble("them",
        "Bonjour ! Je suis Anderson, ton assistant personnel. Comment puis-je t'aider aujourd'hui ? 💚", false);
    }
  },

  render() { /* l'init suffit : la conversation persiste en mémoire */ },

  askTopic(topicId) {
    const topic = AI_TOPICS.find((t) => t.id === topicId);
    if (!topic) return;
    andersonAI._addBubble("me", topic.label, false);
    andersonAI._reply(() =>
      AI_ANSWERS[topic.id][Math.floor(Math.random() * AI_ANSWERS[topic.id].length)]);
  },

  send() {
    const input = $("#ai-input");
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    andersonAI._addBubble("me", text, false);
    const t = text.toLowerCase();
    const pick = (k) => AI_ANSWERS[k][Math.floor(Math.random() * AI_ANSWERS[k].length)];
    let answer;
    if (/amour|relation|coup|aimer|match/.test(t)) answer = pick("love");
    else if (/confiance|timide|peur/.test(t)) answer = pick("confidence");
    else if (/personnalit|tempérament|temperament|caractère|caractere/.test(t)) answer = pick("personality");
    else if (/communication|parler|dispute|conflit/.test(t)) answer = pick("communication");
    else if (/motive|motivation|courage|abandon/.test(t)) answer = pick("motivation");
    else if (/exercice|réflexion|reflexion|méditer|stress/.test(t)) answer = pick("exercise");
    else answer = pick("other");
    andersonAI._reply(() => answer);
  },

  _reply(getText) {
    const box = $("#ai-messages");
    const typing = document.createElement("div");
    typing.className = "bubble them typing";
    typing.innerHTML = "<i></i><i></i><i></i>";
    box.appendChild(typing);
    box.scrollTop = box.scrollHeight;
    setTimeout(() => {
      typing.remove();
      andersonAI._addBubble("them", getText(), true);
    }, 1000 + Math.random() * 800);
  },

  _addBubble(from, text, notify) {
    const box = $("#ai-messages");
    const div = document.createElement("div");
    div.className = `bubble ${from === "me" ? "me" : "them"}`;
    div.textContent = text;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
    if (notify) notifications.push("robot", "Réponse d'Anderson", text.slice(0, 70) + (text.length > 70 ? "…" : ""));
  },
};
