const { body, param } = require("express-validator");

/** Field rules for POST /categories. */

const createCategoryValidation = [
    body("categoryName")
        .trim()
        .notEmpty()
        .withMessage("Category name is required")
        .isLength({ min: 2, max: 150 })
        .withMessage("Category name must be between 2 and 150 characters"),

    body("categoryDescription")
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage("Category description cannot exceed 500 characters")
];

/** Validates the :categoryID route param on DELETE /categories/:categoryID. */

const categoryIDValidation = [
    param("categoryID")
        .isInt({ min: 1 })
        .withMessage("Category ID must be a valid number")
];

module.exports = {
    createCategoryValidation,
    categoryIDValidation
};