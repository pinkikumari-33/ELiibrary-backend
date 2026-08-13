const db = require("../../config/databaseConfig");

/**
 * Data access layer for authentication: looking up users by email
 * (registration/login) or ID (building the response after login),
 * and inserting new member accounts.
 */

class AuthRepository{

    /**
     * Looks up a user by email, including their password hash -
     * needed both to check for duplicate registrations and to
     * verify the password on login.
     */

    async findUserByEmail(email){
        const [rows] = await db.query(`
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

        return rows[0] || null;
    }

    /**
     * Inserts a new member account. Role defaults to USER via the
     * table's own DEFAULT, so it isn't set explicitly here.
     */

    async createNewUser(userData){
        const {
            firstName,
            lastName,
            email,
            password
        } = userData;

        const [result] = await db.query(
        `
            INSERT INTO users(
                firstName,
                lastName,
                email,
                password
            ) VALUES (?,?,?,?)

        `,  [firstName,lastName,email,password]

        );

        return result.insertId;
    }

    /**
     * Fetches a user by ID without the password hash - used to
     * build the safe "user" object returned after registration.
     */
    
    async findUserById(userID){

        const [rows] = await db.query(`
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
            LIMIT 1`,
            [userID]
        );

        return rows[0] || null;
    }
}

module.exports = AuthRepository;