/* ============================================================
   translation.js — traduction de démonstration (hors ligne)
   Dictionnaire limité : signaler clairement la limitation.
   Architecture prête pour brancher une vraie API plus tard
   (remplacer translate() par un appel fetch côté serveur).
   ============================================================ */

"use strict";

const LANGS = {
  ht: "Créole haïtien",
  fr: "Français",
  en: "Anglais",
  es: "Espagnol",
  pt: "Portugais",
};

// Dictionnaire : phrase normalisée (français) -> par langue
const DICT = {
  "bonjour": { ht: "Bonjou", en: "Hello", es: "Hola", pt: "Olá" },
  "salut, comment ça va ?": { ht: "Salit, kijan ou ye ?", en: "Hi, how are you?", es: "Hola, ¿cómo estás?", pt: "Oi, como você está?" },
  "salut comment ca va ?": { ht: "Salit, kijan ou ye ?", en: "Hi, how are you?", es: "Hola, ¿cómo estás?", pt: "Oi, como você está?" },
  "ça va bien, merci": { ht: "Mwen byen, mèsi", en: "I'm fine, thank you", es: "Estoy bien, gracias", pt: "Estou bem, obrigado(a)" },
  "ca va bien merci": { ht: "Mwen byen, mèsi", en: "I'm fine, thank you", es: "Estoy bien, gracias", pt: "Estou bem, obrigado(a)" },
  "je t'aime": { ht: "Mwen renmen ou", en: "I love you", es: "Te quiero", pt: "Eu te amo" },
  "tu es très belle": { ht: "Ou trè bèl", en: "You are very beautiful", es: "Eres muy hermosa", pt: "Você é muito linda" },
  "tu es très beau": { ht: "Ou trè bèl", en: "You are very handsome", es: "Eres muy guapo", pt: "Você é muito bonito" },
  "on se voit bientôt ?": { ht: "N ap wè nan ti tan ?", en: "Shall we meet soon?", es: "¿Nos vemos pronto?", pt: "Nos vemos em breve?" },
  "on se voit bientot ?": { ht: "N ap wè nan ti tan ?", en: "Shall we meet soon?", es: "¿Nos vemos pronto?", pt: "Nos vemos em breve?" },
  "merci pour ton message": { ht: "Mèsi pou mesaj ou a", en: "Thanks for your message", es: "Gracias por tu mensaje", pt: "Obrigado pela sua mensagem" },
  "quelle est ta musique préférée ?": { ht: "Ki mizik ou renmen anpil ?", en: "What's your favorite song?", es: "¿Cuál es tu canción favorita?", pt: "Qual é a sua música favorita?" },
  "bonne journée": { ht: "Bon jounen", en: "Have a good day", es: "Que tengas un buen día", pt: "Tenha um bom dia" },
  "je pense à toi": { ht: "Mwen ap panse a ou", en: "I'm thinking of you", es: "Pienso en ti", pt: "Estou pensando em você" },
  "voulez-vous danser avec moi ?": { ht: "Èske ou vle danse avè mwen ?", en: "Would you like to dance with me?", es: "¿Quieres bailar conmigo?", pt: "Quer dançar comigo?" },
  "ravi de te rencontrer": { ht: "Mwen kontan rankontre ou", en: "Nice to meet you", es: "Encantado de conocerte", pt: "Prazer em conhecer você" },
  "bonne nuit": { ht: "Bòn nwi", en: "Good night", es: "Buenas noches", pt: "Boa noite" },
  "à très vite": { ht: "A trè byento", en: "See you very soon", es: "Hasta muy pronto", pt: "Até logo" },
  "a tres vite": { ht: "A trè byento", en: "See you very soon", es: "Hasta muy pronto", pt: "Até logo" },
};

// Mots simples (remplacement à l'intérieur d'une phrase non reconnue)
const WORDS = {
  "merci": { ht: "mèsi", en: "thank you", es: "gracias", pt: "obrigado" },
  "bonjour": { ht: "bonjou", en: "hello", es: "hola", pt: "olá" },
  "amour": { ht: "lanmou", en: "love", es: "amor", pt: "amor" },
  "coeur": { ht: "kè", en: "heart", es: "corazón", pt: "coração" },
  "oui": { ht: "wi", en: "yes", es: "sí", pt: "sim" },
  "non": { ht: "non", en: "no", es: "no", pt: "não" },
  "bien": { ht: "byen", en: "well", es: "bien", pt: "bem" },
  "moi": { ht: "mwen", en: "me", es: "yo", pt: "eu" },
  "toi": { ht: "ou", en: "you", es: "tú", pt: "você" },
};

const translation = {
  /**
   * Traduit un texte. Retourne { text, exact } :
   * exact=true → phrase trouvée au dictionnaire ; sinon mot-à-mot partiel.
   */
  translate(text, from, to) {
    const clean = text.trim();
    if (!clean) return { text: "", exact: false };
    if (from === to) return { text: clean, exact: true };
    const key = clean.toLowerCase().replace(/[.!]+$/u, "");
    const hit = DICT[key];
    if (hit && hit[to]) return { text: hit[to], exact: true };
    // remplacement partiel mot-à-mot
    let out = clean;
    let replaced = 0;
    Object.entries(WORDS).forEach(([w, t]) => {
      const rx = new RegExp(`\\b${w}\\b`, "giu");
      if (rx.test(out) && t[to]) { out = out.replace(rx, t[to]); replaced++; }
    });
    return { text: out, exact: replaced >= 2 };
  },
};
