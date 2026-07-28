const CACHE_NAME = 'camper-app-v2';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // Non intercettare i blob URL: sono usati per i download (es. backup).
  if(req.url.startsWith('blob:')) return;
  // Intercetta solo richieste GET dello stesso dominio (pagina, JS, CSS, icone).
  // Tutto il resto (chiamate POST di Firebase, richieste di estensioni del browser,
  // domini esterni) viene lasciato passare intatto: intercettarle causava errori
  // e poteva interferire con la connessione in tempo reale di Firebase.
  if(req.method !== 'GET' || new URL(req.url).origin !== self.location.origin){
    return;
  }
  event.respondWith(
    fetch(req)
      .then(res => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, resClone)).catch(()=>{});
        return res;
      })
      .catch(() => caches.match(req).then(cached => cached || Response.error()))
  );
});
