/**
 * One-off sanity check for the database connection. Run manually
 * with: node src/testDB.js
 */

const db = require("./config/databaseConfig");

async function testConnection(){
    try{
        const [result] = await db.query("Select 1 as result");

        console.log("Database connected successfully");
        console.log(result);

        process.exit(0);

    }catch(error){
        console.error("Database Connection failed");
        console.error(error.message);

        process.exit(1);
    }
}

testConnection();