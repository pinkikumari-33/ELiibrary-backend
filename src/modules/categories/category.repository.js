const db = require("../../config/databaseConfig");

/**
 * Data access layer for the `categories` table.
 */

class CategoryRepository {

    /** Returns every category, alphabetically by name. */

    async findAllCategories() {

        const [categories] = await db.query(`
            SELECT
                categoryID,
                categoryName,
                categoryDescription,
                status,
                createdAt
            FROM categories
            ORDER BY categoryName ASC
        `);

        return categories;
    }

    /** Fetches one category by ID, or null if it doesn't exist. */

    async findCategoryById(categoryID) {

        const [categories] = await db.query(`
            SELECT
                categoryID,
                categoryName,
                categoryDescription,
                status,
                createdAt
            FROM categories
            WHERE categoryID = ?
            LIMIT 1
        `, [categoryID]);

        return categories[0] || null;
    }

    /** Looks a category up by its exact name - used for duplicate checks. */

    async findCategoryByName(categoryName) {

        const [categories] = await db.query(`
            SELECT
                categoryID,
                categoryName,
                categoryDescription,
                status
            FROM categories
            WHERE categoryName = ?
            LIMIT 1
        `, [categoryName]);

        return categories[0] || null;
    }

    /** Inserts a new category and returns its new categoryID. */

    async createCategory(categoryData) {

        const {
            categoryName,
            categoryDescription
        } = categoryData;

        const [result] = await db.query(`
            INSERT INTO categories (
                categoryName,
                categoryDescription
            )
            VALUES (?, ?)
        `, [
            categoryName,
            categoryDescription || null
        ]);

        return result.insertId;
    }

    /** Hard-deletes a category row. */
    
    async deleteCategory(categoryID) {

        const [result] = await db.query(`
            DELETE FROM categories
            WHERE categoryID = ?
        `, [categoryID]);

        return result.affectedRows;
    }
}

module.exports = CategoryRepository;