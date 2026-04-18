# Instelle

Instelle is a personal notebook app with secure Supabase authentication.
Users can organize notebooks, create notes, and write structured page blocks
inside each note.

## What the app does

- Authenticates users with Supabase (sign up, sign in, sign out).
- Supports forgot-password email recovery and in-app password change.
- Lets each user manage their own notebook collection.
- Lets each notebook contain multiple notes.
- Lets each note contain multiple editable blocks (called pages in the DB).
- Persists all user content in Supabase with row-level security.

## Core features

- Notebook management:
  - Create, rename, delete notebooks.
  - Drag-and-drop notebook ordering in the sidebar.
  - Notebook order persisted per user in local storage.
- Note management:
  - Create and delete notes inside a notebook.
  - Per-notebook note filtering by title.
  - Note cards show a preview from the first content block.
- Block-based editor:
  - Block types: heading, subheading, paragraph, checkbox list, bullet list,
    numbered list.
  - Add blocks from the footer action bar.
  - Reorder blocks with drag-and-drop.
  - Duplicate-friendly editing with block copy action.
  - Save manually with Ctrl+S / Cmd+S.
  - Find within current note with Ctrl+F / Cmd+F.
- Global search:
  - Open with Ctrl+K / Cmd+K.
  - Search notebooks by title.
  - Search notes by title across the account.
- Navigation safeguards:
  - Unsaved-change guard prompts before leaving an edited note.
  - Browser unload warning while note edits are unsaved.
- Theme:
  - Light/dark mode toggle persisted in local storage.

## Authentication and password flows

- Forgot password:
  - Auth screen can send a recovery email.
  - Recovery link redirects to `/reset-password`.
  - User sets a new password on the recovery screen.
- Logged-in password change:
  - Settings modal lets users update password in-app.
  - Current password is required.
  - If current password is wrong, password update is blocked.

## Tech stack

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- Supabase (auth + Postgres)
- React Icons

## Database model

The app uses three main tables:

- `notebooks`
- `notes`
- `pages`

Each table stores `user_id` and is protected by row-level security policies so
users only access their own rows.

Schema and policies are in `schema.sql`.

## Local development

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create `.env` in project root:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Set up database

Run the SQL in `schema.sql` inside Supabase SQL editor.

### 4. Run the app

```bash
npm run dev
```

### 5. Build production bundle

```bash
npm run build
```

## Supabase auth URL configuration

In Supabase Dashboard:

1. Go to Authentication -> URL Configuration.
2. Set Site URL to your main app URL.
3. Add allowed Redirect URLs, including password recovery routes.

Recommended entries:

- `http://localhost:5173/reset-password`
- `https://your-production-domain.com/reset-password`
- Optional Vercel preview wildcard:
  `https://*-your-project.vercel.app/reset-password`

If reset-password URLs are not allowlisted, recovery links may fail or redirect
incorrectly.

## Deploying to Vercel

This project includes `vercel.json` with a rewrite to `index.html` for all
routes. This is required because the app is a client-side SPA and routes like
`/reset-password` must resolve to the app shell.

Also set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel Project
Settings -> Environment Variables.

## Scripts

- `npm run dev` starts local development server.
- `npm run build` type-checks and builds production assets.
- `npm run preview` serves the production build locally.
- `npm run lint` runs ESLint.
