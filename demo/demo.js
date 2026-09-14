const pages = [
  ["index.html", "Getting started"],
  ["button.html", "Button"],
  ["theme.html", "Theme"],
];
const here = location.pathname.split("/").pop() || "index.html";
const html = document.documentElement;

document.querySelector("header").innerHTML = `
  <div class="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-6 py-3">
    <a href="index.html" class="text-lg font-semibold tracking-tight">nui</a>
    <nav class="flex gap-1">
      ${pages
        .map(
          ([href, label]) =>
            `<a href="${href}" class="btn ghost sm${href === here ? " bg-muted" : ""}">${label}</a>`,
        )
        .join("")}
    </nav>
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
