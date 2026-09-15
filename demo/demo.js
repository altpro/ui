// Lucide icons (lucide.dev, ISC). Paths only; the svg wrapper is shared.
const icons = {
  house: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  blocks: '<rect width="7" height="7" x="14" y="3" rx="1"/><path d="M10 21V8a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1h-3"/>',
  rectangle: '<rect width="20" height="12" x="2" y="6" rx="2"/>',
  columns: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 3v18"/>',
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
  trend: '<path d="M16 7h6v6"/><path d="m22 7-8.5 8.5-5-5L2 17"/>',
  ellipsis: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  monitor: '<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  palette: '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>',
};
export const icon = (name) =>
  `<svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;

const components = [
  ["button.html", "Button", "rectangle"],
  ["join.html", "Join", "columns"],
  ["field.html", "Field", "field"],
  ["check.html", "Check", "check"],
  ["badge.html", "Badge", "tag"],
  ["avatar.html", "Avatar", "user"],
  ["nav.html", "Nav", "panel"],
  ["breadcrumb.html", "Breadcrumb", "path"],
  ["dropdown.html", "Dropdown", "dropdown"],
  ["tooltip.html", "Tooltip", "bubble"],
  ["card.html", "Card", "card"],
  ["dialog.html", "Dialog", "window"],
  ["accordion.html", "Accordion", "collapse"],
  ["table.html", "Table", "table"],
  ["alert.html", "Alert", "alert"],
  ["tabs.html", "Tabs", "tabs"],
  ["progress.html", "Progress", "gauge"],
  ["range.html", "Range", "sliders"],
  ["pagination.html", "Pagination", "ellipsis"],
  ["loading.html", "Loading", "loader"],
  ["steps.html", "Steps", "steps"],
  ["toast.html", "Toast", "bell"],
  ["stat.html", "Stat", "trend"],
];
const here = location.pathname.split("/").pop() || "index.html";
const html = document.documentElement;
const link = ([href, label, ic]) =>
  `<a href="${href}"${href === here ? ' aria-current="page"' : ""}>${icon(ic)} ${label}</a>`;

document.querySelector("header").innerHTML = `
  <div class="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-6 py-3">
    <a href="index.html" class="text-lg font-semibold tracking-tight">nui</a>
    <div class="ml-auto flex gap-2 text-sm">
      <div class="join" role="group" aria-label="Theme">
        ${[["", "System", "monitor"], ["light", "Light", "sun"], ["dark", "Dark", "moon"]]
          .map(([v, l, ic]) => `<button class="btn outline sm px-2" data-value="${v}" title="${l}" aria-label="${l}">${icon(ic)}</button>`)
          .join("")}
      </div>
      <label>Radius
        <select id="radius" class="ml-1 rounded-md border border-border bg-background px-2 py-1">
          <option value="0">Square</option><option value="">Default</option><option value="9999px">Pill</option>
        </select>
      </label>
    </div>
  </div>`;

document.querySelector("aside").innerHTML = `
  <nav class="nav" aria-label="Site">
    ${link(["index.html", "Getting started", "house"])}
    <details open>
      <summary>${icon("blocks")} Components</summary>
      ${components.map(link).join("")}
    </details>
    ${link(["theme.html", "Theme", "palette"])}
  </nav>`;

const themeBtns = document.querySelectorAll("header [data-value]");
const setTheme = (v) => {
  localStorage.theme = v;
  if (v) html.dataset.theme = v;
  else delete html.dataset.theme;
  themeBtns.forEach((b) => b.setAttribute("aria-pressed", b.dataset.value === v));
};
themeBtns.forEach((b) => (b.onclick = () => setTheme(b.dataset.value)));
setTheme(localStorage.theme || "");

const radius = document.getElementById("radius");
radius.value = localStorage.radius || "";
radius.onchange = () => {
  localStorage.radius = radius.value;
  html.style.setProperty("--radius", radius.value || null);
};
