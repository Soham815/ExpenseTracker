# Expense Tracker

A generic, multi-user expense tracker: personal spending by category with charts, and
group expense splitting with friends — sign up with your name, mobile number, and a
PIN; each account's data is private to that account.

Same tech stack as before: React (Vite) frontend, Express backend, Supabase (Postgres)
database.

## 1. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** and run the contents of `backend/supabase/schema.sql`.
3. Go to **Project Settings → API** (or **Data API** on newer UIs) and copy your
   **Project URL** and **service_role key** (not the anon key).

## 2. Quickest local setup (one command)

```bash
npm install          # installs the root "concurrently" tool
npm run install:all  # installs backend + frontend dependencies
```

Then create `backend/.env` from `backend/.env.example`:

```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
JWT_SECRET=some-long-random-string
PORT=4000
```

Then run both servers together:

```bash
npm run dev
```

Backend runs on `:4000`, frontend on `:5173` (proxies `/api` to the backend
automatically in dev — see `frontend/vite.config.js`).

## 3. Create an account

Open `http://localhost:5173`, click "Create one," and sign up with a name, mobile
number, and a PIN (at least 4 characters). Everything you add afterward — expenses,
friends, activities — is scoped to that account only.

## How it works

**Personal expenses** — log an expense (amount, category, optional note, date). Nine
default categories are seeded automatically on signup (Food & Dining, Groceries,
Transport, Housing, Bills & Utilities, Shopping, Health & Fitness, Entertainment, Group
Expenses), and you can add your own anytime. See this month's and all-time totals, a
category breakdown pie chart (switch between any specific month via a date picker, or
all-time), and a year-by-year bar chart comparing monthly spend — the highest month
gets a plain factual note, not a joke. Below that, the full expense list is grouped by
month with a heading between each group.

**Group expenses** — add friends (name + mobile number), create an "activity" (e.g. a
trip), add friends to it, and log a cost with who paid — it's split equally across
everyone including you. A "balances" section shows the simplified minimum set of
settlements needed (standard debt-simplification, same approach as apps like
Splitwise). Each line has a WhatsApp reminder button (opens `wa.me` with that friend's
number and a plain pre-filled message) and a "mark settled" button. If you're the one
settling up, it automatically logs a personal expense under "Group Expenses" too.
Toggle an activity "done" to move it out of the active list.

## Deploying (same pattern as before)

**Backend (Render, or similar):** root directory `backend`, build command
`npm install`, start command `npm start`. Set `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, and `JWT_SECRET` as environment variables. Don't set
`PORT` — the host sets that automatically and `server.js` already reads
`process.env.PORT`.

**Frontend (Netlify, or similar):** root directory `frontend`, build command
`npm run build`, publish directory `dist`. Set `VITE_API_URL` to your deployed backend
URL (no trailing slash) — Vite bakes this in at build time, so redeploy with cache
cleared after setting/changing it. `frontend/public/_redirects` is already included for
SPA routing (Netlify-specific; if you deploy elsewhere, check that host's equivalent).

## Project structure

```
ExpenseTracker/
  backend/
    routes/           auth, expenses, friends, activities
    middleware/        authMiddleware.js (JWT verification)
    utils/             calculations.js, splitCalculations.js (group-split math)
    supabase/schema.sql
  frontend/
    src/pages/         Login, Signup, Expenses, GroupExpenses
    src/components/    Navbar, ExpenseCharts, FriendsManager, ActivityCard
    src/styles/        one CSS file per component/page
    src/utils/         expenseCategories.js, whatsapp.js
```
