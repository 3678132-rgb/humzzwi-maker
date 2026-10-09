// 자동 생성 파일: tools/build.py가 만든다. 직접 고치지 말고 tools/sw.template.js를 고칠 것
const CACHE='__CACHE__';
const ASSETS=__ASSETS__;
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil((async()=>{
  const c=await caches.open(CACHE),total=ASSETS.length,all=async()=>self.clients.matchAll({includeUncontrolled:true});
  for(let i=0;i<total;i+=8){
    await Promise.all(ASSETS.slice(i,i+8).map(u=>c.add(new Request(u,{cache:'reload'})).catch(()=>{})));
    (await all()).forEach(cl=>cl.postMessage({type:'progress',done:Math.min(total,i+8),total}));
  }
  (await all()).forEach(cl=>cl.postMessage({type:'ready',cache:CACHE}));
})())});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{
  for(const k of await caches.keys())if(k!==CACHE)await caches.delete(k);
  await self.clients.claim();
})())});
self.addEventListener('fetch',e=>{const req=e.request;if(req.method!=='GET')return;
  e.respondWith((async()=>{const c=await caches.open(CACHE);
    // 게임 화면: 온라인이면 새로 받고, 비행기 모드면 저장해 둔 것
    if(req.mode==='navigate'){
      try{const res=await fetch(req,{cache:'no-store'});if(res&&res.ok){c.put('index.html',res.clone());return res}}catch(err){}
      const idx=await c.match('index.html');if(idx)return idx}
    const hit=await c.match(req,{ignoreSearch:true});if(hit)return hit;
    try{const res=await fetch(req);if(res&&res.ok&&req.url.startsWith(self.location.origin))c.put(req,res.clone());return res}
    catch(err){if(req.mode==='navigate'){const idx=await c.match('index.html');if(idx)return idx}throw err}
  })())});
