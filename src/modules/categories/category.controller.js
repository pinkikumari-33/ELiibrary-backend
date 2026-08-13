const { validationResult } = require("express-validator");

/**
 * HTTP layer for book categories. Create/delete are staff-only
 * (enforced by middleware in category.routes.js); listing is public.
 */

class CategoryController {

    constructor(categoryService) {
        this.categoryService = categoryService;

        this.createCategory = this.createCategory.bind(this);
        this.getAllCategories = this.getAllCategories.bind(this);
        this.removeCategory = this.removeCategory.bind(this);
    }

    /**
     * POST /categories
     * Creates a new category.
     */

    async createCategory(req, res) {

        try {

            const validationErrors = validationResult(req);

            if (!validationErrors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: validationErrors.array()
                });
            }

            const createdCategory =
                await this.categoryService.createCategory(req.body);

            return res.status(201).json({
                success: true,
                message: "Category created successfully.",
                data: createdCategory
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
     * GET /categories
     * Lists all categories.
     */

    async getAllCategories(req, res) {

        try {

            const categoryList =
                await this.categoryService.getAllCategories();

            return res.status(200).json({
                success: true,
                data: categoryList
            });

        } catch (error) {

            console.error(error);

            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * DELETE /categories/:categoryID
     * Removes a category permanently.
     */
    
    async removeCategory(req, res) {

        try {

            const validationErrors = validationResult(req);

            if (!validationErrors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: validationErrors.array()
                });
            }

            const categoryID =
                Number(req.params.categoryID);

            const deleteResult =
                await this.categoryService.removeCategory(categoryID);

            return res.status(200).json({
                success: true,
                message: deleteResult.message
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

module.exports = CategoryController;