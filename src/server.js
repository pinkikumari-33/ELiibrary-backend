/**
 * Entry point: loads environment variables and starts the HTTP
 * server. Kept separate from app.js so the Express app itself
 * stays easy to import into tests without binding a port.
 */

require("dotenv").config();

const app = require("./app");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});