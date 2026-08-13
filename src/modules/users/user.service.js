const bcrypt = require("bcryptjs");

/**
 * Business rules for staff-account management. Currently just
 * covers librarian creation, which is restricted to admins at
 * the route level.
 */

class UserService {

    constructor(userRepository) {
        this.userRepository = userRepository;
    }


    /**
     * Creates a librarian account. Rejects the request if the
     * email is already registered, then hashes the password
     * before it's persisted.
     */
    
    async createLibrarian(userData) {

        const {
            firstName,
            lastName,
            email,
            password
        } = userData;

        const existingUser =
            await this.userRepository.findUserByEmail(email);

        if (existingUser) {
            throw new Error("Email is already registered.");
        }

        const hashedPassword =
            await bcrypt.hash(password, 10);

        const librarianID =
            await this.userRepository.createLibrarian({
                firstName,
                lastName,
                email,
                password: hashedPassword
            });

        const librarian =
            await this.userRepository.findUserByID(
                librarianID
            );

        return librarian;
    }
}

module.exports = UserService;