const express = require("express");

const AIRepository = require("./ai.repository");
const AIService = require("./ai.service");
const AIController = require("./ai.controller");
const AIProvider = require("./ai.provider");

const authenticate =
    require("../../middleware/auth.middleware");

const {
    bookSummaryValidation
} = require("./ai.validation");

const router = express.Router();

const aiRepository =
    new AIRepository();

const aiProvider =
    new AIProvider();

const aiService =
    new AIService(
        aiRepository,
        aiProvider
    );

const aiController =
    new AIController(aiService);

router.get(
    "/books/:bookID/summary",
    authenticate,
    bookSummaryValidation,
    aiController.getBookSummary
);

module.exports = router;