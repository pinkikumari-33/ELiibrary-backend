const db = require("../../config/databaseConfig");

/**
 * Data access layer for the `books` table.
 * Every method here only talks to the database - no business rules,
 * no validation. That logic belongs in BookService.
 */

class BookRepository {

    /**
     * Inserts a new book row and returns the new bookID.
     */

    async createBook(bookData) {

        const {
            title,
            author,
            isbn,
            description,
            categoryID,
            total_copies,
            filePath,
            fileName,
            fileType
        } = bookData;
    
        const [result] = await db.query(
            `
            INSERT INTO books (
                title,
                author,
                isbn,
                description,
                categoryID,
                total_copies,
                filePath,
                fileName,
                fileType
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                title,
                author,
                isbn,
                description,
                categoryID,
                total_copies,
                filePath,
                fileName,
                fileType
            ]
        );
    
        return result.insertId;
    }


    /**
     * Fetches a single book (with its category name) by bookID.
     * Returns null when no matching book exists.
     */

    async findBookByID(bookID) {

        const [books] = await db.query(`
            SELECT
                b.bookID,
                b.title,
                b.author,
                b.isbn,
                b.description,
                b.categoryID,
                c.categoryName,
                b.total_copies,
                b.available_copies,
                b.status,
                b.createdAt,
                b.updatedAt
            FROM books b
            LEFT JOIN categories c
                ON b.categoryID = c.categoryID
            WHERE b.bookID = ?
            LIMIT 1
        `, [bookID]);

        return books[0] || null;
    }


    /**
     * Lists active books, optionally narrowed down by category,
     * author (partial match), and availability.
     */

    async findAllBooks(filters = {}) {

        const {
            categoryID,
            author,
            available
        } = filters;

        let query = `
            SELECT
                b.bookID,
                b.title,
                b.author,
                b.isbn,
                b.description,
                b.categoryID,
                c.categoryName,
                b.total_copies,
                b.available_copies,
                b.status,
                b.createdAt,
                b.updatedAt
            FROM books b
            LEFT JOIN categories c
                ON b.categoryID = c.categoryID
            WHERE b.status = 'ACTIVE'
        `;

        const queryValues = [];

        if (categoryID) {
            query += ` AND b.categoryID = ?`;
            queryValues.push(categoryID);
        }

        if (author) {
            query += ` AND b.author LIKE ?`;
            queryValues.push(`%${author}%`);
        }

        if (available === "true") {
            query += ` AND b.available_copies > 0`;
        }

        if (available === "false") {
            query += ` AND b.available_copies = 0`;
        }

        query += ` ORDER BY b.title ASC`;

        const [books] = await db.query(
            query,
            queryValues
        );

        return books;
    }


    /**
     * Free-text search across title, author, and description.
     * Only active books are considered a match.
     */

    async searchBooks(keyword) {

        const searchPattern = `%${keyword}%`;

        const [books] = await db.query(`
            SELECT
                b.bookID,
                b.title,
                b.author,
                b.isbn,
                b.description,
                b.categoryID,
                c.categoryName,
                b.total_copies,
                b.available_copies,
                b.status
            FROM books b
            LEFT JOIN categories c
                ON b.categoryID = c.categoryID
            WHERE b.status = 'ACTIVE'
              AND (
                    b.title LIKE ?
                    OR b.author LIKE ?
                    OR b.description LIKE ?
              )
            ORDER BY b.title ASC
        `, [
            searchPattern,
            searchPattern,
            searchPattern
        ]);

        return books;
    }


    /**
     * Looks a book up by its ISBN - used to stop duplicate ISBNs
     * from being registered when a new book is created.
     */

    async findBookByISBN(isbn) {

        const [books] = await db.query(`
            SELECT
                bookID,
                title,
                author,
                isbn
            FROM books
            WHERE isbn = ?
            LIMIT 1
        `, [isbn]);

        return books[0] || null;
    }


    /**
     * Soft-deletes a book by flipping its status to INACTIVE
     * instead of removing the row, so loan history stays intact.
     */
    
    async deactivateBook(bookID) {

        const [result] = await db.query(`
            UPDATE books
            SET status = 'INACTIVE'
            WHERE bookID = ?
        `, [bookID]);

        return result.affectedRows;
    }

    async findBookFile(bookID) {

        const [rows] = await db.query(
            `
            SELECT
                bookID,
                title,
                filePath,
                fileName,
                fileType
            FROM books
            WHERE bookID = ?
            LIMIT 1
            `,
            [bookID]
        );
    
        return rows[0] || null;
    }
}

module.exports = BookRepository;
