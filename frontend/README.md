# Frontend: Spring Todolist web app

The Angular single-page application of the todo list. It covers the whole backend API: login and registration, tasks, categories, the user's profile, and user administration.

This file is the developer guide for the `frontend/` folder. For the API it calls and the access rules, see the [root README](../README.md) and the [backend README](../backend/README.md).

---

## Table of contents

- [Tech stack](#tech-stack)
- [Quick start](#quick-start)
- [Screens](#screens)
- [Folder layout](#folder-layout)
- [Architecture](#architecture)
- [Talking to the backend](#talking-to-the-backend)
- [Styling and accessibility](#styling-and-accessibility)
- [Tests](#tests)
- [Adding a new page](#adding-a-new-page)
- [Build and Docker image](#build-and-docker-image)
- [npm scripts](#npm-scripts)
- [Conventions](#conventions)

---

## Tech stack

| Area          | Technology                                                       |
|---------------|------------------------------------------------------------------|
| Framework     | Angular 22: standalone components, signals, zoneless change detection |
| Language      | TypeScript 6 (strict mode)                                       |
| UI components | Angular Material 22 and the CDK (Material 3 theme)               |
| Icons         | Material Symbols Outlined (Google Fonts)                          |
| HTTP          | `HttpClient` with a functional interceptor                       |
| Forms         | Typed reactive forms (`NonNullableFormBuilder`)                  |
| Tests         | Vitest 5 with jsdom, through the Angular CLI `unit-test` builder |
| Build         | Angular CLI (`@angular/build`, esbuild)                          |
| Serving       | nginx (`nginx-unprivileged`) in Docker                           |
| Formatting    | Prettier (`.prettierrc`) and `.editorconfig`                     |

---

## Quick start

### With Docker Compose (recommended)

From the project root:

```bash
cp .env.example .env      # then set APP_JWT_SECRET
docker compose up -d --build
```

Open <http://localhost:4200>. nginx serves the app and forwards `/api` to the `backend` service.

### With the Angular dev server

You need **Node.js 22.22+ or 24**. The backend must be running on `http://localhost:8080`, either with Gradle or with `docker compose up -d backend`.

```bash
cd frontend
npm ci
npm start
```

The app is served on <http://localhost:4200> with live reload. [`proxy.conf.json`](proxy.conf.json) forwards `/api` to `http://localhost:8080`.

### Getting an admin account

Registration always creates a plain user. To see the **Utilisateurs** screen, set `APP_ADMIN_USERNAME`, `APP_ADMIN_PASSWORD` and `APP_ADMIN_EMAIL` in `.env`, restart the backend, and log in with that account. See [The initial admin account](../backend/README.md#the-initial-admin-account).

---

## Screens

The interface is in French.

| Route          | Guard        | Component          | Features |
|----------------|--------------|--------------------|----------|
| `/login`       | `guestGuard` | `LoginPage`        | Log in. The API's message is shown when the credentials are wrong |
| `/register`    | `guestGuard` | `RegisterPage`     | Create an account, then log in automatically |
| `/tasks`       | `authGuard`  | `TaskListPage`     | Tasks sorted newest first, filter by category, create, edit, delete |
| `/categories`  | `authGuard`  | `CategoryListPage` | Categories sorted by label, colour picker, create, edit, delete. The 409 message is shown when a category is still used |
| `/profile`     | `authGuard`  | `ProfilePage`      | Edit first name, last name, email and password. An empty password keeps the current one |
| `/admin/users` | `adminGuard` | `UserListPage`     | List, create, edit (including roles) and delete users. You cannot delete your own account |

The site opens on the login form: `/` and any unknown route redirect to `/login`. A user who is already logged in is sent on to `/tasks` by `guestGuard`, and lands there after logging in or registering. Each route sets the page title.

The shell ([`app.ts`](src/app/app.ts) and [`app.html`](src/app/app.html)) shows a toolbar with the navigation links and a user menu (profile, logout). It shows the **Utilisateurs** link to admins only.

---

## Folder layout

```
frontend/
├── Dockerfile               Multi-stage image build
├── nginx.conf               nginx configuration used in the image
├── .dockerignore
├── proxy.conf.json          Dev server proxy: /api → http://localhost:8080
├── angular.json             Workspace config: build, serve, test, budgets
├── package.json, package-lock.json
├── tsconfig.json            Shared compiler options
├── tsconfig.app.json        App build (excludes *.spec.ts and src/testing)
├── tsconfig.spec.json       Tests (includes src/testing)
├── public/                  Static files copied as is (favicon)
└── src/
    ├── index.html           lang="fr", Roboto and Material Symbols fonts
    ├── main.ts              bootstrapApplication(App, appConfig)
    ├── styles.scss          Material theme and shared styles
    ├── testing/             Test helpers, never bundled in the app
    │   ├── mocks.ts         dialogMock(), notifierMock()
    │   └── tokens.ts        fakeToken()
    └── app/
        ├── app.ts, app.html, app.scss   Shell: toolbar, navigation, user menu
        ├── app.config.ts    Global providers
        ├── app.routes.ts    Lazy-loaded routes and guards
        ├── core/            Singletons used everywhere
        │   ├── models.ts           TypeScript mirror of the backend DTOs
        │   ├── notifier.ts         Snackbar messages, errorMessage()
        │   ├── api/api.services.ts CategoryService, TaskService, UserService
        │   └── auth/               AuthService, authInterceptor, guards
        ├── features/        One folder per screen
        │   ├── auth/               login-page, register-page
        │   ├── tasks/              task-list-page, task-dialog
        │   ├── categories/         category-list-page, category-dialog
        │   ├── profile/            profile-page
        │   └── admin/              user-list-page, user-dialog
        └── shared/          Reusable pieces with no state
            ├── confirm-dialog.ts   ConfirmDialog + confirm() helper
            ├── forms.ts            emptyToNull(), hexColorValidator
            └── role-label.pipe.ts  ROLE_ADMIN → "Administrateur"
```

Every `.ts` file under `src/app` has a `.spec.ts` file next to it. The exceptions are `models.ts`, which contains only types, and `shared/`, whose three files are tested together in `forms.spec.ts` and `shared.spec.ts`.

---

## Architecture

### Bootstrapping

[`app.config.ts`](src/app/app.config.ts) registers:

- the router, with the routes from `app.routes.ts`;
- `HttpClient`, with `authInterceptor`;
- the `fr-FR` locale, used for dates by the `date` pipe;
- an app initializer that makes `<mat-icon>` use the `material-symbols-outlined` font.

There is no `zone.js`: the app is **zoneless**, and change detection is driven by signals and events.

### Components

- Every component is **standalone** and declares its own `imports`.
- Pages and dialogs have **inline templates**. Their styles come from `styles.scss`, and only the shell has its own `.scss` file.
- Pages are **lazy-loaded** with `loadComponent`, so each one is a separate chunk.
- State is kept in **signals** (`signal`, `computed`). Templates use the built-in control flow (`@if`, `@for`).
- Dependencies are injected with `inject()`, not with constructor parameters.

### The page and dialog pattern

The list pages (tasks, categories, users) all follow the same flow:

```
Page ──open()──► Dialog (form)
  ▲                  │ closes with a request object, or undefined if cancelled
  │                  ▼
  └── load() ◄── Service.create/update ──► Notifier.success / Notifier.error
```

1. The page calls `MatDialog.open(XxxDialog, { data })`. `data` is `null` to create, or the item to edit.
2. The dialog builds a typed reactive form, validates it, and closes with a **request object** that is ready to send. It never calls the API itself.
3. The page filters out a cancelled dialog, calls the service, shows a snackbar, and reloads the list.

Deletion goes through `confirm(dialog, {...})` from `shared/confirm-dialog.ts`, which emits `true` only if the user confirms.

Because dialogs only return data, they are easy to test on their own, and pages can be tested with a fake `MatDialog`.

### Authentication

[`AuthService`](src/app/core/auth/auth.service.ts):

- keeps the JWT in a signal and in `localStorage` under the key `todolist.token`. If storage is unavailable, the token stays in memory;
- decodes the token payload (`decodeToken`) to expose `username` and `isAdmin` as computed signals. It **does not check the signature**: the backend does that on every request;
- `isAuthenticated()` compares `exp` with the current time on every call. A signal would not notice that time has passed;
- `login()` stores the token, and `logout()` removes it and navigates to `/login`.

[`authInterceptor`](src/app/core/auth/auth.interceptor.ts) adds `Authorization: Bearer <token>` to every `/api/...` request, except `/api/auth/...`. When a request that carried a token gets a **401**, it logs the user out. This happens when the token has expired or the account was deleted.

[Guards](src/app/core/auth/auth.guards.ts):

| Guard        | Lets through               | Otherwise redirects to |
|--------------|----------------------------|------------------------|
| `authGuard`  | Logged-in users            | `/login`               |
| `adminGuard` | Logged-in users with `ROLE_ADMIN` | `/login` if logged out, `/tasks` if not admin |
| `guestGuard` | Logged-out users           | `/tasks`               |

Guards only improve navigation: the backend enforces the real rules.

> [!NOTE]
> Roles are read from the token. If an admin changes their own roles, the interface changes at their next login.

---

## Talking to the backend

### Same origin, no CORS

The browser only ever calls its own origin, and every URL starts with `/api`:

| Environment         | Who forwards `/api`                        | To                       |
|---------------------|--------------------------------------------|--------------------------|
| `npm start`         | Angular dev server (`proxy.conf.json`)     | `http://localhost:8080`  |
| Docker Compose      | nginx (`nginx.conf`)                       | `http://backend:8080`    |

So the app has no environment files and no API base URL to configure, and the backend needs no CORS setup.

### Services

[`api.services.ts`](src/app/core/api/api.services.ts) holds one thin service per resource. Each method maps to one endpoint and returns an `Observable`:

| Service           | Methods                                                         |
|-------------------|-----------------------------------------------------------------|
| `CategoryService` | `findAll`, `create`, `update`, `delete`                         |
| `TaskService`     | `findAll(categoryId?)`, `create`, `update`, `delete`            |
| `UserService`     | `me`, `findAll`, `create`, `update`, `delete`                   |

Login and registration are in `AuthService`.

### Models

[`models.ts`](src/app/core/models.ts) mirrors the backend records in `backend/.../dto`. When a backend DTO changes, update this file too. Optional fields are `null`, never an empty string: `emptyToNull()` in `shared/forms.ts` converts form values before they are sent.

### Errors

[`Notifier`](src/app/core/notifier.ts) shows snackbars. `Notifier.error(error)` displays:

1. the `message` field of the backend's `ApiError` body, when there is one;
2. otherwise, for status `0` (network error), « Serveur injoignable. Vérifiez que le backend est démarré. »;
3. otherwise, a generic message.

### Validation

Forms repeat the backend's rules so users get immediate feedback: required fields, username of 3 to 50 characters, password of at least 8 characters, email format, and hex colours (`#RGB` or `#RRGGBB`, the same pattern as `CategoryRequest`). The backend still validates everything, and its messages are shown if a request is rejected.

---

## Styling and accessibility

- [`styles.scss`](src/styles.scss) defines the Material 3 theme with `color-scheme: light dark`, so the app follows the system's light or dark mode.
- Shared classes are used by every page: `.page-header`, `.surface-list`, `.table-wrapper`, `.row-actions`, `.empty`, `.danger`, `.snack-error`.
- **Small screens**: below the mobile breakpoint, secondary table columns (created date, category, name, email, roles) are hidden. Their content is shown under the main column through `.small-screen-only` elements, so the action buttons stay visible without horizontal scrolling.
- Icon-only buttons have an `aria-label` and a `matTooltip`.
- `index.html` sets `lang="fr"`.

The production build fails if the initial bundle exceeds 1 MB, and warns above 700 kB (`angular.json` budgets).

---

## Tests

There are about **115 unit tests** in 19 spec files (`it.each` cases count separately). They run in Node with jsdom, so no browser is needed:

```bash
cd frontend
npx ng test --watch=false
```

`npm test` (`ng test`) starts the same runner in **watch mode**.

### What is tested

| Area        | Spec files | What they check |
|-------------|------------|-----------------|
| Routing     | `app.routes.spec.ts` | Each route loads the right component behind the right guard, and only `/login` and `/register` are public |
| App config  | `app.config.spec.ts` | French locale, icon font, interceptor registered |
| Shell       | `app.spec.ts` | Navigation and user menu depending on login state and role |
| Auth        | `auth.service.spec.ts`, `auth.interceptor.spec.ts`, `auth.guards.spec.ts` | Token decoding and expiry, login and logout, the header and 401 handling, every guard branch |
| API         | `api.services.spec.ts` | URL, method, query parameters and body of every call (`HttpTestingController`) |
| Notifier    | `notifier.spec.ts` | Error message extraction, snackbar options |
| Pages       | `*-page.spec.ts` | Loading and sorting, empty states, create, edit and delete flows, confirmation refused, API errors (including the 409 on categories), form validation |
| Dialogs     | `*-dialog.spec.ts` | Prefill in edit mode, validation, the exact request returned on save |
| Shared      | `forms.spec.ts`, `shared.spec.ts` | `emptyToNull`, colour pattern, role labels, confirmation dialog |

### Test helpers

Located in [`src/testing/`](src/testing). `tsconfig.app.json` excludes this folder, so it never reaches the production bundle.

- `fakeToken(username, roles?, expiresInSeconds?)` builds an unsigned JWT with the same payload as the backend's. A negative `expiresInSeconds` gives an expired token.
- `dialogMock(...results)` replaces `MatDialog`. Each `open()` call returns the next value from `results` when the dialog closes; `undefined` means cancelled. A single test can therefore cover several dialogs in sequence, for example the edit form followed by a confirmation.
- `notifierMock()` replaces `Notifier` with `vi.fn()` spies.

A typical page test:

```ts
const { component, notifier } = await render({ label: 'Urgent', color: '#FF0000' });

component.openDialog();

expect(categoryService.create).toHaveBeenCalledWith({ label: 'Urgent', color: '#FF0000' });
expect(notifier.success).toHaveBeenCalledWith('Catégorie créée');
```

The API services are replaced with `vi.fn()` objects through `{ provide: XxxService, useValue }`. `TestBed.overrideProvider` is used to make a load fail.

### Coverage

The `@vitest/coverage-v8` package is not a dependency of the project. To measure coverage, install it temporarily:

```bash
npm install --no-save @vitest/coverage-v8
npx ng test --watch=false --coverage --coverage-include='src/app/**/*.ts'
```

`--coverage-include` makes files that no test imports appear in the report too. The report is written to `coverage/`, which Git ignores.

---

## Adding a new page

For example, a `tags` screen backed by a new `/api/tags` endpoint:

1. **Model**: add `Tag` and `TagRequest` to `core/models.ts`, matching the backend DTOs.
2. **Service**: add `TagService` to `core/api/api.services.ts`, with a test in `api.services.spec.ts`.
3. **Dialog**: create `features/tags/tag-dialog.ts`. It receives `Tag | null` through `MAT_DIALOG_DATA` and closes with a `TagRequest`. Test the prefill, the validation and the returned request.
4. **Page**: create `features/tags/tag-list-page.ts` with the `load()`, `openDialog()` and `remove()` pattern described above. Test it with `dialogMock()` and `notifierMock()`.
5. **Route**: add a lazy route with the right guard in `app.routes.ts`, and a case in `app.routes.spec.ts`.
6. **Navigation**: add a link in `app.html`, and update `app.spec.ts`.
7. Run `npx ng test --watch=false` and `npx ng build`.

---

## Build and Docker image

```bash
npx ng build                          # production build (the default configuration)
npx ng build --configuration development
```

The output goes to `dist/frontend/browser/`. File names are hashed (`outputHashing: all`).

The [`Dockerfile`](Dockerfile) has two stages:

1. **`node:24-alpine`**: `npm ci` in its own layer, with a BuildKit cache mount for npm, then `ng build --configuration production`.
2. **`nginxinc/nginx-unprivileged:1.29-alpine`**: copies `nginx.conf` and the built files. nginx runs as a non-root user and listens on **8080**. Compose maps it to **4200** on the host.

[`nginx.conf`](nginx.conf):

- forwards `/api/` to `http://backend:8080`, the backend service name in `compose.yaml`;
- caches hashed assets (`.js`, `.css`, fonts, images) for one year with `immutable`;
- sends every other path to `index.html` with `Cache-Control: no-cache`, so routes such as `/admin/users` work after a page reload, and a new release is picked up straight away.

To build the image alone:

```bash
docker build -t spring-todolist-frontend frontend
```

Outside Compose, nginx cannot resolve the `backend` host name, so `/api` calls fail. In `compose.yaml`, the `frontend` service waits for the backend health check, and has its own health check on `http://127.0.0.1:8080/`.

In CI ([`.github/workflows/ci.yml`](../.github/workflows/ci.yml)), on Node.js 24, the **Frontend - Build** job runs `npm ci` and the production build, and publishes `dist/frontend/browser` as the `frontend-dist` artifact. The **Frontend - Tests** job runs the unit tests once the build has succeeded.

---

## npm scripts

| Command          | What it does                                                    |
|------------------|-----------------------------------------------------------------|
| `npm start`      | `ng serve`: dev server on port 4200 with the `/api` proxy        |
| `npm run build`  | `ng build`: production build into `dist/`                       |
| `npm run watch`  | Development build that rebuilds on every change                 |
| `npm test`       | `ng test`: unit tests in watch mode                             |

---

## Conventions

- **File names** have no `.component` suffix: `task-list-page.ts` exports `TaskListPage`, and `task-dialog.ts` exports `TaskDialog`.
- **Selectors** use the `app-` prefix.
- **User-facing text is in French, with accents.** Code comments are in French, without accents.
- **Formatting**: Prettier with single quotes and a line width of 100 (`npx prettier --write src`).
- **Members used only by the template** are `protected`. Methods called by tests are public.
- **No component calls `HttpClient` directly**: always go through a service in `core/`.
