const express = require("express");

const CategoryRepository = require("./category.repository");
const CategoryService = require("./category.service");
const CategoryController = require("./category.controller");

const authenticate =
    require("../../middleware/auth.middleware");

const allowRoles =
    require("../../middleware/role.middleware");

const {
    createCategoryValidation,
    categoryIDValidation
} = require("./category.validation");

const router = express.Router();

const categoryRepository =
    new CategoryRepository();

const categoryService =
    new CategoryService(categoryRepository);

const categoryController =
    new CategoryController(categoryService);


// Anyone can browse categories, but only staff can create or
// remove them - same authenticate + allowRoles pattern used by
// the books and users modules.

router.post(
    "/",
    authenticate,
    allowRoles("LIBRARIAN", "ADMIN"),
    createCategoryValidation,
    categoryController.createCategory
);


router.get(
    "/",
    categoryController.getAllCategories
);


router.delete(
    "/:categoryID",
    authenticate,
    allowRoles("LIBRARIAN", "ADMIN"),
    categoryIDValidation,
    categoryController.removeCategory
);


module.exports = router;
