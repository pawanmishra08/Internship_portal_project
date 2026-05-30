# Demo Preparation TODOs

A concise checklist and file-level mapping for the live demo changes.

## Overview
These tasks prepare the frontend for a product demo (no backend changes). Keep TypeScript strict and preserve the existing Tailwind visual language.

---

## Checklist

- [ ] Replace AuthPage hero panel
  - File: [frontend/src/pages/AuthPage.tsx](frontend/src/pages/AuthPage.tsx)
  - Replace technical docs with a marketing left panel: headline, 3 benefit bullets, 3 stat cards.

- [ ] Fix Dashboard score rounding
  - File: [frontend/src/pages/DashboardPage.tsx](frontend/src/pages/DashboardPage.tsx)
  - Replace `Math.round(recommendation.score * 100)` with `Math.round(recommendation.score)`.

- [ ] Add missing skills display (Dashboard)
  - File: [frontend/src/pages/DashboardPage.tsx](frontend/src/pages/DashboardPage.tsx)
  - Add: `Missing: {recommendation.missing_skills.join(', ') || 'None'}` below matched skills.

- [ ] Remove embedded student quick-update form (Dashboard)
  - File: [frontend/src/pages/DashboardPage.tsx](frontend/src/pages/DashboardPage.tsx)
  - Remove the `<form onSubmit={handleStudentSubmit}>` block and its related state (`studentForm`, `studentSaving`, `studentMessage`, `handleStudentSubmit`). Profile editing is handled on the profile page.

- [ ] Replace Sidebar emojis with SVGs
  - File: [frontend/src/components/Sidebar.tsx](frontend/src/components/Sidebar.tsx)
  - Replace emoji icons with 24px stroke SVGs for: Dashboard, Internships, Applications, Companies, Profile, Students.

- [ ] Add application functions to API
  - File: [frontend/src/api/applications.ts](frontend/src/api/applications.ts)
  - Add `createApplication(payload: { job: number; cover_letter: string })` and `updateApplicationStatus(id: number, status: string)` (use `apiPost` and `apiPatch` from `./client`).

- [ ] Add search bar to Internships page
  - File: [frontend/src/pages/InternshipsPage.tsx](frontend/src/pages/InternshipsPage.tsx)
  - Add text input filtering jobs client-side by title or company.

- [ ] Add Apply modal and flow to Internships page
  - File: [frontend/src/pages/InternshipsPage.tsx](frontend/src/pages/InternshipsPage.tsx)
  - State: `selectedJob`, `coverLetter`, `applying`, `applyError`, `applySuccess`.
  - Add "Apply now" button (students only) to open modal.
  - Modal: cover letter textarea (min 50 chars), Submit → POST `/api/applications/` payload `{ job, cover_letter }` via `createApplication`.
  - On success: close modal and show transient success message (3s). On error: show error in modal.

- [ ] Show stipend, duration, and formatted deadline on job cards
  - File: [frontend/src/pages/InternshipsPage.tsx](frontend/src/pages/InternshipsPage.tsx)
  - Stipend: `Rs. {min}–{max}/mo` or `Stipend: Negotiable`.
  - Duration: badge `{duration_months} months` or `Duration TBD`.
  - Deadline: `Apply by {formatted date}` using `Intl.DateTimeFormat`.

- [ ] Add status management controls in Applications page (company view)
  - File: [frontend/src/pages/ApplicationsPage.tsx](frontend/src/pages/ApplicationsPage.tsx)
  - Add buttons: Shortlist (outline blue), Accept (green filled), Reject (outline red).
  - Each button PATCHes `/applications/{id}/status/` with `{ status }`. Optimistically update local state; revert and show error if request fails.
  - Disable buttons when status is `accepted` or `rejected`.

- [ ] Add avatar initials and profile prompt in Navbar
  - File: [frontend/src/components/Navbar.tsx](frontend/src/components/Navbar.tsx)
  - Show 36px circular initials derived from `user.full_name` (first letters of first & last words) to the left of the name.
  - For students, show a small `Complete your profile →` link pointing to `/profile` under the name.

- [ ] Run TypeScript checks and quick smoke test
  - Commands:

```bash
# from frontend/
pnpm install   # or npm install if you use npm
pnpm run dev   # start Vite dev server
pnpm run build # optional production build
# run TypeScript check
pnpm tsc --noEmit
```

- [ ] Manual UI review and demo polish
  - Verify Tailwind classes, spacing, color consistency, and that all new UI matches existing visual language.

- [ ] Commit changes
  - Create a focused commit with all frontend changes and a clear message: `demo: prepare frontend for live demo (auth, dashboard, internships, applications, sidebar, navbar)`.

---

If you want, I can now: implement the next TODO (pick one), run a TypeScript check, or open a PR. Which should I do next?
