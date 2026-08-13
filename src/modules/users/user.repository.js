const db = require("../../config/databaseConfig");

/**
 * Data access layer for staff-account management (currently just
 * librarian creation). General user lookups used during login live
 * in the auth module's own repository - this one is scoped to what
 * the users module needs.
 */

class UserRepository {

    /**
     * Looks up a user by email - used to stop the same email
     * being registered as a librarian twice.
     */

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


    /**
     * Inserts a new user row with the LIBRARIAN role. The role and
     * status are fixed in the query itself since this method only
     * ever creates librarians, never plain members or admins.
     */

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


    /**
     * Fetches a user by ID without the password hash - used to
     * return a safe representation of a newly created librarian.
     */
    
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
