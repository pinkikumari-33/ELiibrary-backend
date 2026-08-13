const { validationResult } = require("express-validator");
const path = require("path");

/**
 * HTTP layer for the book catalog.
 * Create/delete are staff-only (enforced by middleware in books.routes.js);
 * browsing is public.
 */

class BookController {

    constructor(bookService) {

        this.bookService = bookService;

        this.createBook = this.createBook.bind(this);
        this.getAllBooks = this.getAllBooks.bind(this);
        this.getBookByID = this.getBookByID.bind(this);
        this.searchBooks = this.searchBooks.bind(this);
        this.removeBook = this.removeBook.bind(this);
        this.readBook = this.readBook.bind(this);
    }

    /**
     * POST /books
     * Adds a new book to the catalog.
     */

    async createBook(req, res) {

        try {

            const validationErrors = validationResult(req);

            if (!validationErrors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: validationErrors.array()
                });
            }

            const createdBook =
                await this.bookService.createBook(
                    req.body,
                    req.file
                );

            return res.status(201).json({
                success: true,
                message: "Book added successfully.",
                data: createdBook
            });

        } catch (error) {

            console.error(error);

            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }


    /**
     * GET /books
     * Lists active books, optionally filtered by categoryID,
     * author, and availability via query params.
     */

    async getAllBooks(req, res) {

        try {

            const filters = {
                categoryID: req.query.categoryID,
                author: req.query.author,
                available: req.query.available
            };

            const bookList =
                await this.bookService.getAllBooks(filters);

            return res.status(200).json({
                success: true,
                count: bookList.length,
                data: bookList
            });

        } catch (error) {

            console.error(error);

            return res.status(500).json({
                success: false,
                message: "Unable to fetch books."
            });
        }
    }


    /**
     * GET /books/:bookID
     * Returns the details of a single book.
     */

    async getBookByID(req, res) {

        try {

            const validationErrors = validationResult(req);

            if (!validationErrors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: validationErrors.array()
                });
            }

            const bookID =
                Number(req.params.bookID);

            const bookDetails =
                await this.bookService.getBookByID(bookID);

            return res.status(200).json({
                success: true,
                data: bookDetails
            });

        } catch (error) {

            console.error(error);

            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
    }


    /**
     * GET /books/search?keyword=
     * Keyword search across title, author, and description.
     */

    async searchBooks(req, res) {

        try {

            const validationErrors = validationResult(req);

            if (!validationErrors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: validationErrors.array()
                });
            }

            const keyword =
                req.query.keyword.trim();

            const searchResults =
                await this.bookService.searchBooks(keyword);

            return res.status(200).json({
                success: true,
                count: searchResults.length,
                data: searchResults
            });

        } catch (error) {

            console.error(error);

            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }


    /**
     * DELETE /books/:bookID
     * Soft-deletes a book.
     */

    async removeBook(req, res) {

        try {

            const validationErrors = validationResult(req);

            if (!validationErrors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: validationErrors.array()
                });
            }

            const bookID =
                Number(req.params.bookID);

            const result =
                await this.bookService.removeBook(bookID);

            return res.status(200).json({
                success: true,
                message: result.message
            });

        } catch (error) {

            console.error(error);

            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }


    /**
     * GET /books/:bookID/read
     * Returns the stored book file.
     * Authentication is enforced in the route.
     */

    async readBook(req, res) {

        try {

            const bookID =
                Number(req.params.bookID);

            const book =
                await this.bookService.getBookFile(bookID);

            const absoluteFilePath =
                path.join(
                    process.cwd(),
                    book.filePath
                );

            return res.sendFile(absoluteFilePath);

        } catch (error) {

            console.error(error);

            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = BookController;