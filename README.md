## Library Management System API

A REST API for an **online (e-library)** system — managing a book catalog, categories, staff accounts, and members, with JWT authentication, role-based access control, and AI-generated book summaries.


### Table of Contents

- [Tech Stack](#tech-stack)
- [Architecture & Approach](#architecture--approach)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Roles & Permissions](#roles--permissions)
- [Assumptions](#assumptions)
- [Implemented Features](#implemented-features)
- [Possible Enhancements](#possible-enhancements)

### Tech Stack

| Layer          | Technology                          |
|----------------|--------------------------------------|
| Runtime        | Node.js                             |
| Framework      | Express.js                          |
| Database       | MySQL (via `mysql2/promise`)        |
| Auth           | JWT (`jsonwebtoken`) + `bcryptjs`   |
| Validation     | `express-validator`                 |
| AI Integration | OpenAI-compatible chat completions API |

### Architecture & Approach

The codebase follows a **layered, modular architecture**. Each domain (`auth`, `users`, `categories`, `books`, `ai`) is a self-contained module under `src/modules/`, and every module is split into four layers:

```
Routes  →  Controller  →  Service  →  Repository 
```

- **Routes** wire URLs to controllers and attach `authenticate` / `allowRoles` middleware and validation chains.
- **Controllers** handle the HTTP concerns only: reading `req`, checking validation results, and shaping the `res` payload. They contain no business logic.
- **Services** hold the business rules (duplicate checks, password hashing, availability calculations, cache-or-generate logic for AI summaries, etc.) and are the only layer allowed to combine data from multiple repositories.
- **Repositories** are the sole layer that talks to the database. They run parameterized queries and return plain rows, with no business logic.

This separation keeps each layer independently testable and makes it straightforward to swap out a layer (e.g. the database driver, or the AI provider) without touching the others.

A single shared MySQL connection pool (`src/config/databaseConfig.js`) is imported by every repository, rather than each module opening its own connection.

## Project Structure

```
src/
├── app.js                     # Express app: middleware + route mounting
├── server.js                  # Entry point: loads env vars, starts the HTTP server
├── testDB.js                  # One-off script to sanity-check the DB connection
├── config/
│   └── databaseConfig.js      # Shared MySQL connection pool
├── database/
│   ├── 1_users.sql
│   ├── 2_categories.sql
│   ├── 3_books.sql
│   └── 4_bookSummary.sql      # Numbered schema files, run in order by migrate.js
├── middleware/
│   ├── auth.middleware.js     # Verifies JWT, attaches req.user
│   └── role.middleware.js     # Restricts a route to specific roles
├── scripts/
│   └── migrate.js             # Runs every .sql file in src/database against MySQL
└── modules/
    ├── auth/                  # Registration, login
    ├── users/                 # Admin-only librarian account creation
    ├── categories/            # Book category CRUD
    ├── books/                 # Book catalog CRUD, search, filtering
    └── ai/                    # AI-generated book summaries (with DB caching)
```

### Setup Instructions

#### Prerequisites

- Node.js 18+
- A running MySQL server
- An OpenAI-compatible API key (for the AI book-summary feature)

#### 1. Install dependencies

```bash
npm install
```

#### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in your own values (see [Environment Variables](#environment-variables)).

```bash
cp .env.example .env
```

#### 3. Create the database

Create an empty MySQL database matching `DB_NAME` in your `.env`:

```sql
CREATE DATABASE library_db;
```

#### 4. Run migrations

This executes every `.sql` file in `src/database/` against your database, in filename order:

```bash
npm run migrate
```

#### 5. (Optional) Verify the DB connection

```bash
npm run test:db
```

#### 6. Start the server

```bash
npm start
# or, for auto-restart during development:
npm run dev
```

The API will be available at `http://localhost:5000` (or whatever `PORT` you set), and a liveness check is available at `GET /health`.

### Environment Variables

| Variable          | Description                                              |
|--------------------|-----------------------------------------------------------|
| `PORT`             | Port the HTTP server listens on                          |
| `DB_HOST`          | MySQL host                                                |
| `DB_PORT`          | MySQL port                                                |
| `DB_USER`          | MySQL user                                                |
| `DB_PASSWORD`      | MySQL password                                            |
| `DB_NAME`          | MySQL database name                                       |
| `JWT_SECRET`       | Secret used to sign/verify JWTs                           |
| `JWT_EXPIRES_IN`   | JWT expiry (e.g. `1d`, `12h`)                              |
| `AI_API_BASE_URL`  | Base URL of an OpenAI-compatible chat completions API     |
| `AI_API_TOKEN`     | Bearer token for the AI provider                          |

### Database Schema

| Table            | Purpose                                                                 |
|-------------------|--------------------------------------------------------------------------|
| `users`           | Members and staff. `role` is one of `USER`, `LIBRARIAN`, `ADMIN`.       |
| `categories`      | Book categories, with `ACTIVE`/`INACTIVE` status.                      |
| `books`           | Catalog entries, linked to a category. It does not yet store a file, URL, or format for the digital copy itself (see [Assumptions](#assumptions)). |
| `bookSummaries`   | One AI-generated summary per book (1:1 with `books`), cached so repeated requests skip the AI call. |

### API Endpoints

All request/response bodies are JSON. Protected endpoints require `Authorization: Bearer <token>`.

#### Auth (`/api/auth`)

| Method | Endpoint     | Access | Description              |
|--------|-------------|--------|---------------------------|
| POST   | `/register` | Public | Register a new member     |
| POST   | `/login`    | Public | Log in, receive a JWT     |

#### Users (`/api/users`)

| Method | Endpoint      | Access | Description                     |
|--------|---------------|--------|-----------------------------------|
| POST   | `/librarian`  | Admin  | Create a new librarian account    |

#### Categories (`/api/categories`)

| Method | Endpoint          | Access             | Description             |
|--------|-------------------|--------------------|--------------------------|
| POST   | `/`               | Librarian, Admin   | Create a category        |
| GET    | `/`               | Public             | List all categories      |
| DELETE | `/:categoryID`    | Librarian, Admin   | Delete a category        |

#### Books (`/api/books`)

| Method | Endpoint       | Access             | Description                                            |
|--------|----------------|--------------------|----------------------------------------------------------|
| POST   | `/`            | Librarian, Admin   | Add a new book                                          |
| GET    | `/`            | Public             | List active books (filter by `categoryID`, `author`, `available`) |
| GET    | `/search`      | Public             | Keyword search across title, author, description        |
| GET    | `/:bookID`     | Public             | Get a single book's details                              |
| DELETE | `/:bookID`     | Librarian, Admin   | Soft-delete a book (marks it `INACTIVE`)                 |

#### AI (`/api`)

| Method | Endpoint                    | Access        | Description                                              |
|--------|------------------------------|---------------|------------------------------------------------------------|
| GET    | `/books/:bookID/summary`    | Authenticated | Returns a cached summary, or generates and caches one via the AI provider on first request |

#### Health

| Method | Endpoint  | Access | Description        |
|--------|-----------|--------|----------------------|
| GET    | `/health` | Public | Liveness check       |

### Roles & Permissions

| Role        | Can do                                                         |
|-------------|-------------------------------------------------------------------|
| `USER`      | Register, log in, browse/search books and categories, view AI summaries |
| `LIBRARIAN` | Everything `USER` can, plus create/delete books and categories   |
| `ADMIN`     | Everything `LIBRARIAN` can, plus create new librarian accounts   |

`role` defaults to `USER` at the database level, so anyone can self-register as a member through `/api/auth/register`; `LIBRARIAN` and `ADMIN` accounts must be provisioned separately (there's no self-registration path for staff roles, and no `ADMIN` creation endpoint at all — see [Assumptions](#assumptions)).

### Assumptions

- **MySQL only.** The connection pool and all SQL are written for MySQL (`mysql2`), not a generic SQL abstraction.
- **AI provider is OpenAI-compatible.** `ai.provider.js` calls `${AI_API_BASE_URL}/v1/chat/completions` with the `gpt-4o-mini` model hardcoded; any provider exposing that same API shape (e.g. OpenAI itself, or a compatible proxy) will work without code changes to the URL, but changing providers/models currently requires an edit.
- **No first-admin bootstrap.** There is no endpoint to create the first `ADMIN` account or promote a `USER`. The initial admin is expected to be inserted directly into the database (e.g. via a seed script or manual `INSERT`) after running migrations.
- **JWT is stateless.** There's no refresh-token flow, token blacklist, or logout endpoint — a token is valid until it expires (`JWT_EXPIRES_IN`) or the secret is rotated.
- **Soft vs. hard delete is intentional.** Books are soft-deleted (`status = INACTIVE`) to preserve historical/loan-adjacent data integrity; categories are hard-deleted, since a book can only reference a category by foreign key with `ON DELETE SET NULL`.
- **This is an online library, but the schema doesn't fully reflect that yet.** `books` has no `fileUrl`/`filePath`, format, or storage reference — there's currently no way for a user to actually read or download a book through the API, only to see its metadata (title, author, description, category). `total_copies`/`available_copies` model physical stock and don't correspond to any digital-access concept (e.g. concurrent readers) yet; no endpoint reads or writes those fields after a book is created. Treat them as placeholders to be replaced or repurposed once file storage and a read/download endpoint are added (see [Possible Enhancements](#possible-enhancements)).
- **Migration order relies on filenames.** `scripts/migrate.js` runs files in the order `fs.readdirSync` returns them, which is why schema files are numerically prefixed (`1_users.sql`, `2_categories.sql`, ...); it does not track which migrations have already run, so re-running it re-executes `CREATE TABLE IF NOT EXISTS` statements harmlessly but is not a true migration/versioning system.
- **Single environment/instance.** No environment-based config (dev/staging/prod), containerization, or process manager is assumed beyond what's described in this README.

### Implemented Features

- User registration and login with hashed passwords (`bcryptjs`) and JWT issuance
- Role-based access control (`USER`, `LIBRARIAN`, `ADMIN`) via `authenticate` + `allowRoles` middleware
- Admin-only creation of librarian accounts
- Book catalog: create, list with filtering (category, author, availability), get by ID, keyword search, soft-delete
- Duplicate-prevention checks (unique ISBN on books, unique name on categories, unique email on users)
- Category management: create, list, delete, with active/inactive status validation when attaching to a book
- AI-generated book summaries, generated on first request and cached in the database on subsequent requests, avoiding repeated calls to the AI provider
- Centralized request validation via `express-validator` on every module
- Health check endpoint for uptime monitoring / load balancers
- Idempotent-by-design schema migration script

### Possible Enhancements

#### Digital access (highest priority — closes the physical/online gap)

- **File storage & delivery** — add `fileUrl`/`filePath` and `fileType` (PDF/EPUB) to `books`, store files in cloud storage (e.g. S3) or disk, and add a `GET /books/:bookID/read` or `/download` endpoint
- **Per-book access control** — gate reading/downloading behind authentication (and possibly role or subscription/purchase status), rather than the current fully public browsing
- **Reading progress tracking** — last page/position read, per user per book
- **Bookmarks, highlights, and notes** per user per book
- **Favorites / "my library" / reading lists** per user
- **Multiple formats per book** (EPUB + PDF) and/or format conversion
- **Preview/sample chapter** access for unauthenticated users
- **Concurrent-access limits** (a digital analog to `available_copies`), or removing that concept entirely in favor of unlimited simultaneous access
- **Upload validation** — file size limits, allowed MIME types, virus scanning

### General API improvements

- Pagination, sorting, and total counts on list endpoints
- Refresh tokens and a logout/token-revocation mechanism
- Book update (`PUT`/`PATCH /books/:bookID`) and category update endpoints
- User self-service (view/update own profile, change password)
- First-admin bootstrap (currently no way to create the first `ADMIN` except a manual DB insert)
- Centralized error-handling middleware instead of per-controller try/catch
- Automated tests (unit + integration) and CI
- API documentation (OpenAPI/Swagger)
- Rate limiting (especially on `/auth/login` and the AI summary endpoint) and structured request logging
- Dockerfile / docker-compose for local setup
