const { validationResult } = require("express-validator");


/**
 * HTTP layer for registration and login. Validation errors are
 * handled here; everything else is delegated to AuthService.
 */

class AuthController {

    constructor(authService) {
        this.authService = authService;

        this.register = this.register.bind(this);
        this.login = this.login.bind(this);
    }

    /**
     * POST /auth/register
     * Creates a new member account and returns its public details.
     */

    async register(req, res) {
        try {

            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }
            
            const user =
                await this.authService.registerUser(req.body);

            
            return res.status(201).json({
                success: true,
                message: "User registered successfully",
                data: user
            });

        } catch (error) {

            console.error(error);

            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * POST /auth/login
     * Verifies credentials and returns a JWT for subsequent
     * authenticated requests.
     */
    
    async login(req, res) {

        try {
            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }
            
            const {
                email,
                password
            } = req.body;
    
            const result =
                await this.authService.loginUser(
                    email,
                    password
                );
    
            return res.status(200).json({
                success: true,
                message: "Login successful",
                data: result
            });
    
        } catch (error) {
    
            console.error(error);
    
            return res.status(401).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = AuthController;