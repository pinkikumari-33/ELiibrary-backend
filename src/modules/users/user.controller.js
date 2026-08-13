const { validationResult } = require("express-validator");

/**
 * HTTP layer for staff-account management. Access control (admin
 * only) is enforced by middleware at the route level, not here.
 */

class UserController {

    constructor(userService) {
        this.userService = userService;

        this.createLibrarian =
            this.createLibrarian.bind(this);
    }


    /**
     * POST /users/librarian
     * Creates a new librarian account. Admin-only.
     */

    async createLibrarian(req, res) {

        try {

            const validationErrors =
                validationResult(req);

            if (!validationErrors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: validationErrors.array()
                });
            }

            const librarian =
                await this.userService.createLibrarian(
                    req.body
                );

            return res.status(201).json({
                success: true,
                message: "Librarian created successfully.",
                data: librarian
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

module.exports = UserController;