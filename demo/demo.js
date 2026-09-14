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
  card: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/>',
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
  ["dropdown.html", "Dropdown", "dropdown"],
  ["tooltip.html", "Tooltip", "bubble"],
  ["card.html", "Card", "card"],
];
const here = location.pathname.split("/").pop() || "index.html";
const html = document.documentElement;
const link = ([href, label, ic]) =>
  `<a href="${href}"${href === here ? ' aria-current="page"' : ""}>${icon(ic)} ${label}</a>`;

document.querySelector("header").innerHTML = `
  <div class="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-6 py-3">
    <a href="index.html" class="text-lg font-semibold tracking-tight">nui</a>
    <div class="ml-auto flex gap-2 text-sm">
      <label>Theme
        <select id="theme" class="ml-1 rounded-md border border-border bg-background px-2 py-1">
          <option value="">System</option><option value="light">Light</option><option value="dark">Dark</option>
        </select>
      </label>
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

const theme = document.getElementById("theme");
theme.value = localStorage.theme || "";
theme.onchange = () => {
  localStorage.theme = theme.value;
  if (theme.value) html.dataset.theme = theme.value;
  else delete html.dataset.theme;
};

const radius = document.getElementById("radius");
radius.value = localStorage.radius || "";
radius.onchange = () => {
  localStorage.radius = radius.value;
  html.style.setProperty("--radius", radius.value || null);
};
