/* ============================================================
   chat.js — messagerie locale de démonstration
   Les « réponses » des profils sont simulées par des règles
   JS. Aucun message ne quitte jamais cet appareil.
   ============================================================ */

"use strict";

const EMOJIS = ["😊", "😍", "😂", "🥰", "😘", "😉", "🌹", "✨", "❤️", "🙏", "👍", "😎", "🎵", "☀️", "💚", "🤗"];

const REPLIES = {
  greeting: ["Bonjour ! Ravi(e) de te lire 😊", "Salut ! Comment tu vas ?", "Hey ! Enchanté(e) de discuter avec toi."],
  question: ["Bonne question… je dirais oui !", "Hmm, laisse-moi y penser 😄", "Je te réponds très vite, promis !"],
  love: ["C'est très gentil, merci ❤️", "Tu sais faire sourire, toi 😊", "Stop, tu vas me faire rougir…"],
  date: ["Avec plaisir ! Quand tu veux.", "J'aimerais beaucoup 😊 Dis-moi quand.", "D'accord, proposons un jour ensemble."],
  music: ["J'adore la kompa ! Et toi ?", "En ce moment j'écoute tout le temps du zouk 🎵", "La musique, c'est ma vie."],
  default: ["Haha, je vois 😄", "Intéressant ! Raconte-moi plus.", "Je suis d'accord avec toi.", "Merci pour ton message 🥰", "On devrait se raconter ça en vrai !"],
};

const chat = {
  activeId: null,

  init() {
    $("#chat-send").innerHTML = icon("send");
    $("#chat-emoji-btn").innerHTML = icon("smile");
    $("#chat-translate-btn").innerHTML = icon("translate");
    $("#btn-chat-back").innerHTML = icon("arrow-left");

    $("#chat-send").addEventListener("click", chat.send);
    $("#chat-input").addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); chat.send(); }
    });
    $("#chat-input").addEventListener("input", (e) => {
      e.target.style.height = "auto";
      e.target.style.height = Math.min(110, e.target.scrollHeight) + "px";
    });
    $("#chat-emoji-btn").addEventListener("click", chat._emojiSheet);
    $("#chat-translate-btn").addEventListener("click", chat._translateSheet);
    $("#btn-chat-back").addEventListener("click", () => {
      $("#chat-layout").classList.remove("show-conv");
      history.replaceState(null, "", "#/chat");
    });
  },

  /** Crée une conversation initiale si absente. */
  seedConversation(profileId) {
    const convs = data.conversations();
    if (!convs[profileId]) {
      const profile = demoProfile(profileId);
      convs[profileId] = {
        id: profileId,
        messages: [{
          from: "them",
          text: profileId === "david" ? "On se voit bientôt ?" : `Salut ! Content(e) qu'on se soit matchés 😊`,
          at: timeNow(), status: "read",
        }],
        unread: profileId === "david" ? 1 : 0,
        updatedAt: timeNow(),
      };
      data.saveConversations(convs);
    }
  },

  list() {
    const convs = Object.values(data.conversations())
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    const root = $("#chat-list");
    if (!convs.length) {
      root.innerHTML = `<div class="empty-card" style="margin:14px">${icon("chat")}<p>Aucune conversation.<br>Like un profil pour démarrer !</p></div>`;
      return;
    }
    root.innerHTML = `<div class="chat-list-head"><h3>Messagerie</h3></div>` + convs.map((c) => {
      const p = demoProfile(c.id);
      const last = c.messages[c.messages.length - 1];
      return `
        <div class="conv-item ${c.id === chat.activeId ? "active" : ""}" data-conv="${c.id}" role="button" tabindex="0">
          <img src="${p.photo}" alt="${esc(p.name)}">
          <div class="ci-body">
            <div class="ci-top"><span class="ci-name">${esc(p.name)}</span><span class="ci-time">${fmtTime(c.updatedAt)}</span></div>
            <div class="ci-last">${esc(last ? last.text.slice(0, 42) : "…")}</div>
          </div>
          ${c.unread ? `<span class="unread">${c.unread}</span>` : ""}
        </div>`;
    }).join("");
    $$("[data-conv]", root).forEach((el) => {
      el.addEventListener("click", () => { location.hash = "#/chat/" + el.dataset.conv; });
    });
  },

  open(profileId) {
    chat.activeId = profileId;
    chat.seedConversation(profileId);
    const p = demoProfile(profileId);
    const convs = data.conversations();
    convs[profileId].unread = 0;
    data.saveConversations(convs);

    $("#chat-head").innerHTML = `
      <img src="${p.photo}" alt="">
      <div style="flex:1">
        <div class="ch-name">${esc(p.name)}, ${p.age}</div>
        <div class="ch-status ${p.online ? "" : "away"}">${p.online ? "En ligne" : "Hors ligne"} · conversation locale</div>
      </div>
      <button class="btn-icon" id="chat-profile-btn" title="Voir le profil">${icon("user")}</button>
      <button class="btn-icon" id="chat-del-btn" title="Supprimer la conversation">${icon("trash")}</button>`;
    $("#chat-profile-btn").addEventListener("click", () => chat._profileSheet(p));
    $("#chat-del-btn").addEventListener("click", chat._deleteConv);

    $("#chat-layout").classList.add("show-conv");
    chat._renderMessages();
    chat.list();
  },

  _renderMessages() {
    const root = $("#chat-messages");
    const conv = data.conversations()[chat.activeId];
    if (!conv) { root.innerHTML = ""; return; }
    root.innerHTML = conv.messages.map((m) => `
      <div class="bubble ${m.from === "me" ? "me" : "them"} ${m.translated ? "translated" : ""}">
        ${esc(m.text)}
        ${m.translation ? `<div class="small" style="opacity:.75; margin-top:4px">↳ ${esc(m.translation)}</div>` : ""}
        <span class="bubble-time">${fmtTime(m.at)}${m.from === "me" ? (m.status === "read" ? " · Lu" : m.status === "delivered" ? " · Reçu" : " · Envoyé") : ""}</span>
      </div>`).join("");
    root.scrollTop = root.scrollHeight;
  },

  send() {
    const input = $("#chat-input");
    const text = input.value.trim();
    if (!text || !chat.activeId) return;
    const convs = data.conversations();
    const conv = convs[chat.activeId];
    conv.messages.push({ from: "me", text, at: timeNow(), status: "sent" });
    conv.updatedAt = timeNow();
    data.saveConversations(convs);
    input.value = ""; input.style.height = "auto";
    chat._renderMessages();

    // Simuler « reçu » puis « réponse » du profil démo
    setTimeout(() => {
      const c2 = data.conversations()[chat.activeId];
      const mine = c2.messages.filter((m) => m.from === "me").pop();
      if (mine && mine.status === "sent") { mine.status = "delivered"; data.saveConversations(data.conversations()); chat._renderMessages(); }
    }, 900);
    setTimeout(() => chat._autoReply(text), 1800 + Math.random() * 1200);
  },

  _autoReply(userText) {
    if (!chat.activeId) return;
    const convs = data.conversations();
    const conv = convs[chat.activeId];
    if (!conv) return;
    const mine = conv.messages.filter((m) => m.from === "me").pop();
    if (mine) mine.status = "read";

    const t = userText.toLowerCase();
    let pool = REPLIES.default;
    if (/bonjour|salut|hello|bonsoir|hey/.test(t)) pool = REPLIES.greeting;
    else if (/\?/.test(t)) pool = REPLIES.question;
    else if (/j'aime|adore|❤|❤️|coeur/.test(t)) pool = REPLIES.love;
    else if (/voir|rendez-vous|retrouver|rencontrer|date|bient[oô]t/.test(t)) pool = REPLIES.date;
    else if (/musique|chanson|zouk|kompa/.test(t)) pool = REPLIES.music;

    const reply = pool[Math.floor(Math.random() * pool.length)];
    conv.messages.push({ from: "them", text: reply, at: timeNow(), status: "read" });
    conv.updatedAt = timeNow();
    data.saveConversations(convs);
    notifications.push("message", "Nouveau message", `${demoProfile(chat.activeId).name} : ${reply.slice(0, 60)}`);
    chat._renderMessages();
    chat.list();
    app.refreshBadges();
  },

  _emojiSheet() {
    const sheet = openSheet(`
      <h3>Emojis</h3>
      <div class="scroll-x wrap" style="font-size:26px; gap:8px; margin-top:10px">
        ${EMOJIS.map((e) => `<button class="chip" data-emoji="${e}" style="font-size:22px; padding:8px 12px">${e}</button>`).join("")}
      </div>`);
    $$("[data-emoji]", sheet).forEach((b) => b.addEventListener("click", () => {
      const input = $("#chat-input");
      input.value += b.dataset.emoji;
      closeSheet();
      input.focus();
    }));
  },

  _translateSheet() {
    const conv = data.conversations()[chat.activeId];
    const last = conv?.messages[conv.messages.length - 1];
    const sheet = openSheet(`
      <h3>${icon("translate")} Traduction de démonstration</h3>
      <p class="sheet-text">Dictionnaire local limité (18 phrases + mots courants). Une version complète nécessiterait une API de traduction côté serveur — aucune clé ne doit figurer ici.</p>
      <div class="field">
        <label>Texte à traduire</label>
        <textarea class="input" id="tr-src" rows="2" placeholder="Ex. : Bonjour, comment ça va ?">${last ? esc(last.text) : ""}</textarea>
      </div>
      <div class="form-grid">
        <div class="field">
          <label>Source</label>
          <select class="input" id="tr-from">${Object.entries(LANGS).map(([k, v]) => `<option value="${k}" ${k === "fr" ? "selected" : ""}>${v}</option>`).join("")}</select>
        </div>
        <div class="field">
          <label>Cible</label>
          <select class="input" id="tr-to">${Object.entries(LANGS).map(([k, v]) => `<option value="${k}" ${k === "ht" ? "selected" : ""}>${v}</option>`).join("")}</select>
        </div>
      </div>
      <div class="field">
        <label>Résultat</label>
        <textarea class="input" id="tr-out" rows="2" readonly placeholder="Le résultat apparaîtra ici…"></textarea>
        <span class="small muted" id="tr-note"></span>
      </div>
      <div class="sheet-actions">
        <button class="btn btn-ghost" data-sheet-close>Fermer</button>
        <button class="btn btn-ghost" id="tr-copy">${icon("copy")} Copier</button>
        <button class="btn btn-gold" id="tr-go">Traduire</button>
      </div>`);
    $("#tr-go").addEventListener("click", () => {
      const res = translation.translate($("#tr-src").value, $("#tr-from").value, $("#tr-to").value);
      $("#tr-out").value = res.text || "(aucun résultat)";
      $("#tr-note").textContent = res.exact
        ? "Traduction trouvée au dictionnaire de démo."
        : "Traduction partielle (mot-à-mot) — résultat indicatif uniquement.";
      // option : envoyer la traduction dans la conversation
      if ($("#tr-out").value && conv) {
        const btn = document.createElement("button");
        btn.className = "btn btn-ghost btn-sm btn-block mt";
        btn.innerHTML = `${icon("send")} Envoyer la traduction dans la conversation`;
        btn.addEventListener("click", () => {
          const convs = data.conversations();
          convs[chat.activeId].messages.push({
            from: "me", text: $("#tr-src").value.trim(),
            translation: $("#tr-out").value, translated: true,
            at: timeNow(), status: "sent",
          });
          convs[chat.activeId].updatedAt = timeNow();
          data.saveConversations(convs);
          closeSheet();
          chat._renderMessages();
          setTimeout(() => chat._autoReply("merci"), 1600);
        });
        $(".sheet-actions", sheet.parentElement).before(btn);
      }
    });
    $("#tr-copy").addEventListener("click", async () => {
      const out = $("#tr-out").value;
      if (!out) return toast("Rien à copier pour l'instant.", "error");
      try { await navigator.clipboard.writeText(out); toast("Traduction copiée.", "success"); }
      catch { toast("Copie impossible dans ce navigateur.", "error"); }
    });
  },

  _profileSheet(p) {
    const user = data.currentUser();
    const compat = matching.compute(user, p);
    const sheet = openSheet(`
      <h3>${esc(p.name)}, ${p.age}</h3>
      <p class="sheet-text">${icon("map-pin")} ${esc(p.city)} · ${p.languages.join(", ")}</p>
      <div class="flex mb">
        <span class="compat-pill">${compat.score}% compatible</span>
        ${p.verified ? `<span class="tag tag-gold">${icon("check")} Vérifié · démo</span>` : ""}
      </div>
      <p class="muted" style="font-size:13.5px">${esc(p.bio)}</p>
      <div class="interest-cloud mt">${p.interests.map((i) => `<span class="tag">${esc(i)}</span>`).join("")}</div>
      <div class="sheet-actions">
        <button class="btn btn-ghost" id="sh-block">${icon("ban")} Bloquer</button>
        <button class="btn btn-ghost" id="sh-report">${icon("flag")} Signaler</button>
        <button class="btn btn-gold" data-sheet-close>Fermer</button>
      </div>`);
    $("#sh-block").addEventListener("click", async () => {
      closeSheet();
      if (await confirmSheet({ title: "Bloquer ce profil ?", text: `${p.name} disparaîtra de ta découverte et de tes conversations locales.`, confirm: "Bloquer", danger: true })) {
        const blocks = data.blocks(); blocks.push(p.id); data.saveBlocks(blocks);
        toast(`${p.name} a été bloqué (démo locale).`, "success");
        location.hash = "#/chat";
      }
    });
    $("#sh-report").addEventListener("click", () => {
      closeSheet();
      app.reportProfile(p.id);
    });
  },

  async _deleteConv() {
    const p = demoProfile(chat.activeId);
    if (await confirmSheet({
      title: "Supprimer la conversation ?",
      text: `Tous les messages échangés avec ${p.name} seront effacés de ce navigateur.`,
      confirm: "Supprimer", danger: true,
    })) {
      const convs = data.conversations();
      delete convs[chat.activeId];
      data.saveConversations(convs);
      chat.activeId = null;
      $("#chat-head").innerHTML = "";
      $("#chat-messages").innerHTML = "";
      $("#chat-layout").classList.remove("show-conv");
      chat.list();
      toast("Conversation supprimée.", "success");
    }
  },
};
