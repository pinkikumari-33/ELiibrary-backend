const db = require("../../config/databaseConfig");

/**
 * Data access layer for AI-generated book summaries.
 * Reads the book's own details plus any previously saved summary,
 * and persists newly generated summaries to `bookSummaries`.
 */

class AIRepository {

    /**
     * Pulls the fields needed to prompt the AI (title, author,
     * description) for a given book.
     */

    async findBookDetails(bookID) {

        const [books] = await db.query(`
            SELECT
                bookID,
                title,
                author,
                description,
                categoryID
            FROM books
            WHERE bookID = ?
            LIMIT 1
        `, [bookID]);

        return books[0] || null;
    }


    /**
     * Returns a previously generated summary for a book, if one
     * has already been saved. Returns null otherwise.
     */

    async findSavedSummary(bookID) {

        const [summaries] = await db.query(`
            SELECT
                summaryID,
                bookID,
                summary,
                provider,
                model,
                generatedAt,
                updatedAt
            FROM bookSummaries
            WHERE bookID = ?
            LIMIT 1
        `, [bookID]);

        return summaries[0] || null;
    }


    /**
     * Persists a freshly generated summary so future requests for
     * the same book can be served without calling the AI provider.
     */
    
    async saveSummary(bookID, summary, provider, model) {

        const [result] = await db.query(`
            INSERT INTO bookSummaries (
                bookID,
                summary,
                provider,
                model
            )
            VALUES (?, ?, ?, ?)
        `, [
            bookID,
            summary,
            provider,
            model
        ]);

        return result.insertId;
    }
}

module.exports = AIRepository;