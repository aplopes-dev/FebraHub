/* FebraHub PWA service worker — enxuto e conservador.
 *
 * Objetivos:
 *  - Tornar o FebraHub COMPLETO instalável e resiliente a quedas de rede
 *    (não só o PDV móvel — o app inteiro roda como PWA a partir da raiz).
 *  - NUNCA cachear /api (dados de sessão/venda precisam ser sempre frescos).
 *  - Navegação (páginas): SEMPRE rede quando online (não cacheia a resposta,
 *    para nunca servir uma página antiga como /pdv-movel); cache só p/ offline.
 *  - Estáticos do Next (/_next/static, ícones): cache-first (imutáveis).
 *
 * Sem libs. Bump em CACHE_VERSION invalida os caches antigos no activate. */
const CACHE_VERSION = "febrahub-pwa-v4";
const APP_SHELL = ["/", "/manifest.webmanifest", "/icons/icon.svg", "/icons/icon-maskable.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL).catch(() => undefined)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((chaves) =>
      Promise.all(chaves.filter((c) => c !== CACHE_VERSION).map((c) => caches.delete(c))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // Só atua na própria origem.
  if (url.origin !== self.location.origin) return;
  // API e healthchecks: sempre rede, nunca cache.
  if (url.pathname.startsWith("/api")) return;

  // Estáticos imutáveis do Next e ícones: cache-first.
  if (url.pathname.startsWith("/_next/static") || url.pathname.startsWith("/icons")) {
    event.respondWith(
      caches.match(req).then((hit) =>
        hit ||
        fetch(req).then((res) => {
          const copia = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, copia));
          return res;
        }),
      ),
    );
    return;
  }

  // Navegação de página: SEMPRE rede quando online; NÃO cacheia a resposta
  // (senão o SW podia "grudar" uma página antiga — ex.: /pdv-movel — e servi-la
  // no lugar da nova). O cache serve apenas de fallback offline do shell "/".
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() =>
        caches.match(req).then((hit) => hit || caches.match("/")),
      ),
    );
  }
});
