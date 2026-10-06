# altpro/ui

- This app styles its UI with altpro/ui, a component layer over Tailwind v4. Tailwind does layout; altpro/ui classes, Blade (`<x-ui::…>`) and Vue components do the components.
- IMPORTANT: Activate the `altpro-ui` skill before writing or changing any markup, even where `tailwindcss-development` also fits. Read the component's reference file before using it.
- Use an altpro/ui class or component where one exists. Never rebuild buttons, inputs, badges, cards, tables, dialogs and the like out of utilities.
- Classes are a base class plus bare modifier words: `btn primary sm`, never `btn-primary` or `btn btn-primary`.
- The colour names are `primary`, `secondary`, `info`, `success`, `warning` and `danger`: write `danger`, not `destructive` or `error`.
- Colours come from the theme tokens (`bg-primary`, `text-muted-foreground`), which already follow light and dark. Do not add `dark:` variants for them.
- An app made with Laravel's own `laravel new --vue` has shadcn's `@theme inline` tokens in `resources/css/app.css`, and they override altpro/ui's (`--color-primary` becomes `#171717`, `--radius` `.5rem`). Start the app from the altpro Vue starter kit instead.
