const { body, param, query } = require("express-validator");

/** Field rules for POST /books. */

const createBookValidation = [

    body("title")
        .trim()
        .notEmpty()
        .withMessage("Book title is required")
        .isLength({ min: 2, max: 255 })
        .withMessage("Book title must be between 2 and 255 characters"),

    body("author")
        .trim()
        .notEmpty()
        .withMessage("Author name is required")
        .isLength({ min: 2, max: 255 })
        .withMessage("Author name must be between 2 and 255 characters"),

    body("isbn")
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage("ISBN cannot exceed 50 characters"),

    body("description")
        .optional()
        .trim()
        .isLength({ max: 5000 })
        .withMessage("Description cannot exceed 5000 characters"),

    body("categoryID")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Category ID must be a valid number"),

    body("total_copies")
        .isInt({ min: 1 })
        .withMessage("Total copies must be at least 1")
];

/** Validates the :bookID route param on GET/DELETE /books/:bookID. */

const bookIDValidation = [

    param("bookID")
        .isInt({ min: 1 })
        .withMessage("Book ID must be a valid number")
];

/** Field rules for GET /books/search. */

const searchBookValidation = [

    query("keyword")
        .trim()
        .notEmpty()
        .withMessage("Search keyword is required")
        .isLength({ min: 1, max: 100 })
        .withMessage("Search keyword must be between 1 and 100 characters")
];

module.exports = {
    createBookValidation,
    bookIDValidation,
    searchBookValidation
};