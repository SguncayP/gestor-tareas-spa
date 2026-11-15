// Service worker: estrategia de caché pensada para ser segura.
//  - App shell (HTML, manifest, iconos): se guarda al instalar.
//  - /assets/* (archivos con hash en el nombre, inmutables): cache-first.
//  - Navegación: network-first; sin conexión se sirve el index.html guardado.
//  - /api/* y /uploads/*: nunca se guardan (datos privados de cada usuario) ni se interceptan.
const VERSION = 'v1';
const CACHE = 'gestor-tareas-' + VERSION;
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (evento) => {
  evento.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((nombres) => Promise.all(nombres.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (evento) => {
  const peticion = evento.request;
  const url = new URL(peticion.url);

  // Solo se gestionan GET del mismo origen; la API y las imágenes subidas pasan directo a la red
  if (peticion.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/uploads/')) return;

  if (peticion.mode === 'navigate') {
    evento.respondWith(fetch(peticion).catch(() => caches.match('/index.html')));
    return;
  }

  if (url.pathname.startsWith('/assets/')) {
    evento.respondWith(
      caches.match(peticion).then(
        (guardado) =>
          guardado ||
          fetch(peticion).then((respuesta) => {
            if (respuesta.ok) {
              const copia = respuesta.clone();
              caches.open(CACHE).then((cache) => cache.put(peticion, copia));
            }
            return respuesta;
          })
      )
    );
    return;
  }

  evento.respondWith(caches.match(peticion).then((guardado) => guardado || fetch(peticion)));
});
