// Lucide icons (lucide.dev, ISC). Paths only; the svg wrapper is shared.
const icons = {
  house: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  blocks: '<rect width="7" height="7" x="14" y="3" rx="1"/><path d="M10 21V8a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1h-3"/>',
  rectangle: '<rect width="20" height="12" x="2" y="6" rx="2"/>',
  columns: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 3v18"/>',
  segmented: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="M15 3v18"/>',
  tag: '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  panel: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/>',
  dropdown: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="m8 10 4 4 4-4"/>',
  field: '<path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/>',
  check: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/>',
  bubble: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  bell: '<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>',
  card: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/>',
  path: '<path d="m6 17 5-5-5-5"/><path d="m13 17 5-5-5-5"/>',
  window: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M10 4v4"/><path d="M2 8h20"/><path d="M6 4v4"/>',
  collapse: '<path d="m3 10 2.5-2.5L3 5"/><path d="m3 19 2.5-2.5L3 14"/><path d="M10 6h11"/><path d="M10 12h11"/><path d="M10 18h11"/>',
  table: '<path d="M12 3v18"/><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/>',
  alert: '<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>',
  tabs: '<path d="M3 9a2 2 0 0 1 2-2h3l2-2h4l2 2h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  gauge: '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
  sliders: '<line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/>',
  loader: '<path d="M21 12a9 9 0 1 1-6.219-8.56"/>',
  steps: '<path d="M10 12h11"/><path d="M10 18h11"/><path d="M10 6h11"/><path d="M4 10h2"/><path d="M4 6h1v4"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>',
  timeline: '<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><circle cx="4" cy="6" r="1.5"/><circle cx="4" cy="12" r="1.5"/><circle cx="4" cy="18" r="1.5"/>',
  trend: '<path d="M16 7h6v6"/><path d="m22 7-8.5 8.5-5-5L2 17"/>',
  ellipsis: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
  monitor: '<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  palette: '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>',
};
export const icon = (name) =>
  `<svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;

const components = [
  ["accordion.html", "Accordion", "collapse"],
  ["alert.html", "Alert", "alert"],
  ["avatar.html", "Avatar", "user"],
  ["badge.html", "Badge", "tag"],
  ["breadcrumb.html", "Breadcrumb", "path"],
  ["button.html", "Button", "rectangle"],
  ["card.html", "Card", "card"],
  ["check.html", "Check", "check"],
  ["dialog.html", "Dialog", "window"],
  ["dropdown.html", "Dropdown", "dropdown"],
  ["field.html", "Field", "field"],
  ["join.html", "Join", "columns"],
  ["loading.html", "Loading", "loader"],
  ["nav.html", "Nav", "panel"],
  ["pagination.html", "Pagination", "ellipsis"],
  ["progress.html", "Progress", "gauge"],
  ["range.html", "Range", "sliders"],
  ["segmented.html", "Segmented", "segmented"],
  ["stat.html", "Stat", "trend"],
  ["steps.html", "Steps", "steps"],
  ["table.html", "Table", "table"],
  ["tabs.html", "Tabs", "tabs"],
  ["timeline.html", "Timeline", "timeline"],
  ["toast.html", "Toast", "bell"],
  ["tooltip.html", "Tooltip", "bubble"],
];
/* Every href is relative to demo/; `root` fixes them up from app/.
   Menu items: a string is a heading, [href, label, icon?, extra?] a link,
   [label, icon, items] a collapsible group. */
const menu = [
  ["index.html", "Getting started", "house"],
  ["Components", "blocks", components],
  ["theme.html", "Theme", "palette"],
  ["E-commerce", "cart", [["app/product.html", "Product"]]],
];

const inApp = location.pathname.includes("/app/");
const root = inApp ? "../" : "";
const here = (inApp ? "app/" : "") + (location.pathname.split("/").pop() || "index.html");
const html = document.documentElement;

const crumbs = ["nui"];
const link = ([href, label, ic, extra = ""], group) => {
  const current = href === here;
  if (current) crumbs.push(...(group ? [group] : []), label);
  return `<a href="${href.startsWith("#") ? href : root + href}"${current ? ' aria-current="page"' : ""}>${ic ? icon(ic) + " " : ""}${label}${extra}</a>`;
};
const item = (it) =>
  typeof it === "string" ? `<h2>${it}</h2>`
  : Array.isArray(it[2]) ? `<details open><summary>${icon(it[1])} ${it[0]}</summary>${it[2].map((c) => link(c, it[0])).join("")}</details>`
  : link(it);
const nav = menu.map(item).join("");

const aside = document.querySelector("aside");
aside.id = "sidebar";
aside.className = "fixed inset-y-0 start-0 z-20 flex w-64 shrink-0 flex-col border-e border-border bg-background lg:sticky lg:top-0 lg:h-screen";
aside.innerHTML = `
  <div class="flex h-14 items-center gap-3 border-b border-border px-3">
    <span class="avatar rounded-lg sm">${icon("blocks")}</span>
    <div class="min-w-0 text-sm leading-tight">
      <p class="truncate font-semibold">nui</p>
      <p class="truncate text-xs muted">Tailwind v4 components</p>
    </div>
  </div>
  <nav class="nav flex-1 overflow-y-auto p-3" aria-label="Main">${nav}</nav>`;

// a page can put its own controls inside <header>; they keep their place before the scheme switcher and theme button
const header = document.querySelector("header");
const extras = header.innerHTML;
header.className = "flex h-14 items-center gap-3 border-b border-border px-gap";
header.innerHTML = `
  <label class="btn ghost sm px-2"><input type="checkbox" id="menu" aria-label="Toggle sidebar">${icon("panel")}</label>
  <nav class="breadcrumb" aria-label="Breadcrumb">
    ${crumbs.map((c, i) => (i < crumbs.length - 1 ? `<a href="${root}index.html">${c}</a>` : `<span aria-current="page">${c}</span>`)).join("")}
  </nav>
  <div class="ml-auto flex items-center gap-2 text-sm">
    ${extras}
    <div class="join" role="group" aria-label="Theme">
      ${[["", "System", "monitor"], ["light", "Light", "sun"], ["dark", "Dark", "moon"]]
        .map(([v, l, ic]) => `<button class="btn outlined sm px-2" data-value="${v}" title="${l}" aria-label="${l}">${icon(ic)}</button>`)
        .join("")}
    </div>
    <button class="btn outlined sm px-2" command="show-modal" commandfor="theme" title="Theme" aria-label="Theme">${icon("palette")}</button>
  </div>`;
// app pages are full-width screens, docs pages a readable column
document.querySelector("main").className = inApp ? "w-full space-y-gap p-gap" : "w-full max-w-5xl space-y-10 p-gap";

const themeBtns = document.querySelectorAll("header [data-value]");
const setTheme = (v) => {
  localStorage.theme = v;
  if (v) html.dataset.theme = v;
  else delete html.dataset.theme;
  themeBtns.forEach((b) => b.setAttribute("aria-pressed", b.dataset.value === v));
};
themeBtns.forEach((b) => (b.onclick = () => setTheme(b.dataset.value)));
setTheme(localStorage.theme || "");

// theme drawer: every colour token as a light and a dark picker, plus the radius; overrides live in <html style> and localStorage.tokens
export const tokens = {
  Base: ["background", "foreground", "card", "card-foreground", "muted", "muted-foreground", "border", "ring"],
  Intent: ["primary", "primary-foreground", "secondary", "secondary-foreground", "info", "info-foreground",
    "success", "success-foreground", "warning", "warning-foreground", "danger", "danger-foreground"],
  Hues: ["red", "orange", "amber", "yellow", "lime", "green", "emerald", "teal", "cyan", "sky", "blue", "indigo", "violet", "purple", "fuchsia", "pink", "rose"],
};
document.body.insertAdjacentHTML("beforeend", `
  <dialog id="theme" class="dialog drawer divided" closedby="any" aria-labelledby="theme-title">
    <header>
      <h3 id="theme-title">Theme</h3>
      <button class="btn ghost sm" command="close" commandfor="theme" aria-label="Close">${icon("x")}</button>
    </header>
    <div class="space-y-2">
      <p id="radius-label" class="text-sm font-medium">Radius</p>
      <div class="join" role="radiogroup" aria-labelledby="radius-label">
        ${[["0", "Square"], ["", "Default"], ["9999px", "Pill"]]
          .map(([v, l]) => `<label class="btn outlined sm"><input type="radio" name="radius" value="${v}"> ${l}</label>`).join("")}
      </div>
    </div>
    ${Object.entries(tokens).map(([group, names]) => `
    <div class="grid grid-cols-[1fr_auto_auto] items-center gap-x-3 gap-y-1 text-sm">
      <p class="font-medium">${group}</p><p class="text-xs muted">Light</p><p class="text-xs muted">Dark</p>
      ${names.map((t) => `<code>${t}</code>` + ["light", "dark"].map((s) =>
        `<input type="color" data-token="${t}" aria-label="${t}, ${s}" class="h-7 w-10 cursor-pointer rounded-[min(var(--radius),0.375rem)] border border-border bg-transparent p-0.5">`).join("")).join("")}
    </div>`).join("")}
    <footer class="justify-end">
      <button class="btn ghost" id="theme-reset">Reset</button>
      <button class="btn primary" id="theme-copy">Copy CSS</button>
    </footer>
  </dialog>`);

const drawer = document.getElementById("theme");
// resolve a token in one scheme, then read it back through a canvas to get the hex a colour input needs
// ponytail: canvas clamps to sRGB, so a wide-gamut oklch default comes back slightly duller once its pair is edited
const probe = document.body.appendChild(document.createElement("i"));
probe.hidden = true;
const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
const read = (token, scheme) => {
  probe.style.colorScheme = scheme;
  probe.style.color = `var(--color-${token})`;
  ctx.fillStyle = getComputedStyle(probe).color;
  ctx.fillRect(0, 0, 1, 1);
  return "#" + [...ctx.getImageData(0, 0, 1, 1).data.slice(0, 3)].map((n) => n.toString(16).padStart(2, "0")).join("");
};
const sync = () => {
  drawer.querySelectorAll("[data-token]").forEach((c, i) => (c.value = read(c.dataset.token, i % 2 ? "dark" : "light")));
  drawer.querySelectorAll("[name=radius]").forEach((r) => (r.checked = r.value === html.style.getPropertyValue("--radius")));
};
drawer.oninput = ({ target: t }) => {
  if (t.name === "radius") html.style.setProperty("--radius", t.value || null);
  else {
    const [light, dark] = drawer.querySelectorAll(`[data-token="${t.dataset.token}"]`);
    html.style.setProperty(`--color-${t.dataset.token}`, `light-dark(${light.value}, ${dark.value})`);
  }
  localStorage.tokens = html.style.cssText;
};
document.getElementById("theme-reset").onclick = () => {
  html.removeAttribute("style");
  localStorage.removeItem("tokens");
  sync();
};
// colours go in @theme, radius on :root (see theme.css); only what was changed is copied
document.getElementById("theme-copy").onclick = async ({ currentTarget: b }) => {
  const decl = (p) => `  ${p}: ${html.style.getPropertyValue(p)};\n`;
  const props = [...html.style];
  const colors = props.filter((p) => p.startsWith("--color-")).map(decl).join("");
  const css = (colors && `@theme {\n${colors}}\n`) + (props.includes("--radius") ? `:root {\n${decl("--radius")}}\n` : "");
  await navigator.clipboard.writeText(css || "/* no changes from the defaults */\n");
  b.textContent = "Copied";
  setTimeout(() => (b.textContent = "Copy CSS"), 1500);
};
document.querySelector('[command="show-modal"][commandfor="theme"]').onclick = sync;
