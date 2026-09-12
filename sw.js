const CACHE = "shaftut-v2";
const ASSETS = ["./", "./index.html", "./icon.png", "./manifest.json"];

self.addEventListener("install", function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(ASSETS); }));
  self.skipWaiting();
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function(e){
  if(e.request.method !== "GET") return;
  var isAppShell = e.request.mode === "navigate" || e.request.url.endsWith("/index.html") || e.request.url.endsWith("/");
  if(isAppShell){
    // Network-first for the app itself, so a new deploy is picked up as soon as the
    // device is online. The cached copy is only a fallback for offline use — otherwise
    // a stale service-worker cache could serve an old version indefinitely.
    e.respondWith(
      fetch(e.request).then(function(res){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
        return res;
      }).catch(function(){ return caches.match(e.request); })
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function(cached){
      if(cached) return cached;
      return fetch(e.request).then(function(res){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
        return res;
      }).catch(function(){ return cached; });
    })
  );
});
