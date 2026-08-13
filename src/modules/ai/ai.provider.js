class AIProvider {

    async generateSummary(bookInformation) {

        const response = await fetch(
            `${process.env.AI_API_BASE_URL}/v1/chat/completions`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization":
                        `Bearer ${process.env.AI_API_TOKEN}`
                },

                body: JSON.stringify({
                    model: "gpt-4o-mini",

                    messages: [
                        {
                            role: "system",
                            content:
                                "You are a helpful library assistant. Create a clear and concise summary of the provided book information. Do not invent facts that are not present in the provided information."
                        },
                        {
                            role: "user",
                            content:
                                `Create a short book summary using this information:\n\n${bookInformation}`
                        }
                    ],

                    max_tokens: 500,
                    temperature: 0.5
                })
            }
        );

        const responseData = await response.json();

        if (!response.ok) {

            const apiMessage =
                responseData?.error?.message ||
                "AI service request failed.";

            throw new Error(apiMessage);
        }

        const generatedSummary =
            responseData?.choices?.[0]?.message?.content;

        if (!generatedSummary) {
            throw new Error(
                "AI service returned an empty summary."
            );
        }

        return generatedSummary;
    }
}

module.exports = AIProvider;