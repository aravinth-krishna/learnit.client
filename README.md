# Learnit Client (React + Vite)

Front-end for Learnit, a learning planner with AI drafting, course management, scheduling, progress dashboards, and profile settings. Runs on Vite with React Router and CSS modules and talks to the ASP.NET Core API through the `/api` proxy.

## Features

- Authentication: signup/signin, route guards, token-aware HTTP client.
- Courses: create/edit with nested modules, AI auto-draft, module tree, and CRUD.
- Scheduling: calendar (FullCalendar), manual events, auto-schedule modules, link/unlink modules.
- Progress: charts (Recharts) for completions and activity.
- Profile: theme and account settings.
- AI: chat assistant, course draft generation, schedule/progress insights, friend compare.

## Prerequisites

- Node.js 18+ and npm.
- Backend API running locally (see server README) reachable at `/api` via Vite proxy.

## Setup

1. Install deps

```
npm install
```

2. Run the dev server (HTTPS, proxied to backend)

```
npm run dev
```

3. Optional helpers

- `npm run dev:chrome` to open Chrome at the dev URL.
- `npm run lint` for linting.
- `npm run build` then `npm run preview` to simulate production.

## Configuration notes

- Vite proxy: API calls are relative (`/api/*`); backend should listen on the proxied HTTPS address configured in `vite.config.js`.
- Auth: JWT is stored in `localStorage`; `http.js` adds `Authorization: Bearer <token>` when present.
- AI keys are set on the backend; the client does not store them.

## Project structure (high level)

- `src/router.jsx` routing and layouts (`src/layouts`).
- `src/components/main/*` feature pages (Course, Schedule, Progress, Profile, AI).
- `src/components/course/*` course widgets (modals, module tree, cards, details).
- `src/components/auth/*` auth screens and guards.
- `src/services/*` HTTP wrapper and domain APIs (`authApi`, `courseApi`, `scheduleApi`, `profileApi`, `progressApi`, `aiApi`).
- `src/context/*` auth and theme providers.

## Workflows

- Course AI draft: open create/edit modal → “Ask AI” tab → describe the course → AI fills fields and modules; you can tweak manually.
- Auto-schedule: on Schedule page click auto-schedule to place modules into workday slots with buffers.
- AI chat/insights: use AI page for chat, scheduling help, progress insights, and friend comparison.

## Troubleshooting

- If API calls fail in dev, ensure the backend is running and HTTPS dev certs are trusted.
- Clear `localStorage` if auth tokens become stale.
- For UI runtime errors, check browser console; the code logs AI draft payloads during course generation.

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
