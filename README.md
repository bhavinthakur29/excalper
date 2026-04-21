# Excalper — Version 1 Technical Reference

This document describes the **current** Excalper application as shipped in the V1 personal-expense-tracker era. Use it for onboarding, audits, and handoffs.

---

## Tech Stack

| Layer | Choice | Notes |
|--------|--------|--------|
| **Build** | [Vite](https://vitejs.dev/) | Fast dev server and optimized production builds (`vite build`). |
| **UI Library** | [React 19](https://react.dev/) | Functional components, hooks. |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Integrated via the **official Vite plugin** (`@tailwindcss/vite`) in `vite.config.js` — not the legacy PostCSS-only pipeline. |
| **Component library** | [shadcn/ui](https://ui.shadcn.com/) | New York–style primitives: `Button`, `Card`, `Input`, `Label`, `Badge`, `Dialog`, `Separator`, etc., under `src/components/ui/`. |
| **Icons** | [Lucide React](https://lucide.dev/) (primary), [react-icons](https://react-icons.github.io/react-icons/) (e.g. Google on login) | |
| **Motion** | [Framer Motion](https://www.framer.com/motion/) | Page sections on the Home dashboard (e.g. hero and recent expenses). |
| **Routing** | [React Router v7](https://reactrouter.com/) | `BrowserRouter`, private/public route guards. |
| **Backend** | [Firebase](https://firebase.google.com/) | Auth + Cloud Firestore; per-user `expenses` subcollections. |
| **Fonts** | [Geist Variable](https://vercel.com/font) via `@fontsource-variable/geist` | Loaded from `src/main.jsx`. |
| **Toasts** | [react-toastify](https://fkhadra.github.io/react-toastify/) | Global `ToastContainer` in `App.jsx`. |

**Configuration highlights**

- **Path alias:** `@/` → `src/` (`vite.config.js`, `jsconfig.json`).
- **Entry CSS:** `src/index.css` — `@import "tailwindcss"`, shadcn theme tokens (`@theme` / CSS variables), `tw-animate-css`, and `shadcn/tailwind.css`.
- **ESLint** — project lint via `bunx eslint` / `npm run lint` (see `package.json`).

---

## UI Architecture

### Global layout (`src/App.jsx`)

- **Shell:** `min-h-screen flex flex-col bg-background font-sans antialiased`.
- **Centering:** A single **`<main>`** wraps all routes with:
  - `max-w-2xl mx-auto` so content is **centered and width-capped** on large screens.
  - Responsive padding: `p-4 sm:p-6 md:p-8`.
  - Bottom padding: `pb-24 sm:pb-8` so content clears the **mobile bottom navigation** (see below).
- **Navigation:** `Navbar` (top) and `BottomNav` (mobile-only, after `</main>`).
- **Toasts:** `ToastContainer` sits beside the main layout tree (still inside `Router`).

Individual pages use a light wrapper (e.g. `space-y-6 animate-in fade-in duration-500`) for vertical rhythm and route transitions — **not** duplicate `max-w` containers.

### Sticky, glass-style top bar

- **`Navbar`** (`src/components/Navbar/Navbar.jsx`): Sticky top bar with `border-b`, `bg-background/95`, `backdrop-blur`, and optional shadow on scroll.
- **Inner width** aligns with main: `container flex h-14 max-w-2xl mx-auto … px-4 sm:px-6 md:px-8`.
- **Desktop:** Logo (with icon) on the **left**; **text-only** nav links on the **right** (`hidden sm:flex gap-6`) — Home, Expenses, Settings.
- **Mobile:** No hamburger; primary navigation is the **bottom tab bar**.

### Mobile-first and bottom navigation

- **`BottomNav`** (`src/components/BottomNav.jsx`): Fixed bar, `h-16`, `sm:hidden`, same visual language as the top bar (blur + border-t).
- Uses **Lucide** icons (e.g. Home, CreditCard, Settings) with labels; active state derived from `useLocation` (including `/expense-form` under “Expenses”).
- **Logout** is intentionally **not** in the navbar; users sign out from **Settings**.

### shadcn + Tailwind

- Form controls and surfaces use shadcn components styled with **Tailwind** utilities and design tokens (`background`, `foreground`, `primary`, `muted`, `border`, etc.).
- **Dialogs** use Radix via `Dialog`, `DialogContent`, `DialogHeader`, `DialogFooter` (e.g. edit expense, delete confirm, settings password).
- **Button** variants include shared motion/feedback: `transition-all`, `active:scale-[0.96]`, `hover:opacity-90`, and `cursor-pointer` on the base `cva` string.

---

## Key UX Features

| Feature | Implementation |
|--------|-------------------|
| **Tactile buttons** | shadcn `Button` base classes include scale-down on press (`active:scale-[0.96]`) and quick transitions for a native-app feel. |
| **Dialog action spacing** | `DialogFooter` uses `gap-3` / `sm:gap-4` so **Save / Cancel** (and similar pairs) never touch. |
| **Mobile bottom tabs** | `BottomNav` is the primary mobile nav; no off-canvas drawer. |
| **“Banking-style” expense rows** | On **Home** and **Expenses**, list rows use a **horizontal** layout: left column = title + **badges** (date, category) in a tight row; right = amount (and on Expenses, icon buttons for edit/delete). |
| **Read-only sign-in email** | In **Settings**, the email field is **read-only**, muted styling, and **not** written by save logic — see [Logic](#logic--data-behavior). |
| **Global pointer affordance** | `index.css` sets `cursor: pointer` on `button`, `[role="button"]`, `a`, and `select` for consistent clickability. |
| **Page fade-in** | Page wrappers can use `animate-in fade-in duration-500` (via `tw-animate-css`) for a subtle enter animation. |

---

## Logic and Data Behavior

### Firebase

- **Authentication:** Email/password and Google (see `AuthContext` and `Login`).
- **Firestore structure:** For each user UID, data lives under `users/{uid}/…` (e.g. `users/{uid}/expenses` for transactions).
- **Profile avatar:** Can be stored as base64 on the user document in Firestore (Settings upload flow); dedicated Storage migration may be a future improvement.

### Timestamps and dates

- Expense `timestamp` is stored as a Firestore **`Timestamp`**, often created with `Timestamp.fromDate(new Date(\`${date}T00:00:00\`))` for the selected calendar day.
- Utilities in `src/utils/timestamps.js` (e.g. `toJsDate`, `monthKeyFromTimestamp`) normalize reads for sorting and month filters.
- **New expense default date:** The add form initializes the date to **today** in `YYYY-MM-DD` form (e.g. `toLocaleDateString('en-CA')`) for correct `<input type="date" />` binding.

### Settings profile save

- **Display name** can be updated via Firebase Auth `updateProfile` and mirrored to Firestore when possible.
- **Email is read-only in the UI** and **must not** be changed through this flow: `updateEmail` is not used for the profile form; the field is `readOnly` with disabled-looking styles so users cannot treat it as an editable sign-in address from this screen.

### Routing

| Path | Access | Purpose |
|------|--------|--------|
| `/login` | Public (redirect if logged in) | Sign in |
| `/` | Private | Home dashboard |
| `/expenses` | Private | Full expense list & filters |
| `/expense-form` | Private | Add expense |
| `/settings` | Private | Profile, security, account actions |
| `*` | — | Redirect to `/` |

---

## Project Layout (selected)

```text
src/
  App.jsx                 # Layout shell, routes, ToastContainer
  main.jsx                # Geist + global CSS
  index.css               # Tailwind + theme + optional legacy helpers
  components/
    ui/                   # shadcn primitives
    Navbar/Navbar.jsx
    BottomNav.jsx
    Modal/                # shared confirm modal; EditExpenseModal
    Loading/Loading.jsx
  pages/                  # Home, Expenses, ExpenseForm, Settings, Login
  contexts/AuthContext.jsx
  config/firebase.js
  utils/timestamps.js
```

---

## Conventions

- Prefer **shadcn + Tailwind** for new UI; avoid introducing parallel global CSS for components unless necessary.
- Keep **one column width** story: `max-w-2xl` on `main`, nav inner containers aligned to the same max width and horizontal padding.
- **Accessibility:** Use semantic nav regions, `aria-label` / `aria-current` on nav links, and dialog titles from `DialogTitle`.

---

*Last aligned with the repository’s V1 “single-user personal expense tracker” scope. For planned enhancements, see `EXCALPER_V2_ROADMAP.md`.*
