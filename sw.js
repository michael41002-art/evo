// Offline cache: the app shell and images load from the cache, then refresh in the background.
const CACHE='evo-v1';
const SHELL=['./','index.html','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png',
 'img/allopoly.webp','img/arctic.webp','img/autopoly.webp','img/cichlids.webp','img/crickets.webp','img/damselfly.webp','img/darwin-tree.webp',
 'img/dogs.webp','img/embryos.webp','img/finches.webp','img/fossils.webp','img/frogs.webp','img/gondwana.webp','img/honeycreepers.webp',
 'img/kittens.webp','img/limbs.webp','img/oaks.webp','img/owls.webp','img/oxygen.webp','img/pollinators.webp','img/tree-of-life.webp','img/vents.webp'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET')return;
  if(u.hostname.endsWith('script.google.com')||u.hostname.endsWith('googleusercontent.com'))return; // sync: always network
  e.respondWith(caches.open(CACHE).then(async c=>{
    const hit=await c.match(e.request,{ignoreSearch:u.origin===location.origin});
    const net=fetch(e.request).then(r=>{if(r&&(r.ok||r.type==='opaque'))c.put(e.request,r.clone());return r}).catch(()=>hit);
    return hit||net;
  }));
});
