const { param } = require("express-validator");

const bookSummaryValidation = [

    param("bookID")
        .isInt({ min: 1 })
        .withMessage("Book ID must be a valid number")
];

module.exports = {
    bookSummaryValidation
};