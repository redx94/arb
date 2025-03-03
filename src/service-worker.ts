/// <reference lib="webworker"/>

const sw = self as unknown as ServiceWorkerGlobalScope;

sw.addEventListener("install", (event: ExtendableEvent) => {
  console.log("Installing service worker...");
  event.waitUntil(Promise.resolve());
});

sw.addEventListener("activate", (event: ExtendableEvent) => {
  console.log("Activating service worker...");
  event.waitUntil(Promise.resolve());
});

sw.addEventListener("fetch", (event: FetchEvent) => {
  console.log("Fetching:", event.request.url);
});
