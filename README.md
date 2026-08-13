# Library Management API

A REST API for managing users, librarians, categories, books, uploaded book files, and AI-generated book summaries.

This guide is intentionally written as a **step-by-step API testing workflow**. Follow the steps in order because the output of one step is used in the next.

---

# 1. Technology Stack

- Node.js
- Express.js
- MySQL
- JWT Authentication
- bcryptjs
- express-validator
- Multer
- OpenAI-compatible AI API

---

# 2. Before You Start

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```env
PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=library_db

JWT_SECRET=your_long_random_secret
JWT_EXPIRES_IN=1d

AI_API_BASE_URL=https://your-ai-provider.example.com
AI_API_TOKEN=your_ai_token
```

Create the database:

```sql
CREATE DATABASE library_db;
```

Run migrations:

```bash
node src/scripts/migrate.js
```

Start the API:

```bash
node src/server.js
```

Base URL:

```text
http://localhost:5000
```

---

# 3. Complete Testing Flow

Follow this sequence:

```text
STEP 1  → Check API health
STEP 2  → Register a normal USER
STEP 3  → Login as USER
STEP 4  → Promote that USER to ADMIN in the database
STEP 5  → Login again and obtain an ADMIN token
STEP 6  → Use ADMIN to create a LIBRARIAN
STEP 7  → Login as the LIBRARIAN
STEP 8  → Use LIBRARIAN to create categories
STEP 9  → Use LIBRARIAN to create books
STEP 10 → Test public book APIs
STEP 11 → Test protected book-file API
STEP 12 → Test AI book summaries
STEP 13 → Test role restrictions and invalid requests
STEP 14 → Delete test data and verify results
```

---

# STEP 1 — Check API Health

Before testing anything else:

```http
GET /health
```

Example:

```text
http://localhost:5000/health
```

Expected response:

```json
{
  "status": "ok"
}
```

Expected status:

```text
200 OK
```

Do not continue until this works.

---

# STEP 2 — Register a Normal User

Create your first user.

```http
POST /api/auth/register
Content-Type: application/json
```

Body:

```json
{
  "firstName": "Pinki",
  "lastName": "Kumari",
  "email": "admin@example.com",
  "password": "password123"
}
```

Expected status:

```text
201 Created
```

This account is initially created as:

```text
Role: USER
Status: ACTIVE
```

At this point, save:

```text
Email: admin@example.com
Password: password123
```

You will use this same account in the next steps.

---

# STEP 3 — Login as the USER

Login using the account created in Step 2.

```http
POST /api/auth/login
Content-Type: application/json
```

Body:

```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

Expected response:

```json
{
  "user": {
    "userID": 1,
    "firstName": "Pinki",
    "lastName": "Kumari",
    "email": "admin@example.com",
    "role": "USER",
    "status": "ACTIVE"
  },
  "token": "your_jwt_token"
}
```

Expected status:

```text
200 OK
```

Save the token temporarily.

> At this stage, the token belongs to a `USER`. It cannot access ADMIN-only or LIBRARIAN-only endpoints.

---

# STEP 4 — Promote the USER to ADMIN

The current API does not expose a public endpoint for promoting a user to `ADMIN`.

For initial testing, update the test user's role directly in MySQL.

First, check the user:

```sql
SELECT userID, firstName, lastName, email, role, status
FROM users
WHERE email = 'admin@example.com';
```

Then promote the user:

```sql
UPDATE users
SET role = 'ADMIN'
WHERE email = 'admin@example.com';
```

Verify:

```sql
SELECT userID, email, role
FROM users
WHERE email = 'admin@example.com';
```

Expected result:

```text
role = ADMIN
```

Important: the JWT from Step 3 may still contain the old `USER` role, so login again.

---

# STEP 5 — Login Again as ADMIN

Use the same credentials:

```http
POST /api/auth/login
Content-Type: application/json
```

Body:

```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

Expected result:

```json
{
  "user": {
    "email": "admin@example.com",
    "role": "ADMIN"
  },
  "token": "new_admin_jwt"
}
```

Save this token as:

```text
ADMIN_TOKEN
```

For every ADMIN request:

```http
Authorization: Bearer <ADMIN_TOKEN>
```

---

# STEP 6 — Use ADMIN to Create a LIBRARIAN

Now use the ADMIN token.

```http
POST /api/users/librarian
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json
```

Body:

```json
{
  "firstName": "John",
  "lastName": "Librarian",
  "email": "librarian@example.com",
  "password": "password123"
}
```

Expected status:

```text
201 Created
```

The new account should have:

```text
Role: LIBRARIAN
Status: ACTIVE
```

This proves that:

```text
ADMIN → can create LIBRARIAN
```

---

# STEP 7 — Login as the LIBRARIAN

Now login using the librarian account.

```http
POST /api/auth/login
Content-Type: application/json
```

Body:

```json
{
  "email": "librarian@example.com",
  "password": "password123"
}
```

Expected status:

```text
200 OK
```

Save the returned token as:

```text
LIBRARIAN_TOKEN
```

From this point onward, use:

```http
Authorization: Bearer <LIBRARIAN_TOKEN>
```

The librarian will now perform the main library-management operations.

---

# STEP 8 — LIBRARIAN Creates a Category

```http
POST /api/categories
Authorization: Bearer <LIBRARIAN_TOKEN>
Content-Type: application/json
```

Body:

```json
{
  "categoryName": "Computer Science",
  "categoryDescription": "Books related to programming and software development."
}
```

Expected status:

```text
201 Created
```

Save the returned category ID:

```text
CATEGORY_ID
```

Now verify that the category exists.

```http
GET /api/categories
```

Expected status:

```text
200 OK
```

Find and save the ID of the category you created.

---

# STEP 9 — LIBRARIAN Creates a Book

The create-book endpoint uses:

```text
multipart/form-data
```

Use:

```http
POST /api/books
Authorization: Bearer <LIBRARIAN_TOKEN>
```

Add these fields:

| Key | Type | Example |
|---|---|---|
| `title` | Text | Clean Code |
| `author` | Text | Robert C. Martin |
| `isbn` | Text | 9780132350884 |
| `description` | Text | A book about writing maintainable code. |
| `categoryID` | Text | `CATEGORY_ID` |
| `total_copies` | Text | 5 |

Expected status:

```text
201 Created
```

Save:

```text
BOOK_ID
```

---

# STEP 10 — LIBRARIAN Creates a Book With a File

Use the same endpoint:

```http
POST /api/books
Authorization: Bearer <LIBRARIAN_TOKEN>
Content-Type: multipart/form-data
```

Text fields:

```text
title = The Pragmatic Programmer
author = Andrew Hunt
isbn = 9780201616224
description = A software development book
categoryID = CATEGORY_ID
total_copies = 3
```

Add a file using the exact field name:

```text
bookFile
```

Allowed file types:

```text
.pdf
.epub
```

Maximum size:

```text
20 MB
```

Expected status:

```text
201 Created
```

Save this book's ID as:

```text
BOOK_WITH_FILE_ID
```

---

# STEP 11 — Test Public Book APIs

These endpoints do not require authentication.

## Get All Books

```http
GET /api/books
```

Expected:

```text
200 OK
```

## Filter by Category

```http
GET /api/books?categoryID=1
```

## Filter by Author

```http
GET /api/books?author=Robert
```

## Show Only Available Books

```http
GET /api/books?available=true
```

## Search Books

```http
GET /api/books/search?keyword=clean
```

Expected:

```text
200 OK
```

## Get Book by ID

```http
GET /api/books/BOOK_ID
```

Expected:

```text
200 OK
```

---

# STEP 12 — Test Reading the Uploaded Book File

Use the ID saved in Step 10.

```http
GET /api/books/BOOK_WITH_FILE_ID/read
Authorization: Bearer <LIBRARIAN_TOKEN>
```

Expected:

```text
200 OK
```

The API returns the stored book file.

Also test the endpoint without a token.

Expected:

```text
401 Unauthorized
```

---

# STEP 13 — Test AI Book Summary

Use any authenticated token.

```http
GET /api/books/BOOK_ID/summary
Authorization: Bearer <LIBRARIAN_TOKEN>
```

Expected status:

```text
200 OK
```

On the first request:

```text
Book details
   ↓
AI provider
   ↓
Summary generated
   ↓
Summary saved in database
   ↓
Response returned
```

Send the same request again:

```http
GET /api/books/BOOK_ID/summary
Authorization: Bearer <LIBRARIAN_TOKEN>
```

The saved summary should be returned from the database instead of generating a new one.

Required `.env` values:

```env
AI_API_BASE_URL=...
AI_API_TOKEN=...
```

---

# STEP 14 — Test USER Permissions

Register another normal user.

```http
POST /api/auth/register
```

Then login and save:

```text
USER_TOKEN
```

Now try creating a category:

```http
POST /api/categories
Authorization: Bearer <USER_TOKEN>
```

Expected:

```text
403 Forbidden
```

Try creating a librarian:

```http
POST /api/users/librarian
Authorization: Bearer <USER_TOKEN>
```

Expected:

```text
403 Forbidden
```

This verifies:

```text
USER ≠ LIBRARIAN
USER ≠ ADMIN
```

---

# STEP 15 — Test LIBRARIAN Permissions

Use:

```text
LIBRARIAN_TOKEN
```

Try:

```http
POST /api/users/librarian
Authorization: Bearer <LIBRARIAN_TOKEN>
```

Expected:

```text
403 Forbidden
```

This verifies:

```text
LIBRARIAN → can manage books/categories
LIBRARIAN → cannot create another librarian
```

---

# STEP 16 — Test Missing or Invalid Authentication

For a protected endpoint:

```http
POST /api/categories
```

## No token

Expected:

```text
401 Unauthorized
```

## Invalid token

```http
Authorization: Bearer invalid-token
```

Expected:

```text
401 Unauthorized
```

## Wrong format

```http
Authorization: Token abc123
```

Expected:

```text
401 Unauthorized
```

---

# STEP 17 — Test Validation Errors

## Register with invalid email

```json
{
  "firstName": "Test",
  "lastName": "User",
  "email": "invalid-email",
  "password": "password123"
}
```

Expected:

```text
400 Bad Request
```

## Register with short password

```json
{
  "firstName": "Test",
  "lastName": "User",
  "email": "test@example.com",
  "password": "123"
}
```

Expected:

```text
400 Bad Request
```

## Search without keyword

```http
GET /api/books/search
```

Expected:

```text
400 Bad Request
```

## Invalid Book ID

```http
GET /api/books/abc
```

Expected:

```text
400 Bad Request
```

## Non-existing Book

```http
GET /api/books/999999
```

Expected:

```text
404 Not Found
```

---

# STEP 18 — Test Invalid File Upload

Use:

```http
POST /api/books
Authorization: Bearer <LIBRARIAN_TOKEN>
```

Try uploading:

```text
image.jpg
```

Expected:

```text
Request rejected
```

The API only accepts:

```text
.pdf
.epub
```

Also test a file larger than:

```text
20 MB
```

---

# STEP 19 — Delete a Book

Use the librarian token:

```http
DELETE /api/books/BOOK_ID
Authorization: Bearer <LIBRARIAN_TOKEN>
```

Expected:

```text
200 OK
```

Book deletion is a **soft delete**.

The database status becomes:

```text
INACTIVE
```

Verify:

```http
GET /api/books
```

The deleted book should no longer appear in the active public list.

---

# STEP 20 — Delete a Category

Use:

```http
DELETE /api/categories/CATEGORY_ID
Authorization: Bearer <LIBRARIAN_TOKEN>
```

Expected:

```text
200 OK
```

Category deletion is a hard delete.

Associated books use the database rule:

```text
ON DELETE SET NULL
```

Therefore, deleting a category does not necessarily delete its books.

---

# Complete Role Flow

The complete recommended testing flow is:

```text
┌───────────────┐
│ Register USER │
└───────┬───────┘
        ↓
┌───────────────┐
│ Login as USER │
└───────┬───────┘
        ↓
┌─────────────────────────────┐
│ Promote USER to ADMIN in DB │
└───────────────┬─────────────┘
                ↓
┌────────────────────┐
│ Login again as ADMIN│
└──────────┬─────────┘
           ↓
┌────────────────────────┐
│ ADMIN creates LIBRARIAN │
└──────────┬─────────────┘
           ↓
┌──────────────────────────┐
│ Login as LIBRARIAN       │
└──────────┬───────────────┘
           ↓
┌──────────────────────────┐
│ Create Category          │
└──────────┬───────────────┘
           ↓
┌──────────────────────────┐
│ Create Books + Upload    │
└──────────┬───────────────┘
           ↓
┌──────────────────────────┐
│ Test Public APIs         │
└──────────┬───────────────┘
           ↓
┌──────────────────────────┐
│ Test File Reading        │
└──────────┬───────────────┘
           ↓
┌──────────────────────────┐
│ Test AI Summary          │
└──────────┬───────────────┘
           ↓
┌──────────────────────────┐
│ Test USER restrictions   │
└──────────┬───────────────┘
           ↓
┌──────────────────────────┐
│ Test LIBRARIAN limits    │
└──────────┬───────────────┘
           ↓
┌──────────────────────────┐
│ Test validation/errors   │
└──────────────────────────┘
```

---

# Endpoint Summary

## Health

```text
GET /health
```

## Authentication

```text
POST /api/auth/register
POST /api/auth/login
```

## Users

```text
POST /api/users/librarian
```

Requires:

```text
ADMIN
```

## Categories

```text
POST   /api/categories
GET    /api/categories
DELETE /api/categories/:categoryID
```

Create/delete requires:

```text
LIBRARIAN or ADMIN
```

## Books

```text
POST   /api/books
GET    /api/books
GET    /api/books/search
GET    /api/books/:bookID
DELETE /api/books/:bookID
GET    /api/books/:bookID/read
```

Create/delete requires:

```text
LIBRARIAN or ADMIN
```

Reading a book file requires authentication.

## AI

```text
GET /api/books/:bookID/summary
```

Requires authentication.

---

# Postman Environment

Create these variables:

| Variable | Value |
|---|---|
| `baseUrl` | `http://localhost:5000` |
| `adminToken` | JWT after ADMIN login |
| `librarianToken` | JWT after LIBRARIAN login |
| `userToken` | JWT for normal USER |
| `categoryID` | Created category ID |
| `bookID` | Created book ID |
| `bookWithFileID` | Book with uploaded file |

Example:

```text
{{baseUrl}}/api/books/{{bookID}}
```

For protected endpoints:

```text
Authorization: Bearer {{librarianToken}}
```

---


# Important Note

The testing workflow intentionally starts with a normal `USER` account and promotes that account to `ADMIN` directly in the database because the current API exposes an endpoint for:

```text
ADMIN → Create LIBRARIAN
```

but does not expose a public endpoint for:

```text
USER → ADMIN promotion
```

Once the initial ADMIN test account exists, the rest of the API can be tested through the intended role-based flow:

```text
ADMIN
   ↓
Creates LIBRARIAN
   ↓
LIBRARIAN
   ↓
Manages Categories and Books
   ↓
USER
   ↓
Uses authenticated features and tests permission restrictions
```
