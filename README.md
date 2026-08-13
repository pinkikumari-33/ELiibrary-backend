## Library Management System API

A REST API for an **online library (e-library)** — members can browse, search, and read/download digital books (PDF/EPUB), while librarians and admins manage the catalog and staff accounts. Built with Node.js, Express, and MySQL, with JWT authentication, role-based access control, and AI-generated book summaries.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Architecture & Approach](#architecture--approach)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions-run-on-any-machine)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [Implemented Features](#implemented-features)
- [API Endpoints](#api-endpoints)
- [Roles & Permissions](#roles--permissions)
- [Assumptions](#assumptions)
- [Possible Enhancements](#possible-enhancements)

## Tech Stack

| Layer            | Technology                              |
|-------------------|-------------------------------------------|
| Runtime          | Node.js (v18+)                            |
| Framework        | Express.js                                |
| Database         | MySQL (via `mysql2/promise`)              |
| Auth             | JWT (`jsonwebtoken`) + `bcryptjs`         |
| Validation       | `express-validator`                       |
| File uploads     | `multer` (disk storage)                   |
| AI Integration   | OpenAI-compatible chat completions API    |

## Architecture & Approach

The codebase follows a **layered, modular architecture**. Each domain (`auth`, `users`, `categories`, `books`, `ai`) is a self-contained module under `src/modules/`, and every module is split into four layers:

```
Routes  →  Controller  →  Service  →  Repository  →  MySQL
```

- **Routes** wire URLs to controllers and attach `authenticate` / `allowRoles` / file-upload middleware and validation chains.
- **Controllers** handle HTTP concerns only: reading `req`, checking validation results, and shaping the `res` payload. They contain no business logic.
- **Services** hold the business rules (duplicate checks, password hashing, availability calculations, cache-or-generate logic for AI summaries, file-path bookkeeping, etc.) and are the only layer allowed to combine data from multiple repositories.
- **Repositories** are the sole layer that talks to the database. They run parameterized queries and return plain rows, with no business logic.

This separation keeps each layer independently testable and makes it straightforward to swap out a layer (e.g. the database driver, the file storage backend, or the AI provider) without touching the others. Dependencies are constructed and wired manually in each `*.routes.js` file (e.g. `new BookService(bookRepository, categoryRepository)`), rather than through a DI framework, keeping the wiring explicit and easy to trace.

A single shared MySQL connection pool (`src/config/databaseConfig.js`) is imported by every repository, rather than each module opening its own connection.

**File handling approach:** book files are uploaded via `multipart/form-data`, validated and stored on local disk by a dedicated `multer` middleware (`bookFileUpload.middleware.js`), and only the resulting path/name/type are persisted in the `books` table — the database never stores file bytes. Reading a book streams that stored file back through an authenticated endpoint rather than exposing the uploads folder directly.

## Project Structure

```
src/
├── app.js                          # Express app: middleware + route mounting
├── server.js                       # Entry point: loads env vars, starts the HTTP server
├── testDB.js                       # One-off script to sanity-check the DB connection
├── config/
│   └── databaseConfig.js           # Shared MySQL connection pool
├── database/
│   ├── 1_users.sql
│   ├── 2_categories.sql
│   ├── 3_books.sql
│   ├── 4_bookSummary.sql
│   ├── 5_updateBooksTable.sql      # Adds filePath / fileType to books
│   └── 6_updateBookFileName.sql    # Adds fileName to books
├── middleware/
│   ├── auth.middleware.js          # Verifies JWT, attaches req.user
│   ├── role.middleware.js          # Restricts a route to specific roles
│   └── bookFileUpload.middleware.js # Multer config: PDF/EPUB only, 20MB limit, disk storage
├── scripts/
│   └── migrate.js                  # Runs every .sql file in src/database against MySQL
└── modules/
    ├── auth/                       # Registration, login
    ├── users/                      # Librarian account creation
    ├── categories/                 # Book category CRUD
    ├── books/                      # Book catalog CRUD, search, filtering, file upload & read
    └── ai/                         # AI-generated book summaries (with DB caching)
```

## Setup Instructions

### Prerequisites

- **Node.js 18+** and npm
- A running **MySQL server** (local install, Docker container, or a cloud instance)
- An **OpenAI-compatible API key** (only required for the AI summary feature — everything else works without it)

### 1. Get the code onto the machine

Clone the repository (or copy the project folder) onto the target machine, then move into it:

```bash
git clone <your-repository-url>
cd <project-folder>
```

### 2. Install dependencies

```bash
npm install
```

This installs Express, MySQL driver, JWT/bcrypt, express-validator, multer, cors, and dotenv as listed in `package.json`.

### 3. Configure environment variables

Copy the example file and fill in your own values:

```bash
cp .env.example .env
```

See [Environment Variables](#environment-variables) below for what each one means. At minimum you must set the `DB_*` values to match a MySQL server this machine can reach, and `JWT_SECRET` to any long random string.

### 4. Create an empty database

Log into MySQL on the target machine and create a database matching `DB_NAME`:

```sql
CREATE DATABASE library_db;
```

### 5. Run the schema migrations

This connects using your `.env` values and executes every `.sql` file in `src/database/` in order, creating the `users`, `categories`, `books`, and `bookSummaries` tables and applying the file-upload column additions:

```bash
npm run migrate
```

You should see each filename printed with `True` next to it. If something prints `False`, the error message underneath it will tell you what failed (e.g. wrong credentials, database not reachable).

### 6. (Optional) Verify the database connection independently

```bash
npm run test:db
```

### 7. Start the server

```bash
npm start
```

For local development, use `npm run dev` instead, which restarts the server automatically on file changes (via `nodemon`).

The API is now available at `http://localhost:5000` (or whatever `PORT` you set in `.env`). Confirm it's running with:

```bash
curl http://localhost:5000/health
```

which should return `{"status":"ok"}`.

### 8. Uploaded files

Uploaded book files are written to `uploads/books/` inside the project folder; this directory is created automatically on first upload if it doesn't already exist. When deploying, make sure this folder is on **persistent** storage.

### 9. Creating the first admin account

There is no API endpoint to create the first `ADMIN` user (by design — see [Assumptions](#assumptions)). After running migrations, register a normal account through `POST /api/auth/register`, then manually promote it in MySQL:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'you@example.com';
```

That admin account can then create librarian accounts via `POST /api/users/librarian`.

## Environment Variables

| Variable          | Required            | Description                                              |
|--------------------|----------------------|-------------------------------------------------------------|
| `PORT`             | No (defaults to 5000)| Port the HTTP server listens on                          |
| `DB_HOST`          | Yes                  | MySQL host                                                |
| `DB_PORT`          | Yes                  | MySQL port                                                |
| `DB_USER`          | Yes                  | MySQL user                                                |
| `DB_PASSWORD`      | Yes                  | MySQL password                                            |
| `DB_NAME`          | Yes                  | MySQL database name                                       |
| `JWT_SECRET`       | Yes                  | Secret used to sign/verify JWTs                           |
| `JWT_EXPIRES_IN`   | Yes                  | JWT expiry (e.g. `1d`, `12h`)                              |
| `AI_API_BASE_URL`  | Only for AI summaries| Base URL of an OpenAI-compatible chat completions API     |
| `AI_API_TOKEN`     | Only for AI summaries| Bearer token for the AI provider                          |

## Database Schema

| Table            | Purpose                                                                 |
|-------------------|--------------------------------------------------------------------------|
| `users`           | Members and staff. `role` is one of `USER`, `LIBRARIAN`, `ADMIN`.       |
| `categories`      | Book categories, with `ACTIVE`/`INACTIVE` status.                      |
| `books`           | Catalog entries, linked to a category. Tracks `total_copies` / `available_copies` (physical-stock fields, currently unused by the digital read flow — see [Assumptions](#assumptions)), plus `filePath`, `fileName`, and `fileType` (`PDF`/`EPUB`) for the uploaded digital copy. |
| `bookSummaries`   | One AI-generated summary per book (1:1 with `books`), cached so repeated requests skip the AI call. |

## Implemented Features

### Authentication & Authorization
- Member self-registration (`POST /api/auth/register`) with `bcryptjs` password hashing
- Login (`POST /api/auth/login`) issuing a signed JWT
- `authenticate` middleware verifying the JWT on protected routes and attaching the user to `req.user`
- `allowRoles` middleware restricting specific routes to `LIBRARIAN`/`ADMIN`
- Three-tier role system: `USER`, `LIBRARIAN`, `ADMIN`

### Staff Management
- Admin-only endpoint to create librarian accounts (`POST /api/users/librarian`)

### Category Management
- Create a category (staff only)
- List all categories (public)
- Delete a category (staff only)
- Category `ACTIVE`/`INACTIVE` status is checked when attaching a book to it

### Book Catalog
- Add a book (staff only), with an **optional** file upload in the same request
- List active books (public), filterable by `categoryID`, `author` (partial match), and `available` (true/false)
- Get a single book's details by ID (public)
- Keyword search across title, author, and description (public)
- Soft-delete a book (staff only) — flips `status` to `INACTIVE` instead of removing the row
- Duplicate-ISBN prevention on creation
- Derived `availability` field (`AVAILABLE`/`UNAVAILABLE`) computed from copy counts on every read

### Digital Book Access
- File upload on book creation, restricted to **PDF and EPUB**, capped at **20MB**, via `multer` disk storage with randomized on-disk filenames (the original filename is preserved separately as `fileName` for display)
- Authenticated **read/download** endpoint (`GET /api/books/:bookID/read`) that streams the stored file back to the requesting user
- Graceful error handling when a book has no associated file, or the file/book doesn't exist

### AI-Generated Summaries
- On-demand summary generation for any book via an OpenAI-compatible chat completions API
- Summaries are cached in `bookSummaries` on first generation, so repeat requests for the same book are served from the database instead of calling the AI provider again
- Provider/model metadata (`provider`, `model`, `generatedAt`) stored alongside each summary

### Cross-Cutting
- Centralized request validation via `express-validator` on every module (registration, login, book creation, search, ID params, etc.)
- Consistent JSON response shape (`success`, `message`/`data`/`errors`) across all endpoints
- `GET /health` liveness check for uptime monitors / load balancers
- Idempotent-by-design schema migration script (`npm run migrate`) that applies every `.sql` file in order and logs per-file success/failure

## API Endpoints

All request/response bodies are JSON unless noted otherwise. Protected endpoints require `Authorization: Bearer <token>`.

### Auth (`/api/auth`)

| Method | Endpoint     | Access | Description              |
|--------|-------------|--------|---------------------------|
| POST   | `/register` | Public | Register a new member     |
| POST   | `/login`    | Public | Log in, receive a JWT     |

### Users (`/api/users`)

| Method | Endpoint      | Access | Description                     |
|--------|---------------|--------|-----------------------------------|
| POST   | `/librarian`  | Admin  | Create a new librarian account    |

### Categories (`/api/categories`)

| Method | Endpoint          | Access             | Description             |
|--------|-------------------|--------------------|--------------------------|
| POST   | `/`               | Librarian, Admin   | Create a category        |
| GET    | `/`               | Public             | List all categories      |
| DELETE | `/:categoryID`    | Librarian, Admin   | Delete a category        |

### Books (`/api/books`)

| Method | Endpoint          | Access             | Description                                                        |
|--------|--------------------|--------------------|------------------------------------------------------------------------|
| POST   | `/`                | Librarian, Admin   | Add a new book. `multipart/form-data` with fields `title`, `author`, `isbn`, `description`, `categoryID`, `total_copies`, and an optional `bookFile` (PDF/EPUB, ≤20MB) |
| GET    | `/`                | Public             | List active books (filter by `categoryID`, `author`, `available`)      |
| GET    | `/search`          | Public             | Keyword search across title, author, description (`?keyword=`)         |
| GET    | `/:bookID`         | Public             | Get a single book's details                                            |
| DELETE | `/:bookID`         | Librarian, Admin   | Soft-delete a book (marks it `INACTIVE`)                               |
| GET    | `/:bookID/read`    | Authenticated      | Streams/downloads the book's stored file                               |

### AI (`/api`)

| Method | Endpoint                    | Access        | Description                                              |
|--------|------------------------------|---------------|------------------------------------------------------------|
| GET    | `/books/:bookID/summary`    | Authenticated | Returns a cached summary, or generates and caches one via the AI provider on first request |

### Health

| Method | Endpoint  | Access | Description        |
|--------|-----------|--------|----------------------|
| GET    | `/health` | Public | Liveness check       |

## Roles & Permissions

| Role        | Can do                                                                         |
|-------------|------------------------------------------------------------------------------------|
| `USER`      | Register, log in, browse/search books and categories, **read/download book files**, view AI summaries |
| `LIBRARIAN` | Everything `USER` can, plus create/delete books (including uploading files) and categories |
| `ADMIN`     | Everything `LIBRARIAN` can, plus create new librarian accounts                     |

`role` defaults to `USER` at the database level, so anyone can self-register as a member through `/api/auth/register`; `LIBRARIAN` and `ADMIN` accounts must be provisioned separately (see [step 9 of Setup](#9-creating-the-first-admin-account) — there's no self-registration path for staff roles, and no `ADMIN`-creation endpoint at all).


## Possible Enhancements

### Digital access
- Move file storage to cloud object storage (e.g. S3) so it works across multiple instances and survives redeploys
- Reading progress tracking (last page/position) per user per book
- Bookmarks, highlights, and notes per user per book
- Favorites / "my library" / reading lists per user
- Concurrent-access limits, or repurposing `total_copies`/`available_copies` into a genuinely digital concept
- In-browser reading view (paginated rendering) rather than only file download

### General API improvements
- Pagination, sorting, and total counts on list endpoints
- Refresh tokens and a logout/token-revocation mechanism
- Book update (`PUT`/`PATCH /books/:bookID`) and category update endpoints, including replacing an uploaded file
- User self-service (view/update own profile, change password)
- A proper first-admin bootstrap mechanism (seed script or one-time setup endpoint)
- Centralized error-handling middleware instead of per-controller try/catch
- Rate limiting (especially on `/auth/login` and the AI summary endpoint) and structured request logging
