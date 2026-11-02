/* ANDERSON THE BEST FRIEND — service worker (hors ligne) */
"use strict";

const VERSION = "atbf-v1";
const SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./assets/css/themes.css",
  "./assets/css/styles.css",
  "./assets/css/responsive.css",
  "./assets/js/storage.js",
  "./assets/js/translation.js",
  "./assets/js/auth.js",
  "./assets/js/profile.js",
  "./assets/js/personality.js",
  "./assets/js/matching.js",
  "./assets/js/discovery.js",
  "./assets/js/chat.js",
  "./assets/js/anderson-ai.js",
  "./assets/js/notifications.js",
  "./assets/js/premium.js",
  "./assets/js/admin.js",
  "./assets/js/app.js",
  "./assets/images/logo.svg",
  "./assets/images/icons/icon.svg",
  "./assets/images/couple.png",
  "./assets/images/anderson-bot.png",
  "./assets/images/profiles/marie.png",
  "./assets/images/profiles/david.png",
  "./assets/images/profiles/jenny.png",
  "./assets/images/profiles/alex.png",
  "./assets/images/profiles/sophia.png",
  "./assets/images/profiles/james.png",
  "./assets/images/profiles/sarah.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Laisse passer les requêtes externes (ex. polices Google) en réseau
  if (url.origin !== self.location.origin) return;

  // Stratégie réseau d'abord, cache en secours (application vivante)
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(VERSION).then((cache) => cache.put(request, copy));
        }
        return res;
      })
      .catch(async () => {
        const cached = await caches.match(request, { ignoreSearch: true });
        if (cached) return cached;
        if (request.mode === "navigate") {
          const shell = await caches.match("./index.html");
          if (shell) return shell;
        }
        return Response.error();
      })
  );
});
