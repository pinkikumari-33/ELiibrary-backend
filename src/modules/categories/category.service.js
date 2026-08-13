/**
 * Business rules for book categories: prevents duplicate names
 * and confirms a category exists before it can be deleted.
 */

class CategoryService {

    constructor(categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    /**
     * Creates a new category. Throws if a category with the same
     * name already exists.
     */

    async createCategory(categoryData) {

        const {
            categoryName,
            categoryDescription
        } = categoryData;

        const existingCategory =
            await this.categoryRepository.findCategoryByName(categoryName);

        if (existingCategory) {
            throw new Error("Category already exists.");
        }

        const newCategoryID =
            await this.categoryRepository.createCategory({
                categoryName,
                categoryDescription
            });

        return await this.categoryRepository.findCategoryById(
            newCategoryID
        );
    }

    /**
     * Returns every category, active or not.
     */

    async getAllCategories() {

        return await this.categoryRepository.findAllCategories();
    }

    /**
     * Deletes a category outright (hard delete, unlike books which
     * are soft-deleted). Throws if the category doesn't exist.
     */
    
    async removeCategory(categoryID) {

        const categoryRecord =
            await this.categoryRepository.findCategoryById(categoryID);

        if (!categoryRecord) {
            throw new Error("Category not found.");
        }

        await this.categoryRepository.deleteCategory(categoryID);

        return {
            categoryID,
            message: "Category deleted successfully."
        };
    }
}

module.exports = CategoryService;