const CACHE_NAME = 'kiosco-c5-v1';
const APP_SHELL = [
  './','./index.html','./memorama.html','./despachador.html','./coloreando.html',
  './manifest.json','./css/main.css','./css/memorama.css','./css/despachador.css','./css/dibujo.css',
  './js/utils.js','./js/memorama.js','./js/despachador.js','./js/coloreando.js',
  './assets/logos/logo-911.png','./assets/logos/logo-c5.png',
  './assets/icons/icon-180.png','./assets/icons/icon-192.png','./assets/icons/icon-512.png',
  './assets/audio/acierto.mp3','./assets/audio/BURBUJA.mp3','./assets/audio/click.mp3','./assets/audio/error.mp3','./assets/audio/musica-coloreando.mp3','./assets/audio/musica-fondo.mp3','./assets/audio/victoria.mp3'
];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(APP_SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then(hit => hit || fetch(event.request).then(response => {
    const copy=response.clone(); caches.open(CACHE_NAME).then(c=>c.put(event.request,copy)); return response;
  }).catch(()=>caches.match('./index.html'))));
});
