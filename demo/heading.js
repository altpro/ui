// PageHeading's breadcrumb and ListHeader's cards are Inertia links, so the page boots an Inertia app. There is no
// server: the list runs in client mode, and a visit to another page loads it in full.
import { createInertiaApp, router } from "@inertiajs/vue3";
import HeadingDemo from "./HeadingDemo.vue";

router.on("before", (event) => {
  if (event.detail.visit.url.pathname === location.pathname) return;
  location.href = event.detail.visit.url.href;
  return false;
});

createInertiaApp({
  page: { component: "HeadingDemo", props: {}, url: location.pathname + location.search, version: null, clearHistory: false, encryptHistory: false },
  resolve: () => HeadingDemo,
});
