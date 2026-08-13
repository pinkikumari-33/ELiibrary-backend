/**
 * Business rules for books: makes sure ISBNs and categories are
 * valid before touching the database, and shapes repository rows
 * into the format the API returns (e.g. adding an `availability`
 * flag derived from copy counts).
 */

class BookService {

    constructor(bookRepository, categoryRepository) {
        this.bookRepository = bookRepository;
        this.categoryRepository = categoryRepository;
    }

    /**
     * Registers a new book. Rejects duplicate ISBNs and books
     * pointed at a missing or inactive category.
     */

    async createBook(bookData) {

        const {
            title,
            author,
            isbn,
            description,
            categoryID,
            total_copies
        } = bookData;

        // Check whether ISBN is already registered

        if (isbn) {

            const existingBook =
                await this.bookRepository.findBookByISBN(isbn);

            if (existingBook) {
                throw new Error("A book with this ISBN already exists.");
            }
        }

        // Check category only when one is provided
        if (categoryID) {

            const selectedCategory =
                await this.categoryRepository.findCategoryById(categoryID);

            if (!selectedCategory) {
                throw new Error("Selected category does not exist.");
            }

            if (selectedCategory.status !== "ACTIVE") {
                throw new Error("Selected category is inactive.");
            }
        }

        // New books start with all copies available
        const available_copies = total_copies;

        const newBookID =
            await this.bookRepository.createBook({
                title,
                author,
                isbn,
                description,
                categoryID,
                total_copies,
                available_copies
            });

        return await this.bookRepository.findBookByID(newBookID);
    }


    /**
     * Lists active books, applying any category/author/availability
     * filters, and attaches a human-readable availability flag.
     */

    async getAllBooks(filters) {

        const books =
            await this.bookRepository.findAllBooks(filters);

        return books.map(book => ({
            ...book,
            availability:
                book.available_copies > 0
                    ? "AVAILABLE"
                    : "UNAVAILABLE"
        }));
    }


    /**
     * Fetches one book by ID, throwing if it doesn't exist.
     */

    async getBookByID(bookID) {

        const book =
            await this.bookRepository.findBookByID(bookID);

        if (!book) {
            throw new Error("Book not found.");
        }

        return {
            ...book,
            availability:
                book.available_copies > 0
                    ? "AVAILABLE"
                    : "UNAVAILABLE"
        };
    }


    /**
     * Keyword search across title/author/description, with the
     * same availability flag applied as the other list endpoints.
     */

    async searchBooks(keyword) {

        const matchingBooks =
            await this.bookRepository.searchBooks(keyword);

        return matchingBooks.map(book => ({
            ...book,
            availability:
                book.available_copies > 0
                    ? "AVAILABLE"
                    : "UNAVAILABLE"
        }));
    }


    /**
     * Soft-deletes a book (sets status to INACTIVE). Throws if the
     * book doesn't exist or has already been removed.
     */
    
    async removeBook(bookID) {

        const book =
            await this.bookRepository.findBookByID(bookID);

        if (!book) {
            throw new Error("Book not found.");
        }

        if (book.status === "INACTIVE") {
            throw new Error("Book is already inactive.");
        }

        await this.bookRepository.deactivateBook(bookID);

        return {
            bookID,
            message: "Book deactivated successfully."
        };
    }
}

module.exports = BookService;