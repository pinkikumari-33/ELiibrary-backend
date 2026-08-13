class AIService {

    constructor(aiRepository, aiProvider) {
        this.aiRepository = aiRepository;
        this.aiProvider = aiProvider;
    }

    async generateBookSummary(bookID) {

        const book = await this.aiRepository.findBookDetails(bookID);

        if (!book) {
            throw new Error("Book not found.");
        }

        const savedSummary =
            await this.aiRepository.findSavedSummary(bookID);

        // Return cached summary
        if (savedSummary) {
            return {
                summary: savedSummary.summary,
                provider: savedSummary.provider,
                model: savedSummary.model,
                generatedAt: savedSummary.generatedAt
            };
        }

        const bookInformation = `
            Title: ${book.title}
            Author: ${book.author}
            Description: ${book.description || "No description available."}
        `.trim();

        // Ask AI provider to generate summary
        const generatedSummary =
            await this.aiProvider.generateSummary(bookInformation);

        // Save generated summary
        await this.aiRepository.saveSummary(
            bookID,
            generatedSummary,
            "userfacet-ai",
            "gpt-4o-mini"
        );

        return {
            summary: generatedSummary,
            provider: "userfacet-ai",
            model: "gpt-4o-mini"
        };
    }
}

module.exports = AIService;