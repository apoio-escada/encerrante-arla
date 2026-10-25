// Service worker: deixa o app abrir sem internet e envia a fila quando o sinal volta.
const CACHE = 'encerrante-arla-v3';
const ARQUIVOS = ['./', './index.html', './config.js', './sync.js', './manifest.webmanifest', './icon-192.png', './icon-512.png', './posto.jpg', './logo-icone.png', './logo-pichilau.jpg'];

importScripts('./config.js', './sync.js');

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return; // servidor: sempre direto
  // rede primeiro (pega atualizações), cache se estiver sem sinal
  e.respondWith(
    fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(ca => ca.put(e.request, c)); return r; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./index.html')))
  );
});
async function enviarEAvisar() {
  const r = await self.sincronizarFila();
  const cs = await self.clients.matchAll();
  cs.forEach(c => c.postMessage({ tipo: 'sync', resultado: r }));
  if (r.erro && !r.enviados) throw new Error(r.erro); // faz o navegador tentar de novo
}
self.addEventListener('sync', e => { if (e.tag === 'enviar-encerrantes') e.waitUntil(enviarEAvisar()); });
self.addEventListener('periodicsync', e => { if (e.tag === 'enviar-encerrantes') e.waitUntil(enviarEAvisar().catch(() => {})); });
self.addEventListener('message', e => { if (e.data === 'sincronizar') e.waitUntil(enviarEAvisar().catch(() => {})); });
