# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CEEAM (Club des Étudiants et Élèves en Afrique et au Monde) is a student association web platform with a Django REST Framework backend and a React + Vite + TypeScript frontend. Both live in the same repository under `backend/` and `frontend/`.

## Commands

### Frontend (`frontend/`)

```bash
npm run dev          # Start dev server on port 8080
npm run build        # Production build
npm run lint         # ESLint check
npm run test         # Run tests once (Vitest)
npm run test:watch   # Run tests in watch mode
```

### Backend (`backend/backend/`)

```bash
python manage.py runserver           # Start Django on port 8000
python manage.py migrate             # Apply migrations
python manage.py makemigrations      # Create migration files
python manage.py createsuperuser     # Create admin user
python manage.py seed_data           # Seed dev data (see backend/SETUP.md)
```

The frontend Vite dev server proxies `/api` and `/media` to `http://localhost:8000`, so both servers must run simultaneously during development.

## Architecture

### Frontend Structure

```
frontend/src/
├── App.tsx              # Router — 39 routes across 3 user types
├── services/
│   ├── api.config.ts    # Centralized HTTP client, auth cache, CSRF handling
│   └── *.ts             # Domain services (authService, activityService, etc.)
├── hooks/               # Custom hooks that wrap services and manage local state
├── pages/
│   ├── Visitors/        # Public routes (no auth)
│   ├── ConnectedUsers/  # Auth-required routes
│   └── laureats/        # Laureat-role routes
└── components/
    ├── ui/              # Shadcn-style primitives (Radix UI based)
    └── */               # Feature-specific components
```

**Data flow:** Component → Hook → Service → `api.config.ts` → Django backend, with React Query managing caching and server state.

### Authentication & Authorization

- JWT tokens are stored in **HttpOnly cookies** (handled server-side). The frontend never reads the token directly.
- **In-memory user cache** only — `getCachedUser()`, `setCachedUser()`, `clearUserCache()` in `api.config.ts`. No user data in localStorage.
- Auto token refresh on 401 via `api.config.ts` interceptor hitting `/api/auth/refresh/`.
- Route protection uses `<ProtectedRoute>` with `allowedRoles` / `requiredRole` props.
- Roles: `student`, `bureau`, `admin`, `adminpromo`, `laureat`.

### API Layer Pattern

Services in `frontend/src/services/` wrap domain logic. All HTTP calls go through the methods exported by `api.config.ts` (not `fetch`/`axios` directly). Use custom hooks in `hooks/` to consume services — hooks own loading/error state.

Error handling uses a custom `ApiError` class with helpers `isAuthError()`, `isValidationError()`, `isServerError()`.

### Backend Structure

```
backend/backend/
├── api/
│   ├── models.py        # 25+ models (User, Activity, Vote, Notification, etc.)
│   ├── views.py         # ViewSets & APIViews
│   ├── serializers.py   # DRF serializers
│   └── urls.py          # App-level URL patterns
└── backend/
    ├── settings.py      # Django config (SQLite dev / PostgreSQL prod)
    └── urls.py          # Root URL conf — mounts /api/
```

The `User` model extends `AbstractUser` with email-based login. See `backend/API_DOCUMENTATION.md` for all 25+ endpoint specs.

### State Management

- **React Query** — all server state (caching, background refetch, deduplication).
- **useState / useCallback** — local UI state only.
- **No Redux or Zustand.** The only global state beyond React Query is the in-memory user cache.

## Key Conventions

- **camelCase in frontend, snake_case in backend** — serializers handle the translation.
- API paginated responses shape: `{ count, next, previous, results }`.
- UI components follow Shadcn patterns (Radix UI primitives + Tailwind). Add new primitives in `components/ui/`.
- Forms use **React Hook Form + Zod** for validation — all form schemas should be defined as Zod schemas.
- Liked activities use localStorage (`LIKED_ACTIVITIES` key) for optimistic UI — this is the only intentional localStorage usage.

## Planned / In-Progress Features

- **Classroom module** — resource library by class/specialty. Route `/classroom` exists; CPanel CRUD integration planned. See `todo.md` for full spec.

## Documentation References

- `backend/API_DOCUMENTATION.md` — complete API endpoint reference
- `backend/SETUP.md` — backend installation and database seeding
- `CONTEXTE_PROJET.md` — comprehensive French project overview
