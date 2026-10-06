// Demo presets use the same tokens as the library. Inline values persist before paint.
const pair = (light, dark) => `light-dark(${light}, ${dark})`;
const palette = (values) => Object.fromEntries(Object.entries(values).map(([key, value]) => [`--color-${key}`, pair(...value)]));
export const presetStyles = `@layer components {
  body { background-image: var(--demo-backdrop, none); }
  #sidebar {
    background: var(--demo-chrome-bg, var(--color-background));
    color: var(--demo-chrome-fg, var(--color-foreground));
    --demo-sidebar-highlight: color-mix(in srgb, var(--demo-chrome-fg) 15%, var(--demo-chrome-bg));
    .demo-sidebar-description { color: var(--demo-chrome-fg, var(--color-muted-foreground)); }
    .nav {
      --nav-fg: var(--demo-chrome-fg, var(--color-muted-foreground));
      --nav-active-fg: var(--demo-chrome-fg, var(--color-foreground));
      --nav-hover: var(--demo-sidebar-highlight, color-mix(in oklab, var(--color-muted) 60%, transparent));
      --nav-active-bg: var(--demo-sidebar-highlight, var(--color-muted));
      :is(a, summary, button):focus-visible {
        outline-color: color-mix(in oklab, var(--demo-chrome-fg, var(--color-ring)) 50%, transparent);
      }
    }
  }
  .demo-header {
    background: var(--demo-chrome-bg, transparent);
    color: var(--demo-chrome-fg, var(--color-foreground));
    .btn {
      --btn-accent: var(--demo-chrome-fg, var(--color-foreground));
      --btn-outline: var(--demo-chrome-border, var(--color-border));
    }
    .breadcrumb {
      --breadcrumb-fg: var(--demo-chrome-fg, var(--color-muted-foreground));
      --breadcrumb-active-fg: var(--demo-chrome-fg, var(--color-foreground));
    }
  }
  .btn.warning { --btn-accent: var(--demo-warning-ink, light-dark(oklch(from var(--color-warning) 0.5 c h), var(--color-warning))); }
  .badge.warning { --badge-accent: var(--demo-warning-ink, light-dark(oklch(from var(--color-warning) 0.5 c h), var(--color-warning))); }
  .badge:is(.red, .orange, .amber, .yellow, .lime, .green, .emerald, .teal, .cyan, .sky, .blue, .indigo, .violet, .purple, .fuchsia, .pink, .rose) {
    --badge-accent: light-dark(oklch(from var(--badge-bg) var(--demo-badge-ink-lightness, 0.45) c h), oklch(from var(--badge-bg) 0.8 c h));
  }
  .card.divided > header {
    background: var(--demo-panel-heading, transparent);
  }
  h1, h2 { font-family: var(--demo-heading-font, inherit); }
  .btn.primary:not(.outlined):not(.ghost), .btn.primary:has(:checked) {
    background-image: var(--demo-primary-gradient, none);
    &:hover { background-image: var(--demo-primary-gradient-hover, var(--demo-primary-gradient, none)); }
  }
}`;
export const presets = {
  default: { name: 'Default', description: 'The original altpro/ui palette and typography.', values: {} },
  sol: {
    name: 'Sol', description: 'Mineral blue, porcelain surfaces and cobalt. A calm workspace for everyday work.',
    values: {
      ...palette({
        background: ['#f3f5f9', '#141b29'], foreground: ['#202b43', '#edf2ff'],
        card: ['#ffffff', '#1d2739'], 'card-foreground': ['#202b43', '#edf2ff'],
        muted: ['#e9edf5', '#2c374d'], 'muted-foreground': ['#56637b', '#b4c0d8'],
        border: ['#dbe1ec', '#404e66'], primary: ['#3455c5', '#a8baff'],
        'primary-foreground': ['#ffffff', '#142044'], secondary: ['#e5eafe', '#34416b'],
        'secondary-foreground': ['#314788', '#e2e8ff'],
      }),
      '--radius': '0.625rem', '--color-ring': 'var(--color-primary)',
      '--demo-chrome-bg': 'var(--color-card)', '--demo-chrome-fg': 'var(--color-foreground)',
      '--font-sans': '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
      '--demo-heading-font': '"Avenir Next", "Segoe UI", sans-serif',
      '--demo-stage': pair('#e7eafa', '#303c62'),
      '--demo-stage-alt': pair('#e2edea', '#2a4446'),
      '--demo-object': pair('#303c65', '#b9c8ed'),
      '--demo-object-edge': pair('#62739a', '#8298c4'),
      '--demo-object-highlight': pair('#a2b1d2', '#e4ecff'),
    },
  },
  aurora: {
    name: 'Aurora', description: 'Violet and blue gradients, cool surfaces and soft corners.',
    values: {
      ...palette({
        background: ['#f8f8ff', '#161526'], foreground: ['#222039', '#f5f3ff'],
        card: ['#ffffff', '#211f35'], 'card-foreground': ['#222039', '#f5f3ff'],
        muted: ['#eeedf8', '#302d46'], 'muted-foreground': ['#625e77', '#bdb8d2'],
        border: ['#d9d6ec', '#4c4666'], primary: ['#6235ad', '#c3afff'],
        'primary-foreground': ['#ffffff', '#19132e'], secondary: ['#e8e1f7', '#403554'],
        'secondary-foreground': ['#43256c', '#eee5ff'],
      }),
      '--color-ring': 'var(--color-primary)', '--radius': '0.875rem',
      '--font-sans': '"Trebuchet MS", ui-sans-serif, system-ui, sans-serif',
      '--demo-heading-font': '"Trebuchet MS", ui-sans-serif, system-ui, sans-serif',
      '--demo-gradient-end': pair('#2455ac', '#8ecdf6'),
      '--demo-primary-gradient': 'linear-gradient(115deg in srgb, var(--color-primary), var(--demo-gradient-end))',
      '--demo-primary-gradient-hover': 'linear-gradient(115deg in srgb, var(--btn-hover), var(--demo-gradient-end))',
      '--demo-backdrop': 'radial-gradient(ellipse at 90% 0%, color-mix(in srgb, var(--color-primary) 7%, transparent), transparent 65%)',
    },
  },
  grove: {
    name: 'Grove', description: 'Forest green, fresh mint and generous, rounded controls.',
    values: {
      ...palette({
        background: ['#f3f8f4', '#14221c'], foreground: ['#19352a', '#eff9f1'],
        card: ['#ffffff', '#1c2e25'], 'card-foreground': ['#19352a', '#eff9f1'],
        muted: ['#e4eee6', '#2a4033'], 'muted-foreground': ['#526957', '#b1c8b7'],
        border: ['#c9dbce', '#476451'], primary: ['#246344', '#93d5ac'],
        'primary-foreground': ['#ffffff', '#102d1d'], secondary: ['#dcebc1', '#3a4930'],
        'secondary-foreground': ['#354a20', '#e5f3cd'],
      }),
      '--color-ring': 'var(--color-primary)', '--radius': '9999px',
      '--font-sans': 'Verdana, Geneva, sans-serif',
      '--demo-heading-font': '"Trebuchet MS", Verdana, sans-serif',
    },
  },
  atelier: {
    name: 'Atelier', description: 'Inky plum, rose paper, crisp edges and editorial serif headings.',
    values: {
      ...palette({
        background: ['#fcf6f8', '#251b24'], foreground: ['#3a2035', '#fbf0f5'],
        card: ['#fffafb', '#322530'], 'card-foreground': ['#3a2035', '#fbf0f5'],
        muted: ['#f0e4eb', '#443140'], 'muted-foreground': ['#76576b', '#d0b7c8'],
        border: ['#dfcbd6', '#65495e'], primary: ['#792d60', '#e8a7ce'],
        'primary-foreground': ['#ffffff', '#341128'], secondary: ['#eadce8', '#4b354d'],
        'secondary-foreground': ['#533350', '#f6e6f5'],
      }),
      '--color-ring': 'var(--color-primary)', '--radius': '0',
      '--font-sans': '"Avenir Next", "Segoe UI", sans-serif',
      '--demo-heading-font': 'Georgia, "Times New Roman", serif',
    },
  },
  crms: {
    name: 'CRMS', description: 'Slate-blue controls, charcoal navigation and white panels over a blue-to-rose backdrop.',
    values: {
      ...palette({
        background: ['#dededf', '#1c252b'], foreground: ['#172730', '#f0f4f6'],
        card: ['#ffffff', '#27343c'], 'card-foreground': ['#172730', '#f0f4f6'],
        muted: ['#f6f6f8', '#35434c'], 'muted-foreground': ['#15262f', '#c0cbd2'],
        border: ['#cdd2d6', '#52636e'], primary: ['#102632', '#a4cce1'],
        'primary-foreground': ['#ffffff', '#152a36'], secondary: ['#e7ecef', '#3b4d59'],
        'secondary-foreground': ['#142631', '#edf4f8'],
        info: ['#102632', '#98cbe3'], 'info-foreground': ['#ffffff', '#152a36'],
        success: ['#122a1c', '#94d5af'], 'success-foreground': ['#ffffff', '#102c1c'],
        danger: ['#421621', '#f2a4ad'], 'danger-foreground': ['#ffffff', '#35151b'],
      }),
      '--color-ring': 'var(--color-primary)', '--radius': '0.25rem',
      '--font-sans': '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
      '--demo-heading-font': '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
      // Match the reference backdrop; deeper ink keeps exposed controls readable.
      '--demo-backdrop-blue': pair('#6b92a4', '#223f4c'),
      '--demo-backdrop-middle': pair('#ced0cf', '#30363b'),
      '--demo-backdrop-rose': pair('#bd9390', '#483035'),
      '--demo-backdrop': 'radial-gradient(farthest-side ellipse at 10% 0, rgba(74, 121, 147, .89), rgba(204, 204, 204, .85) 80%, rgba(185, 135, 131, .87) 120%)',
      '--demo-chrome-bg': pair('#282b2c', '#171d21'),
      '--demo-chrome-fg': '#e1e8ec', '--demo-chrome-border': '#68767e',
      '--demo-panel-heading': 'var(--color-muted)',
      '--demo-warning-ink': pair('#301b00', '#f4cb7b'),
      '--demo-badge-ink-lightness': '0.18',
    },
  },
  claude: {
    name: 'Claude', description: 'Terracotta orange on warm cream paper, with serif headings.',
    values: {
      ...palette({
        background: ['#faf9f5', '#262624'], foreground: ['#141413', '#f5f4ee'],
        card: ['#ffffff', '#30302e'], 'card-foreground': ['#141413', '#f5f4ee'],
        muted: ['#f0eee6', '#3a3936'], 'muted-foreground': ['#6b6a64', '#b3b1a8'],
        border: ['#e0dcd0', '#4b4a46'], primary: ['#a84a2b', '#e08b6d'],
        'primary-foreground': ['#ffffff', '#141413'], secondary: ['#f0eee6', '#3d3c38'],
        'secondary-foreground': ['#3d3929', '#ede9dc'],
      }),
      '--color-ring': 'var(--color-primary)', '--radius': '0.75rem',
      '--font-sans': '"Anthropic Sans", system-ui, -apple-system, "Segoe UI", sans-serif',
      '--demo-heading-font': '"Anthropic Serif", Georgia, "Times New Roman", serif',
    },
  },
};

// Upgrade untouched values from the first CRMS palette while retaining custom edits.
export const presetMigrations = {
  crms: {
    '--demo-backdrop-blue': pair('#cbdce3', '#223f4c'),
    '--demo-backdrop-middle': pair('#e2e2e3', '#30363b'),
    '--demo-backdrop-rose': pair('#ead7d6', '#483035'),
    '--color-muted-foreground': pair('#35434b', '#c0cbd2'),
    '--color-primary': pair('#294b60', '#a4cce1'),
    '--color-info': pair('#244b60', '#98cbe3'),
    '--color-success': pair('#125331', '#94d5af'),
    '--color-secondary-foreground': pair('#253b48', '#edf4f8'),
    '--color-danger': pair('#8d2938', '#f2a4ad'),
    '--demo-warning-ink': pair('#713d00', '#f4cb7b'),
    '--demo-badge-ink-lightness': '',
    '--demo-backdrop': 'linear-gradient(125deg in srgb, var(--demo-backdrop-blue), var(--demo-backdrop-middle) 52%, var(--demo-backdrop-rose))',
  },
};
