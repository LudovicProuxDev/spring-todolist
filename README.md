# Spring Todolist

A todo list application, made of two parts:

- **`backend/`**: a REST API for **categories**, **tasks** and **users**, secured with **JWT** authentication. Built with Spring Boot 4, Java 21 and PostgreSQL, and tested with JUnit (written test-first).
- **`frontend/`**: an Angular 22 single-page application with Angular Material, covering the whole API, including user administration.

Both run in Docker containers, orchestrated by Docker Compose.

---

## Table of contents

- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [API overview](#api-overview)
- [Authentication and authorization](#authentication-and-authorization)
- [Error format](#error-format)
- [Data model](#data-model)
- [Project structure](#project-structure)
- [Frontend](#frontend)
- [Tests](#tests)
- [Continuous integration](#continuous-integration)
- [Docker images](#docker-images)
- [Known limitations](#known-limitations)

---

## Tech stack

| Area              | Technology                                                        |
|-------------------|-------------------------------------------------------------------|
| Backend language  | Java 21                                                           |
| Backend framework | Spring Boot 4.1 (Web MVC, Data JPA, Security, Validation)         |
| Database          | PostgreSQL 17                                                     |
| Authentication    | JWT (HMAC-SHA256) via [jjwt](https://github.com/jwtk/jjwt) 0.12   |
| API documentation | springdoc-openapi 3 (OpenAPI 3 + Swagger UI)                      |
| Boilerplate       | Lombok                                                            |
| Backend build     | Gradle 9 (Kotlin DSL) with the Gradle Wrapper                     |
| Frontend          | Angular 22 (standalone components, signals, zoneless), TypeScript 6 |
| UI components     | Angular Material 22 (Material 3)                                  |
| Frontend tests    | Vitest 5 with jsdom (Angular CLI unit-test builder)               |
| Web server        | nginx (serves the frontend and proxies `/api` to the backend)     |
| Containers        | Docker (multi-stage builds) + Docker Compose                      |
| CI                | GitHub Actions                                                    |

---

## Getting started

### Prerequisites

- **Docker** with the Compose plugin, to run the whole stack.
- **JDK 21**, only to build or run the backend outside Docker. The Gradle Wrapper downloads Gradle for you.
- **Node.js 22.22+ or 24**, only to work on the frontend outside Docker.

### Run with Docker Compose

Compose reads its variables from a `.env` file at the project root, which is not versioned. Create it from the template, then set at least `APP_JWT_SECRET`:

```bash
cp .env.example .env
# Fill in APP_JWT_SECRET, for example with the output of: openssl rand -base64 64
docker compose up -d --build
```

If `APP_JWT_SECRET` is missing, Compose refuses to start and says so.

This starts three services, defined in [`compose.yaml`](compose.yaml):

| Service    | Description                                                                  | Port                        |
|------------|------------------------------------------------------------------------------|-----------------------------|
| `frontend` | The Angular app served by nginx, built from [`frontend/Dockerfile`](frontend/Dockerfile) | `4200` on the host |
| `backend`  | The Spring Boot API, built from [`backend/Dockerfile`](backend/Dockerfile)   | `8080` on the host          |
| `db`       | PostgreSQL 17 (Alpine), with a persistent `pgdata` volume                    | not exposed (internal only) |

The `backend` service waits for `db` to pass its health check (`pg_isready`) before starting.

Once it is up:

- Application: <http://localhost:4200>
- API: <http://localhost:8080/api>
- Swagger UI: <http://localhost:8080/swagger-ui/index.html>
- Raw OpenAPI spec (JSON): <http://localhost:8080/v3/api-docs>

To stop the stack: `docker compose down`. Add `-v` to also delete the database volume.

### Run the backend locally with Gradle

The backend needs a PostgreSQL database. Point it to one with the standard Spring environment variables, then start it:

```bash
cd backend
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/todolist
export SPRING_DATASOURCE_USERNAME=todolist
export SPRING_DATASOURCE_PASSWORD=todolist
./gradlew bootRun
```

### Run the frontend locally with the Angular dev server

```bash
cd frontend
npm ci
npm start
```

The app is then served on <http://localhost:4200>, with live reload. [`proxy.conf.json`](frontend/proxy.conf.json) forwards `/api` calls to the backend on `http://localhost:8080`, so the backend must be running, either with Gradle or with `docker compose up -d backend`.

---

## Configuration

Backend configuration lives in [`backend/src/main/resources/application.properties`](backend/src/main/resources/application.properties). Any property can be overridden with an environment variable. The frontend needs no configuration: it always calls the API on the same origin, under `/api`.

| Property / variable                                    | Default                    | Description                                              |
|--------------------------------------------------------|----------------------------|----------------------------------------------------------|
| `SPRING_DATASOURCE_URL`                                | *(none)*                   | JDBC URL of the PostgreSQL database                      |
| `SPRING_DATASOURCE_USERNAME` / `_PASSWORD`             | *(none)*                   | Database credentials                                     |
| `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD`  | `todolist` (all three)     | Used by `compose.yaml` for both the `db` and `backend` services |
| `spring.jpa.hibernate.ddl-auto`                        | `update`                   | Hibernate creates and updates the schema from the entities |
| `app.jwt.secret` (`APP_JWT_SECRET`)                    | a development key          | Base64-encoded HMAC key used to sign JWTs. **Required** by `compose.yaml` |
| `app.jwt.expiration-ms` (`APP_JWT_EXPIRATION_MS`)      | `86400000` (24 h)          | Token lifetime                                           |
| `app.admin.username` (`APP_ADMIN_USERNAME`)            | *(empty: disabled)*        | Username of the initial admin account (see [Creating the first admin](#creating-the-first-admin)) |
| `app.admin.password` (`APP_ADMIN_PASSWORD`)            | *(empty)*                  | Its password (8 characters minimum)                      |
| `app.admin.email` (`APP_ADMIN_EMAIL`)                  | *(empty)*                  | Its email address                                        |

[`.env.example`](.env.example) lists every variable that Compose uses.

> [!WARNING]
> The default `app.jwt.secret` is committed to the repository and is **for development only**: anyone who knows it can forge valid tokens. It is only used when the backend runs outside Compose (`./gradlew bootRun`) without `APP_JWT_SECRET`. In production, always set `APP_JWT_SECRET` to a secret that is generated and stored separately, for example with `openssl rand -base64 64`.

> [!NOTE]
> `ddl-auto=update` is convenient during development. A migration tool such as Flyway or Liquibase should replace it before going to production.

---

## API overview

All endpoints are under `/api` and exchange JSON. The full, interactive documentation is available in Swagger UI.

### Authentication: `/api/auth` (public)

| Method | Path                 | Description                                                     | Success |
|--------|----------------------|-----------------------------------------------------------------|---------|
| POST   | `/api/auth/register` | Create an account. The `ROLE_USER` role is assigned automatically. | 201     |
| POST   | `/api/auth/login`    | Log in and receive a JWT                                        | 200     |

### Categories: `/api/categories` (public)

| Method | Path                   | Description            | Success |
|--------|------------------------|------------------------|---------|
| GET    | `/api/categories`      | List all categories    | 200     |
| GET    | `/api/categories/{id}` | Get one category       | 200     |
| POST   | `/api/categories`      | Create a category      | 201     |
| PUT    | `/api/categories/{id}` | Replace a category     | 200     |
| DELETE | `/api/categories/{id}` | Delete a category      | 204     |

Request body: `label` (required) and `color` (optional, hex code such as `#FF0000` or `#F00`).

A category that is still used by at least one task cannot be deleted: the API returns **409 Conflict**. Move or delete those tasks first.

### Tasks: `/api/tasks` (public)

| Method | Path                          | Description                               | Success |
|--------|-------------------------------|-------------------------------------------|---------|
| GET    | `/api/tasks`                  | List all tasks                            | 200     |
| GET    | `/api/tasks?categoryId={id}`  | List the tasks of one category            | 200     |
| GET    | `/api/tasks/{id}`             | Get one task                              | 200     |
| POST   | `/api/tasks`                  | Create a task                             | 201     |
| PUT    | `/api/tasks/{id}`             | Replace a task                            | 200     |
| DELETE | `/api/tasks/{id}`             | Delete a task                             | 204     |

Request body: `description` (required) and `categoryId` (optional; if provided, the category must exist, otherwise the API returns 404).
`createdAt` is set automatically by the server when the task is created.

### Users: `/api/users` (JWT required)

| Method | Path              | Who can call it            | Description                                    | Success |
|--------|-------------------|----------------------------|------------------------------------------------|---------|
| POST   | `/api/users`      | Admin                      | Create a user (always with `ROLE_USER`)        | 201     |
| GET    | `/api/users`      | Admin                      | List all users                                 | 200     |
| GET    | `/api/users/me`   | Any authenticated user     | Profile of the current user                    | 200     |
| GET    | `/api/users/{id}` | Admin or the account owner | Get one user                                   | 200     |
| PUT    | `/api/users/{id}` | Admin or the account owner | Partial update (see below)                     | 200     |
| DELETE | `/api/users/{id}` | Admin                      | Delete a user                                  | 204     |

`PUT /api/users/{id}` is a **partial update**: any field that is missing or `null` is left unchanged. The updatable fields are `firstname`, `lastname`, `email`, `password` (minimum 8 characters, hashed by the server) and `roles`. Only an **admin** can change `roles`. If anyone else sends that field, the API returns 403, even on their own account.

Passwords are never returned by the API.

### Example session

```bash
# 1. Register
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"jdupont","password":"secret123","email":"jean.dupont@example.com"}'

# 2. Log in and keep the token
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"jdupont","password":"secret123"}' | sed -E 's/.*"token":"([^"]+)".*/\1/')

# 3. Call a protected endpoint
curl http://localhost:8080/api/users/me -H "Authorization: Bearer $TOKEN"

# 4. Create a category and a task (public endpoints)
curl -X POST http://localhost:8080/api/categories \
  -H "Content-Type: application/json" -d '{"label":"Home","color":"#00AA00"}'
curl -X POST http://localhost:8080/api/tasks \
  -H "Content-Type: application/json" -d '{"description":"Do the groceries","categoryId":1}'
```

---

## Authentication and authorization

The API is **stateless**: there is no HTTP session and no cookie. CSRF protection, HTTP Basic and form login are disabled.

1. `POST /api/auth/login` checks the username and the password against the BCrypt hash stored in the database. On success, it returns a JWT signed with HS256. The token contains the username (`sub`), the roles, and its issue and expiry dates.
2. The client sends the token on every request in the `Authorization: Bearer <token>` header.
3. `JwtAuthenticationFilter` validates the token, loads the user from the database, and fills the Spring Security context. A missing or invalid token does not raise an error at this stage: the request simply goes on unauthenticated, and the access rules decide what happens next.
4. If the user was deleted after the token was issued, the request is treated as unauthenticated.

### Access rules

They are defined in [`SecurityConfig`](backend/src/main/java/com/example/spring_todolist/config/SecurityConfig.java) and in `@PreAuthorize` annotations on the controllers.

| Path                                         | Access                                    |
|----------------------------------------------|-------------------------------------------|
| `/api/auth/**`                               | Public                                    |
| `/api/categories/**`, `/api/tasks/**`        | Public (for now)                          |
| `/swagger-ui/**`, `/v3/api-docs/**`          | Public                                    |
| `/api/users/**`                              | Authenticated; then per-endpoint rules (see above) |
| Anything else                                | Authenticated                             |

### Roles

Roles are a closed set, defined by the [`Role`](backend/src/main/java/com/example/spring_todolist/entity/Role.java) enum: `ROLE_USER` and `ROLE_ADMIN`. If a request contains an unknown role, JSON parsing rejects it with a 400.

New accounts always get `ROLE_USER`, whether they come from public registration or from an admin. Nobody can choose their own role at sign-up.

### Creating the first admin

Accounts created through the API always get `ROLE_USER`, so the first admin is created at startup by [`AdminAccountInitializer`](backend/src/main/java/com/example/spring_todolist/config/AdminAccountInitializer.java). Set these variables, for example in `.env`:

```dotenv
APP_ADMIN_USERNAME=admin
APP_ADMIN_PASSWORD=a-strong-password
APP_ADMIN_EMAIL=admin@example.com
```

On startup:

- If `APP_ADMIN_USERNAME` is empty, nothing happens.
- If no account has that username, the app creates it with the roles `ROLE_USER` and `ROLE_ADMIN`.
- If an account with that username already exists, the app leaves it unchanged. It is **never promoted**, otherwise anyone who registered that username first would become an admin.
- If the values break the registration rules (username of 3 to 50 characters, password of at least 8 characters, valid email), startup fails with an explicit error. The same happens if the email is already used by another account.

Once you have an admin, you can manage the other users' roles through `PUT /api/users/{id}`. You can remove the variables afterwards: the account stays in the database.

---

## Error format

Every error response (4xx) has the same JSON body, defined by [`ApiError`](backend/src/main/java/com/example/spring_todolist/dto/ApiError.java):

```json
{
  "timestamp": "2026-11-05T10:15:30.123Z",
  "status": 404,
  "message": "Categorie introuvable : id=99"
}
```

| Status | When                                                                       | Produced by                       |
|--------|----------------------------------------------------------------------------|-----------------------------------|
| 400    | Bean Validation failure (the message lists each field and its error)      | `GlobalExceptionHandler`          |
| 400    | Malformed JSON body, or a value outside an enum (such as an unknown role) | `GlobalExceptionHandler`          |
| 401    | Wrong username or password on login                                       | `GlobalExceptionHandler`          |
| 401    | Protected endpoint called without a valid token                            | `RestAuthenticationEntryPoint`    |
| 403    | Authenticated, but not allowed (role rule, or non-admin changing `roles`)  | `RestAccessDeniedHandler`         |
| 404    | Resource not found (including an unknown `categoryId` on a task)           | `GlobalExceptionHandler`          |
| 409    | Username or email already taken                                            | `GlobalExceptionHandler`          |
| 409    | Deleting a category that tasks still use                                   | `GlobalExceptionHandler`          |

On login, the API returns the same message whether the username or the password is wrong, so that it does not reveal which accounts exist.

> [!NOTE]
> Error messages are currently in French.

---

## Data model

Hibernate generates the schema from the JPA entities in [`entity/`](backend/src/main/java/com/example/spring_todolist/entity).

```
category                     task                              "user"                       user_roles
─────────────────            ──────────────────────────        ─────────────────────        ──────────────
id          PK               id           PK                   id         PK                user_id  FK → user.id
label       NOT NULL         description  NOT NULL (≤1000)     username   NOT NULL, UNIQUE   role     NOT NULL
color                        created_at   NOT NULL             password   NOT NULL (BCrypt)
                             category_id  FK → category.id     firstname
                                          (nullable)           lastname
                                                               email      UNIQUE
```

- A **task** belongs to zero or one **category**.
- A **user** has a list of **roles**, stored in the `user_roles` table as strings (`ROLE_USER`, `ROLE_ADMIN`).
- `user` is a reserved word in PostgreSQL, so the table name is always quoted (`"user"`) in the generated SQL.
- Categories and tasks are **not linked to users** yet: every client sees and edits the same list.

---

## Project structure

```
spring-todolist/
├── .github/workflows/ci.yml        GitHub Actions pipeline (backend + frontend)
├── compose.yaml                    Docker Compose stack (frontend + backend + PostgreSQL)
├── .env.example                    Template for the local, unversioned .env file
├── backend/                        Spring Boot API
└── frontend/                       Angular application (see Frontend below)
```

### Backend

```
backend/
├── Dockerfile                      Multi-stage image build
├── build.gradle.kts                Gradle build and dependencies
├── settings.gradle.kts
├── gradlew, gradlew.bat, gradle/   Gradle Wrapper (Gradle 9.8.1)
└── src/
    ├── main/
    │   ├── java/com/example/spring_todolist/
    │   │   ├── SpringTodolistApplication.java   Entry point
    │   │   ├── config/        Security filter chain, BCrypt PasswordEncoder, OpenAPI metadata, initial admin
    │   │   ├── controller/    REST controllers: Auth, Category, Task, User
    │   │   ├── dto/           Request and response records, with validation and OpenAPI annotations
    │   │   ├── entity/        JPA entities (Category, Task, User) and the Role enum
    │   │   ├── exception/     Business exceptions and the global exception handler
    │   │   ├── mapper/        Hand-written entity ↔ DTO mappers
    │   │   ├── repository/    Spring Data JPA repositories
    │   │   ├── security/      JWT service and filter, UserDetails, 401/403 handlers
    │   │   └── service/       Business logic: Auth, Category, Task, User
    │   └── resources/
    │       └── application.properties
    └── test/
        ├── java/com/example/spring_todolist/    Tests, organised like the main code
        └── resources/application.properties     Test configuration
```

### Backend layers

A request goes through the layers in this order:

```
HTTP → JwtAuthenticationFilter → Controller → Service → Repository → PostgreSQL
                                     ↑            ↑
                                    DTOs        Mapper (entity ↔ DTO)
```

- **Controllers** only handle HTTP: routes, status codes, input validation (`@Valid`), access rules (`@PreAuthorize`) and the OpenAPI documentation.
- **Services** hold the business logic and the transactions. For example, they reject duplicate usernames and emails, hash passwords, assign the default role, and check that a task's category exists.
- **Mappers** convert between entities and DTOs. They never access a repository: resolving a `categoryId` into a `Category` is the service's job.
- **DTOs** are Java records. Entities are never exposed directly by the API.
- Passwords are handled in two steps: the plain-text value goes through the transient `plainPassword` field, then the service hashes it into `password` and clears the plain-text field. Only the hash is stored.

---

## Frontend

The Angular application lives in [`frontend/`](frontend). Its interface is in French, like the API's error messages.

### Screens

| Route          | Access                 | What it does                                                                                     |
|----------------|------------------------|--------------------------------------------------------------------------------------------------|
| `/login`       | Logged-out users       | Log in. The API's error message is shown when the credentials are wrong.                         |
| `/register`    | Logged-out users       | Create an account, then log in automatically.                                                    |
| `/tasks`       | Logged-in users        | List tasks (newest first), filter by category, create, edit and delete tasks.                     |
| `/categories`  | Logged-in users        | List, create, edit and delete categories, with a colour picker. Deleting a category still in use shows the API's 409 message. |
| `/profile`     | Logged-in users        | Edit your first name, last name, email and password.                                             |
| `/admin/users` | Admins only            | List users, create users, edit their details and roles, delete users (except your own account).  |

Unknown routes redirect to `/tasks`. On small screens, secondary table columns are hidden and their content is shown under the main column, so the action buttons stay visible.

### How it works

- **Authentication**: `AuthService` stores the JWT in `localStorage` and decodes its payload to get the username, the roles and the expiry date. The front never checks the signature: the backend does that on every request. The UI only uses the decoded payload to adapt itself, for example to show the admin menu.
- **HTTP interceptor**: `authInterceptor` adds `Authorization: Bearer <token>` to every `/api` call except `/api/auth/**`. If the backend answers 401 to an authenticated call (expired token, deleted account), it logs the user out and redirects to `/login`.
- **Guards**: `authGuard` protects the application pages, `adminGuard` protects `/admin/users`, and `guestGuard` sends logged-in users away from `/login` and `/register`. They only improve the user experience: the backend enforces the real access rules.
- **Errors**: API errors are shown in a snackbar, using the `message` field of the backend's `ApiError` body.
- **Same origin**: the browser only talks to the frontend's origin. In Docker, nginx forwards `/api` to the `backend` service; with `npm start`, the Angular dev server does the same through `proxy.conf.json`. No CORS configuration is needed.

> [!NOTE]
> If an admin changes their own roles, the change applies at their next login, because the roles are read from the current token.

### Structure

```
frontend/
├── Dockerfile, nginx.conf          Multi-stage image build and nginx configuration
├── proxy.conf.json                 Dev server proxy: /api → http://localhost:8080
└── src/
    ├── app/
    │   ├── app.ts, app.html        Shell: toolbar, navigation, user menu
    │   ├── app.config.ts           Providers: router, HTTP client + interceptor, French locale, icons
    │   ├── app.routes.ts           Lazy-loaded routes and their guards
    │   ├── core/
    │   │   ├── models.ts           TypeScript mirror of the backend DTOs
    │   │   ├── notifier.ts         Snackbar notifications and API error messages
    │   │   ├── auth/               AuthService, interceptor, guards
    │   │   └── api/                CategoryService, TaskService, UserService
    │   ├── features/               One folder per screen: auth, tasks, categories, profile, admin
    │   └── shared/                 Confirmation dialog, form helpers, role label pipe
    ├── testing/                    Test helpers (fake JWT)
    └── styles.scss                 Material theme (follows the system light/dark mode) and shared styles
```

---

## Tests

### Backend tests

The backend was developed test-first, and has about 175 tests organised like the main code. They cover every branch of the code (measured with JaCoCo):

| Package       | What is tested                                                                 | Kind                                   |
|---------------|--------------------------------------------------------------------------------|----------------------------------------|
| `entity`      | Bean Validation constraints and entity behaviour (such as `createdAt`)         | Unit                                   |
| `mapper`      | Entity ↔ DTO conversions                                                       | Unit                                   |
| `service`     | Business rules, with mocked repositories                                       | Unit (Mockito)                         |
| `repository`  | Derived queries and constraints against a real database                        | `@DataJpaTest` (PostgreSQL)            |
| `controller`  | Routes, status codes, validation and error bodies, for each controller (Auth, Category, Task, User) | Standalone MockMvc            |
| `security`    | JWT generation and validation, the filter, `UserDetails`, the JSON bodies of 401 and 403 responses, and end-to-end access rules | Unit and `@SpringBootTest` integration |
| `config`      | Creation of the initial admin account                                          | Unit (Mockito)                         |

#### Running the backend tests

```bash
cd backend
./gradlew test
```

The only requirement is a running **Docker** daemon. The tests use [Testcontainers](https://testcontainers.com/): the `jdbc:tc:postgresql:17-alpine:///todolist` URL in [`backend/src/test/resources/application.properties`](backend/src/test/resources/application.properties) starts a throwaway PostgreSQL 17 container when the tests begin, and removes it when they end. It does not publish any fixed port on your machine, so it does not conflict with another database already using 5432, and it never touches your development data.

The HTML report is written to `backend/build/reports/tests/test/index.html`.

### Frontend tests

About 115 unit tests run with Vitest in a jsdom environment. No browser is needed:

```bash
cd frontend
npx ng test --watch=false
```

Every source file has tests:

| Area        | What is tested                                                                                     |
|-------------|----------------------------------------------------------------------------------------------------|
| Routing     | Each route loads the right page behind the right guard; only `/login` and `/register` are public    |
| App config  | French locale, icon font, and the interceptor registered on the HTTP client                        |
| `core/auth` | Token decoding and expiry, login and logout, the interceptor (header, 401 handling), the three guards |
| `core/api`  | URL, method and body of every API call                                                             |
| `core`      | Error message extraction and snackbar notifications                                                |
| Pages       | Loading and sorting, create, edit and delete flows through dialogs, confirmation, API errors (including the 409 on categories), form validation, self-deletion blocked for admins |
| Dialogs     | Form prefill, validation and the request each dialog returns                                       |
| `shared`    | Form helpers, role labels and the confirmation dialog                                              |

The page tests replace the API services, `MatDialog` and the notifier with test doubles from `src/testing/`.

---

## Continuous integration

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every push to `main` and on every pull request that targets `main`. It has three jobs:

1. **Backend - Build**: in `backend/`, sets up JDK 21 (Temurin), validates the Gradle Wrapper checksum, compiles and assembles the jar (`./gradlew build -x test`), then uploads the jar as an artifact, kept for 7 days.
2. **Backend - Tests**: runs after the build job. It runs `./gradlew test`, which starts its own PostgreSQL container through Testcontainers (Docker is available on GitHub's Ubuntu runners), then uploads the JUnit XML reports even if tests fail.
3. **Frontend - Tests et build**: in `frontend/`, sets up Node.js 24 with the npm cache, installs the dependencies with `npm ci`, runs the unit tests, then builds the production bundle. It runs in parallel with the backend jobs.

The workflow only has read access to the repository (`permissions: contents: read`).

---

## Docker images

Both images use multi-stage builds and run as a non-root user.

### Backend

The [`backend/Dockerfile`](backend/Dockerfile) has two stages:

1. **Build stage** (`gradle:9.8.1-jdk21`)
   - Downloads the dependencies first, in their own layer, so they are only fetched again when the build files change.
   - Uses a BuildKit cache mount for the Gradle cache.
   - Builds the jar with `bootJar`, without running the tests.
   - Splits the jar into layers with Spring Boot's `jarmode=tools`.
2. **Runtime stage** (`eclipse-temurin:21-jre-alpine`)
   - Copies the layers from the least to the most frequently changed: dependencies, Spring Boot loader, snapshot dependencies, then application code. A code change therefore only rebuilds the last layer.
   - Runs as a non-root user (`spring`).
   - JVM options (`JAVA_OPTS`) default to `-XX:MaxRAMPercentage=75 -XX:+UseContainerSupport`, so the heap size follows the container's memory limit.

[`backend/.dockerignore`](backend/.dockerignore) keeps build outputs, IDE files, Git metadata, Docker files and `.env` files out of the build context.

### Frontend

The [`frontend/Dockerfile`](frontend/Dockerfile) has two stages:

1. **Build stage** (`node:24-alpine`)
   - Installs the dependencies with `npm ci` first, in their own layer, with a BuildKit cache mount for npm.
   - Builds the production bundle with `ng build`.
2. **Runtime stage** (`nginxinc/nginx-unprivileged:1.29-alpine`)
   - Serves the static files with nginx, which listens on port 8080 as the `nginx` user. Compose maps it to port `4200` on the host.
   - [`nginx.conf`](frontend/nginx.conf) forwards `/api/` to `http://backend:8080`, and sends every other unknown path to `index.html`, so Angular routes such as `/admin/users` also work when the page is reloaded.
   - Hashed assets (`.js`, `.css`, fonts, images) are cached for one year; `index.html` is always revalidated.

[`frontend/.dockerignore`](frontend/.dockerignore) keeps `node_modules`, build outputs and editor files out of the build context.

---

## Known limitations

These are current choices or not-yet-implemented features, not bugs:

- Categories and tasks are public and shared by everyone: they are not linked to a user account.
- The database schema is managed by `ddl-auto=update`, not by versioned migrations.
- There is no pagination on the list endpoints, and the frontend loads full lists.
- The frontend stores the JWT in `localStorage`, so any script injected into the page could read it. Angular escapes rendered values by default, which limits this risk. An `HttpOnly` cookie would remove it, but it would require changes to the backend.
- The frontend has no end-to-end test suite yet: only unit tests run in CI.
