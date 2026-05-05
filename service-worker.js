const CACHE_NAME = "beanything-v20260505j";
const APP_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./manifest.webmanifest",
  "./assets/icon.svg",
  "./assets/generated/hero-background-v2.png",
  "./assets/generated/choice-sprite-v1.png",
  "./assets/generated/home-hero.png",
  "./assets/generated/scene-creative.png",
  "./assets/generated/scene-expert.png",
  "./assets/generated/scene-business.png",
  "./assets/generated/painfit/painfit-physical-banner-v1.png",
  "./assets/generated/painfit/painfit-cognitive-banner-v1.png",
  "./assets/generated/painfit/painfit-repetitive-banner-v1.png",
  "./assets/generated/painfit/painfit-social-banner-v1.png",
  "./assets/generated/painfit/painfit-emotional-banner-v1.png",
  "./assets/generated/painfit/painfit-detail-banner-v1.png",
  "./assets/generated/painfit/painfit-uncertainty-banner-v1.png",
  "./assets/inspiration-studio.svg",
  "./assets/inspiration-classroom.svg",
  "./assets/inspiration-storefront.svg",
  "./assets/inspiration-community.svg",
  "./assets/inspiration-expert.svg",
  "./assets/inspiration-care.svg",
  "./src/app.js",
  "./src/data/sample-data.js",
  "./src/data/questions.js",
  "./src/lib/storage.js",
  "./src/lib/engine.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_ASSETS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("./index.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
