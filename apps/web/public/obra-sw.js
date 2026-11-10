const shellCache = 'obracerta-shell-v1';
const scope = new URL(self.registration.scope);
const entry = new URL('index.html', scope).href;

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(shellCache);
    const response = await fetch(entry, { cache: 'reload' });
    if (!response.ok) throw new Error('Falha ao carregar a interface.');
    const html = await response.clone().text();
    const assets = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)]
      .map((match) => new URL(match[1], scope))
      .filter((url) => url.origin === scope.origin);
    await cache.addAll(assets.map((url) => url.href));
    await cache.put(entry, response);
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;

  if (request.mode === 'navigate') {
    if (url.pathname.includes('/api/')) return;
    event.respondWith(fetch(request).catch(async () => (await caches.match(entry)) ?? Response.error()));
    return;
  }
  if (!['script', 'style', 'font', 'image'].includes(request.destination) || url.pathname.includes('/api/')) return;
  event.respondWith(fetch(request).then(async (response) => {
    if (response.ok && response.type === 'basic') {
      const cache = await caches.open(shellCache);
      await cache.put(request, response.clone());
    }
    return response;
  }).catch(async () => (await caches.match(request)) ?? Response.error()));
});
