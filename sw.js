"use strict";

const CACHE_NAME = "trainingsplan-v16";
const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./js/ai-package.js",
  "./js/app.js",
  "./js/calendar.js",
  "./js/dom.js",
  "./js/format.js",
  "./js/log.js",
  "./js/log-storage.js",
  "./js/plan.js",
  "./js/ui-ai.js",
  "./js/ui-backup.js",
  "./js/ui-exercise.js",
  "./js/ui-info.js",
  "./js/ui-log-panel.js",
  "./js/ui-workout.js",
  "./plan.json",
  "./plan-anleitung.md",
  "./manifest.webmanifest",
  "./icons/apple-touch-icon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-192.png",
  "./icons/icon-maskable-512.png"
];

// Inhalte, die sich ohne App-Update ändern dürfen: bei Netz immer frisch (network-first), ohne
// Netz oder bei zu langsamer Antwort aus dem Cache. Für sie muss CACHE_NAME nicht hochgezählt werden.
const NETWORK_FIRST = ["plan.json", "plan-anleitung.md"];
// So lange wird auf das Netz gewartet, bevor der Stand aus dem Cache gilt (Millisekunden)
const NETWORK_TIMEOUT_MS = 4000;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => Promise.all(
      cacheNames
        .filter((cacheName) => cacheName.startsWith("trainingsplan-") && cacheName !== CACHE_NAME)
        .map((cacheName) => caches.delete(cacheName))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  if (NETWORK_FIRST.some((name) => new URL(request.url).pathname.endsWith(`/${name}`))) {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(request).catch((error) => {
        if (request.mode === "navigate") {
          return caches.match("./index.html").then((offlinePage) => {
            if (offlinePage) return offlinePage;
            throw error;
          });
        }
        throw error;
      });
    })
  );
});

function networkFirst(request) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), NETWORK_TIMEOUT_MS);
  const fromCache = (fallback) => caches.match(request).then((cachedResponse) => cachedResponse ?? fallback());
  return fetch(request, { cache: "no-cache", signal: controller.signal })
    .then((response) => {
      clearTimeout(timer);
      if (!response.ok) return fromCache(() => response);
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      return response;
    })
    .catch((error) => {
      clearTimeout(timer);
      return fromCache(() => { throw error; });
    });
}
