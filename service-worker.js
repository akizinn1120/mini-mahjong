self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("mahjong-cache").then((cache) => {
      return cache.addAll([
        "index.html",
        "game.html",
        "game.js",
        "bg.png",
        "tiles/1m.png",
        "tiles/2m.png",
        "tiles/3m.png",
        "tiles/4m.png",
        "tiles/5m.png",
        "tiles/6m.png",
        "tiles/7m.png",
        "tiles/8m.png",
        "tiles/9m.png",
        "tiles/east.png",
        "tiles/south.png",
        "tiles/west.png",
        "tiles/north.png",
        "tiles/white.png",
        "tiles/green.png",
        "tiles/red.png"
      ]);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});