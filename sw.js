const VERSIONE = 'caf-v1'
const BASE = ['/', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSIONE).then((c) => c.addAll(BASE)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((nomi) => Promise.all(nomi.filter((n) => n !== VERSIONE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  const r = e.request
  const url = new URL(r.url)
  // Solo file dell'app: Supabase e le altre richieste esterne passano sempre dalla rete
  if (r.method !== 'GET' || url.origin !== self.location.origin || url.pathname === '/sw.js') return

  if (r.mode === 'navigate') {
    e.respondWith(
      fetch(r).then((res) => {
        const copia = res.clone()
        caches.open(VERSIONE).then((c) => c.put('/', copia))
        return res
      }).catch(() => caches.match('/'))
    )
    return
  }

  e.respondWith(
    caches.match(r).then((hit) => hit || fetch(r).then((res) => {
      if (res.ok) {
        const copia = res.clone()
        caches.open(VERSIONE).then((c) => c.put(r, copia))
      }
      return res
    }))
  )
})
