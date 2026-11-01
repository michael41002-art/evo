// Offline cache: the app shell and images load from the cache, then refresh in the background.
const CACHE='evo-v13';
const SYNC_DEFAULT='https://script.google.com/macros/s/AKfycbwGq0VAIy4YE9NWPalbeyqefTW4mzGWDF8DUts6RSU79AMyEbxkhUhW8mW1T8KNCy-o/exec';
const SHELL=['./','index.html','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png',
 'img/allopoly.webp','img/arctic.webp','img/autopoly.webp','img/cichlids.webp','img/crickets.webp','img/damselfly.webp','img/darwin-tree.webp',
 'img/dogs.webp','img/embryos.webp','img/finches.webp','img/fossils.webp','img/frogs.webp','img/gondwana.webp','img/honeycreepers.webp',
 'img/kittens.webp','img/limbs.webp','img/oaks.webp','img/owls.webp','img/oxygen.webp','img/pollinators.webp','img/tree-of-life.webp','img/vents.webp'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE&&k!=='evo-cfg').map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET')return;
  if(u.hostname.endsWith('script.google.com')||u.hostname.endsWith('googleusercontent.com'))return; // sync: always network
  e.respondWith(caches.open(CACHE).then(async c=>{
    const hit=await c.match(e.request,{ignoreSearch:u.origin===location.origin});
    const net=fetch(e.request,{cache:'no-cache'}).then(r=>{if(r&&(r.ok||r.type==='opaque'))c.put(e.request,r.clone());return r}).catch(()=>hit);
    return hit||net;
  }));
});

// Reminders: the push carries no text, so ask the sync server what to show.
async function syncUrl(){try{const r=await (await caches.open('evo-cfg')).match('cfg');if(r){const j=await r.json();if(j.sync)return j.sync}}catch(e){}return SYNC_DEFAULT}
self.addEventListener('push',e=>{
  e.waitUntil((async()=>{
    let n={title:'חזרות אבולוציה',body:'הגיע הזמן לחזרות של היום.',url:'./'};
    try{const r=await fetch(await syncUrl(),{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'notice'})});
      const j=await r.json();if(j&&j.notice&&j.notice.body)n=Object.assign(n,j.notice)}catch(err){}
    await self.registration.showNotification(n.title,{body:n.body,icon:'icons/icon-192.png',badge:'icons/icon-192.png',tag:'evo-reminder',renotify:true,lang:'he',dir:'rtl',data:{url:n.url||'./'}});
  })());
});
self.addEventListener('notificationclick',e=>{
  e.notification.close();
  const url=new URL((e.notification.data&&e.notification.data.url)||'./',self.registration.scope).href;
  e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(ws=>{
    for(const w of ws)if(w.url.startsWith(self.registration.scope)&&'focus' in w)return w.focus();
    return clients.openWindow(url);
  }));
});
