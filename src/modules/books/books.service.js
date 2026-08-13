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

    async createBook(bookData, uploadedFile) {

        const {
            title,
            author,
            isbn,
            description,
            categoryID,
            total_copies
        } = bookData;
    
        let filePath = null;
        let fileName = null;
        let fileType = null;
    
        if (uploadedFile) {

            filePath =
                `uploads/books/${uploadedFile.filename}`;
        
            fileName =
                uploadedFile.originalname;
        
            const extension =
                uploadedFile.originalname
                    .split(".")
                    .pop()
                    .toUpperCase();
        
            fileType = extension;
        }
    
        return await this.bookRepository.createBook({
            title,
            author,
            isbn,
            description,
            categoryID,
            total_copies,
            filePath,
            fileName,
            fileType
        });
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

    async getBookFile(bookID) {

        const book =
            await this.bookRepository.findBookFile(bookID);
    
        if (!book) {
            throw new Error("Book not found.");
        }
    
        if (!book.filePath) {
            throw new Error("This book does not have a file.");
        }
    
        return book;
    }
}

module.exports = BookService;