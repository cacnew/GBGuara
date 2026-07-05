// Service worker mínimo (Fase 8.6): cacheia apenas o app shell (ícones,
// manifest e uma página de fallback) para a navegação não quebrar
// completamente offline. Sem sincronização/cache de dados — todo dado
// real continua exigindo rede (Supabase).

const CACHE_NAME = "nexusdojo-shell-v1";
const SHELL_URLS = [
  "/offline.html",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;

  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match("/offline.html").then((cached) => cached ?? Response.error()),
    ),
  );
});
