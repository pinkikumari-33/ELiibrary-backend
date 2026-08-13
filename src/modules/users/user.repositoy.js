const db = require("../../config/databaseConfig");

class UserRepository {

    async findUserByEmail(email) {

        const [users] = await db.query(`
            SELECT
                userID,
                firstName,
                lastName,
                email,
                password,
                role,
                status
            FROM users
            WHERE email = ?
            LIMIT 1
        `, [email]);

        return users[0] || null;
    }


    async createLibrarian(userData) {

        const {
            firstName,
            lastName,
            email,
            password
        } = userData;

        const [result] = await db.query(`
            INSERT INTO users (
                firstName,
                lastName,
                email,
                password,
                role,
                status
            )
            VALUES (?, ?, ?, ?, 'LIBRARIAN', 'ACTIVE')
        `, [
            firstName,
            lastName,
            email,
            password
        ]);

        return result.insertId;
    }


    async findUserByID(userID) {

        const [users] = await db.query(`
            SELECT
                userID,
                firstName,
                lastName,
                email,
                role,
                status,
                createdAt
            FROM users
            WHERE userID = ?
            LIMIT 1
        `, [userID]);

        return users[0] || null;
    }
}

module.exports = UserRepository;