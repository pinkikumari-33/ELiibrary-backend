/**
 * Staff-account management routes. Every route here requires a
 * valid token and, on top of that, the ADMIN role - only admins
 * are allowed to create librarian accounts.
 */

const express = require("express");

const UserRepository = require("./user.repository");
const UserService = require("./user.service");
const UserController = require("./user.controller");

const authenticate =
    require("../../middleware/auth.middleware");

const allowRoles =
    require("../../middleware/role.middleware");

const {
    librarianValidation
} = require("./user.validation");

const router = express.Router();

const userRepository =
    new UserRepository();

const userService =
    new UserService(userRepository);

const userController =
    new UserController(userService);


router.post(
    "/librarian",
    authenticate,
    allowRoles("ADMIN"),
    librarianValidation,
    userController.createLibrarian
);


module.exports = router;