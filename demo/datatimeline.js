// DataTimeline keeps its state in the URL through Inertia's router, so the page boots an Inertia app.
// There is no server: the page object a controller would send is written here, and client mode never asks for another.
import { createInertiaApp } from "@inertiajs/vue3";
import DataTimelineDemo from "./DataTimelineDemo.vue";

createInertiaApp({
  page: { component: "DataTimelineDemo", props: {}, url: location.pathname + location.search, version: null, clearHistory: false, encryptHistory: false },
  resolve: () => DataTimelineDemo,
});
