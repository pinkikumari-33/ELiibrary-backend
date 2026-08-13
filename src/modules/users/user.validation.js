const { body } = require("express-validator");

/** Field rules for POST /users/librarian. */

const librarianValidation = [

    body("firstName")
        .trim()
        .notEmpty()
        .withMessage("First name is required")
        .isLength({ min: 2, max: 100 })
        .withMessage("First name must be between 2 and 100 characters"),

    body("lastName")
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage("Last name cannot exceed 100 characters"),

    body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Enter a valid email address")
        .normalizeEmail(),

    body("password")
        .isLength({ min: 6 })
        .withMessage("Password must contain at least 6 characters")
];

module.exports = {
    librarianValidation
};