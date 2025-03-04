/// <reference lib="webworker"/>
const sw = self;
sw.addEventListener("install", (event) => {
    console.log("Installing service worker...");
    event.waitUntil(Promise.resolve());
});
sw.addEventListener("activate", (event) => {
    console.log("Activating service worker...");
    event.waitUntil(Promise.resolve());
});
sw.addEventListener("fetch", (event) => {
    console.log("Fetching:", event.request.url);
});
export {};
