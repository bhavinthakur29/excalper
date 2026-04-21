# Excalper — Version 2 Roadmap

This file is the **working backlog** for the next major iteration of Excalper. Items are suggested priorities for discussion, not a fixed contract or release date.

---

## 1. Data visualization — category spending

**Goal:** Give users an at-a-glance understanding of *where* money goes, not just totals and lists.

**Idea:** Animated **donut (or multi-ring) charts** for **category-wise spending**, using [**Recharts**](https://recharts.org/) (or a similarly mature React charting library).

**Scope notes**

- Time filters should align with existing month / range concepts where possible.
- Keep bundle size in mind: lazy-load chart code on the dashboard or a dedicated “Insights” view.
- Match the V1 design system: neutral surfaces, `muted-foreground` labels, accessible color contrast and legends.

**Definition of done (draft)**

- [ ] Chart reflects filtered expenses (e.g. current month) with correct category aggregation.
- [ ] Chart is responsive; touch-friendly on mobile.
- [ ] Empty state when there is no categorized data.

---

## 2. Loading states — shimmering skeletons

**Goal:** Replace any remaining “empty” or generic loading moments with **polished, layout-aware skeleton UIs** (shimmer / pulse), so users see *structure* while data loads.

**Idea:** Extend the pattern used on auth loading / dashboard-style placeholders across:

- [ ] All primary routes (Home, Expenses, Expense form entry, Settings as needed).
- [ ] **List rows** and **cards** that match final layout to avoid layout shift when content appears.

**Scope notes**

- Reuse `tailwind` + `bg-muted` + `animate-pulse` (or a dedicated shimmer utility) consistently with the existing `tw-animate-css` / design tokens.
- *V1 may already use pulse skeletons in some places* — V2 is about **full coverage** and a single visual language (optionally a shared `Skeleton` shadcn component).

---

## 3. State management — TanStack Query (React Query)

**Goal:** Improve **caching, deduplication, background refresh**, and **error/retry** behavior for all Firestore-backed reads and mutations.

**Idea:** Introduce [**TanStack Query**](https://tanstack.com/query/latest) (`@tanstack/react-query`).

**Planned work**

- [ ] Add `QueryClient` + `QueryClientProvider` at the app root.
- [ ] Create focused hooks, e.g. `useExpenses`, `useMonthlyTotals`, `useUserProfile`, wrapping Firebase calls.
- [ ] Wire mutations (add / edit / delete expense) with **optimistic updates** where safe, and **invalidation** of related queries.
- [ ] Deprecate ad-hoc `useEffect` + `useState` fetch patterns per page over time.

**Definition of done (draft)**

- [ ] No duplicate fetches for the same data when navigating between Home ↔ Expenses.
- [ ] Document query keys in one place to avoid cache bugs.

---

## 4. Progressive Web App (PWA)

**Goal:** **Offline-first** capability so users can *capture* expenses when connectivity is poor, and sync when back online (exact behavior TBD with product requirements).

**Idea:** Add a PWA **service worker** + **web app manifest** (e.g. via Vite plugin such as `vite-plugin-pwa` or equivalent).

**Planned work**

- [ ] Define installable app metadata (name, icons, theme color).
- [ ] Cache shell / static assets; **strategy for Firestore offline** (Firebase’s built-in offline persistence vs. local queue) needs a short design pass.
- [ ] UX: clear “offline” / “pending sync” indicators.

**Risks**

- Conflict resolution for edits made offline vs. on server must be specified before implementation.

---

## 5. Notifications — subtle, consistent feedback

**Goal:** Strengthen user confidence with **subtle, non-intrusive** feedback for success and important failures.

**Context:** V1 already uses **react-toastify** with a global `ToastContainer` in `App.jsx`. V2 is about **refinement**, not adding a second notification system.

**Idea:** Standardize *when* and *how* toasts fire:

- [ ] **Success:** Short copy, default position, soft styling aligned with the UI (e.g. duration, one toast at a time for the same action).
- [ ] **Errors:** Actionable where possible; avoid duplicate toasts for the same mutation.
- [ ] **Optional:** In-app “notification center” or banner only if product requires it; otherwise keep toasts + inline form errors.

**Definition of done (draft)**

- [ ] Document toast usage in a one-page **contribution / UX note** (when to use toast vs. inline error).
- [ ] Optional: light theme for Toastify to better match shadcn tokens.

---

## Cross-cutting V2 themes

| Theme | Notes |
|--------|--------|
| **Performance** | Code-splitting for charts, heavy modals, and query-heavy pages. |
| **Accessibility** | Charts need text alternatives; motion respects `prefers-reduced-motion` where new animations are added. |
| **Testing** | Add smoke tests for query hooks and critical Firebase flows (even lightweight). |

---

## How to use this file

- Turn sections into **GitHub issues** or project cards when you start an initiative.
- Link PRs to a single roadmap item to keep history traceable.
- Update this document when scope changes or an item ships.

---

*Excalper V2 is forward-looking; V1 reference: `EXCALPER_V1_REFERENCE.md`.*
