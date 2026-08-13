/**
 * Public authentication routes: registering a new member account
 * and logging in.
 */

const express = require("express");

const {
    registerValidation,
    loginValidation
} = require("./auth.validation");

const authenticate = require("../../middleware/auth.middleware");

const AuthRepository = require("./auth.repository");
const AuthService = require("./auth.service");
const AuthController = require("./auth.controller");

const router = express.Router();

const authRepository = new AuthRepository();

const authService = new AuthService(authRepository);

const authController = new AuthController(authService);

router.post(
    "/register",
    registerValidation,
    authController.register
);

router.post(
    "/login",
    loginValidation,
    authController.login
);

module.exports = router;