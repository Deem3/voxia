# Theming

## Goals

- **Light**, **dark**, and **system** (follow OS) modes with a single semantic token map.
- **Tailwind v4** uses `@custom-variant dark (&:is(.dark *));` so `dark:` utilities apply under an ancestor with class `dark` (see [src/App.css](src/App.css)).
- **`next-themes`** drives the `dark` class on `document.documentElement` with `attribute="class"`.

## `next-themes` configuration

Configured in [src/main.tsx](src/main.tsx) on `ThemeProvider`:

| Option | Value |
|--------|--------|
| `attribute` | `"class"` |
| `defaultTheme` | `"system"` |
| `enableSystem` | `true` |
| `storageKey` | `"voxia-ui-theme"` |
| `disableTransitionOnChange` | `true` |

## Plugin-store vs DOM (authoritative on boot)

- Zustand [useSettingsStore](src/store/useSettingsStore.ts) persists `theme: 'light' \| 'dark' \| 'system'` via `tauri-plugin-store` (`settings.json`).
- After **`hydrate()`** completes, [ThemeSync](src/components/theme-sync.tsx) runs `useLayoutEffect` and calls `next-themes` **`setTheme(storedTheme)`** once so the persisted value wins over any stale `localStorage` entry for `voxia-ui-theme`.

## Dual writes (user actions)

Any control that changes appearance (header [ModeToggle](src/components/mode-toggle.tsx) or Settings **Appearance** radios) must:

1. Call **`setTheme`** from `useTheme()` (`next-themes`).
2. Call **`useSettingsStore.getState().setTheme(...)`** so the plugin-store stays aligned (that setter already triggers `persist()`).

## CSS variables

Semantic OKLch tokens live under `:root` and `.dark` in [src/App.css](src/App.css). Tailwind maps them in `@theme inline` (e.g. `--color-background: var(--background)`). **`--radius`** is **`0`** for square corners app-wide.

## Provider order

`ThemeProvider` → `ThemeSync` → `QueryClientProvider` → `RouterProvider` (see [src/main.tsx](src/main.tsx)). `ThemeSync` must stay inside `ThemeProvider` so `useTheme()` is defined.

## Optional follow-ups (later phases)

- Inline boot script or `suppressHydrationWarning` if a future SSR or pre-paint theme flash appears (currently client-rendered only).
- Tauri `Window::set_theme` when `resolvedTheme` changes (Phase 8 polish in [spec/plan.md](../spec/plan.md)).
