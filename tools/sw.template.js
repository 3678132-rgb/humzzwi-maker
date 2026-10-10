// 자동 생성 파일: tools/build.py가 만든다. 직접 고치지 말고 tools/sw.template.js를 고칠 것
const VER='__CACHE__';         // 빌드 코드 (sw.js 내용이 바뀌어야 폰이 업데이트를 알아챈다)
const FILES=__ASSETS__;        // [주소, 내용 지문, 종류] — 종류 'w': 여자 험쮜 그림, 'b': 그 짝인 기본 그림, '': 공통
const STORE='humzzwi-files';   // 버전이 바뀌어도 지우지 않는 보관함 → 업데이트 때 바뀐 파일만 새로 받는다
const META='__hz_meta__';      // 보관함에 넣어 둔 파일별 지문 + 험쮜 성별
const all=()=>self.clients.matchAll({includeUncontrolled:true});
const tell=async m=>(await all()).forEach(cl=>cl.postMessage(m));
async function readMeta(c){const r=await c.match(META);try{return r?await r.json():{f:{}}}catch(e){return {f:{}}}}
// 고른 파일 중 지문이 다른(새로 생겼거나 바뀐) 것만 받는다
async function sync(pick){const c=await caches.open(STORE),m=await readMeta(c);m.f=m.f||{};
  const todo=FILES.filter(f=>pick(f,m)&&m.f[f[0]]!==f[1]),total=todo.length;
  for(let i=0;i<total;i+=8){
    await Promise.all(todo.slice(i,i+8).map(async([u,h])=>{try{const res=await fetch(new Request(u,{cache:'reload'}));if(res.ok){await c.put(u,res);m.f[u]=h}}catch(e){}}));
    tell({type:'progress',done:Math.min(total,i+8),total});
  }
  await c.put(META,new Response(JSON.stringify(m)));return {m,total}}
const forGender=g=>([,,t])=>t===''||(g==='w'?t==='w':g==='m'?t==='b':false);
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil((async()=>{
  // 공통 파일 + (성별을 이미 알면) 그 성별 그림
  const {total}=await sync((f,m)=>forGender(m.g)(f));tell({type:'ready',total,ver:VER});
})())});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{
  for(const k of await caches.keys())if(k!==STORE)await caches.delete(k);   // 예전 버전별 보관함 정리
  const c=await caches.open(STORE),keep=new Set(FILES.map(([u])=>new URL(u,self.registration.scope).href)),m=await readMeta(c);
  for(const r of await c.keys()){if(r.url.endsWith(META))continue;if(!keep.has(r.url)){await c.delete(r);delete m.f[Object.keys(m.f).find(u=>new URL(u,self.registration.scope).href===r.url)]}}
  await c.put(META,new Response(JSON.stringify(m)));
  await self.clients.claim();
})())});
// 게임이 험쮜 성별을 알려 주면 그 성별 그림만 이어서 받는다
self.addEventListener('message',e=>{const d=e.data||{};if(d.type!=='gender'||!/^[wm]$/.test(d.g))return;
  e.waitUntil((async()=>{const c=await caches.open(STORE),m=await readMeta(c);if(m.g!==d.g){m.g=d.g;await c.put(META,new Response(JSON.stringify(m)))}
    const {total}=await sync(forGender(d.g));if(total)tell({type:'ready',total,ver:VER})})())});
self.addEventListener('fetch',e=>{const req=e.request;if(req.method!=='GET')return;
  e.respondWith((async()=>{const c=await caches.open(STORE);
    // 게임 화면: 온라인이면 새로 받고, 비행기 모드면 저장해 둔 것
    if(req.mode==='navigate'){
      try{const res=await fetch(req,{cache:'no-store'});if(res&&res.ok){c.put('index.html',res.clone());return res}}catch(err){}
      const idx=await c.match('index.html');if(idx)return idx}
    const hit=await c.match(req,{ignoreSearch:true});if(hit)return hit;
    try{const res=await fetch(req);if(res&&res.ok&&req.url.startsWith(self.location.origin))c.put(req,res.clone());return res}
    catch(err){if(req.mode==='navigate'){const idx=await c.match('index.html');if(idx)return idx}throw err}
  })())});
