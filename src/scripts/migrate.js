/**
 *  
 * One-off script that runs every .sql file in src/database
 * against the configured MySQL database, in filename order
 * (hence the numeric prefixes like 001_, 002_, ...).
 * Run manually with: node src/Scripts/migrate.js
 */

const fs = require("fs");
const path = require("path");
const db = require("../config/databaseConfig");

async function migrate() {

    // Folder containing the numbered .sql migration files.
    const schemaFolder =
        path.join(__dirname, "../database");

    const files = fs.readdirSync(schemaFolder);

    // Execute each SQL file in turn, logging success/failure per file
    // so one bad migration doesn't stop the rest from being attempted.
    for (const file of files) {

        const sql = fs.readFileSync(
            path.join(schemaFolder, file),
            "utf8"
        );

        try {
            await db.query(sql);
            console.log(`${file} True`);
        }
        catch (err) {

            console.log(`${file} False`);
            console.log(err.message);
        }
    }

    process.exit(0);
}

migrate();