class AIController {

    constructor(aiService) {
        this.aiService = aiService;

        this.getBookSummary =
            this.getBookSummary.bind(this);
    }


    /**
     * GET /books/:bookID/summary
     * Returns an AI-generated summary for the given book,
     * generating and caching one on first request.
     */

    async getBookSummary(req, res) {

        try {

            const bookID =
                Number(req.params.bookID);

            const result =
                await this.aiService.generateBookSummary(
                    bookID
                );

            return res.status(200).json({
                success: true,
                message: "Book summary fetched successfully.",
                data: result
            });

        } catch (error) {

            console.error(error);

            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = AIController;