const CACHE_NAME = 'ivan-portfolio-cache-v1';
const GITHUB_API_CACHE = 'github-api-cache-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  // NOTE: Le CSS est en partie inline. Si vous l'externalisez, ajoutez-le ici.
  // '/style.css',
  // NOTE: Le JS principal est aussi inline.
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
  'icons/icon-192x192.png',
  'icons/icon-512x512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Stratégie Stale-While-Revalidate pour l'API GitHub
  if (url.hostname === 'api.github.com') {
    event.respondWith(
      caches.open(GITHUB_API_CACHE).then(cache => {
        return cache.match(request).then(cachedResponse => {
          const fetchPromise = fetch(request).then(networkResponse => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
          // Retourne la réponse du cache si disponible, sinon attend la réponse réseau.
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Stratégie Cache First pour les ressources statiques
  event.respondWith(
    caches.match(request)
      .then(response => {
        if (response) {
          return response; // Si la ressource est dans le cache, on la retourne
        }
        return fetch(request); // Sinon, on la récupère du réseau
      }
    )
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME, GITHUB_API_CACHE];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
