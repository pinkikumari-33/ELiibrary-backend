/**
 * Book catalog routes. Browsing (list/search/detail) is public;
 * adding and removing books requires a librarian or admin token.
 */

const express = require("express");

const BookRepository = require("./books.repository");
const BookService = require("./books.service");
const BookController = require("./books.controller");

const CategoryRepository = require("../categories/category.repository");

const authenticate =
    require("../../middleware/auth.middleware");

const allowRoles =
    require("../../middleware/role.middleware");

const bookFileUpload =
require("../../middleware/bookFileUpload.middleware");

const {
    createBookValidation,
    bookIDValidation,
    searchBookValidation
} = require("./books.validation");

const router = express.Router();

const bookRepository =
    new BookRepository();

const categoryRepository =
    new CategoryRepository();

const bookService =
    new BookService(
        bookRepository,
        categoryRepository
    );

const bookController =
    new BookController(bookService);

    
router.post(
    "/",
    authenticate,
    allowRoles("ADMIN", "LIBRARIAN"),
    bookFileUpload.single("bookFile"),
    createBookValidation,
    bookController.createBook
);


router.get(
    "/",
    bookController.getAllBooks
);


router.get(
    "/search",
    searchBookValidation,
    bookController.searchBooks
);


router.get(
    "/:bookID",
    bookIDValidation,
    bookController.getBookByID
);


router.delete(
    "/:bookID",
    authenticate,
    allowRoles("LIBRARIAN", "ADMIN"),
    bookIDValidation,
    bookController.removeBook
);


router.get(
    "/:bookID/read",
    authenticate,
    bookController.readBook
);

module.exports = router;
