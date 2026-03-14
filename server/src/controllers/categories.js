const { getDB } = require('../config/db');

const getCategories = async (req, res) => {
    try {
        const db = getDB();
        const categories = await db.all(
            'SELECT * FROM categories WHERE user_id = ? ORDER BY created_at DESC',
            req.user.id
        );
        res.json({ success: true, data: categories });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const createCategory = async (req, res) => {
    const { name, color, is_fixed, fixed_amount, budget, deducted_date } = req.body;
    if (!name) {
        return res.status(400).json({ success: false, error: 'Name is required' });
    }

    try {
        const db = getDB();
        const result = await db.run(
            'INSERT INTO categories (user_id, name, color, is_fixed, fixed_amount, budget, deducted_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, name, color || '#000000', is_fixed ? 1 : 0, fixed_amount || 0, budget || 0, deducted_date]
        );

        const newCategory = await db.get('SELECT * FROM categories WHERE id = ?', result.lastID);

        res.status(201).json({ success: true, data: newCategory });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const updateCategory = async (req, res) => {
    const { id } = req.params;
    const { name, color, is_fixed, fixed_amount, budget, deducted_date } = req.body;

    try {
        const db = getDB();
        const category = await db.get('SELECT * FROM categories WHERE id = ? AND user_id = ?', [id, req.user.id]);
        if (!category) {
            return res.status(404).json({ success: false, error: 'Category not found' });
        }

        await db.run(
            'UPDATE categories SET name = ?, color = ?, is_fixed = ?, fixed_amount = ?, budget = ?, deducted_date = ? WHERE id = ?',
            [
                name || category.name,
                color || category.color,
                is_fixed !== undefined ? (is_fixed ? 1 : 0) : category.is_fixed,
                fixed_amount !== undefined ? fixed_amount : category.fixed_amount,
                budget !== undefined ? budget : category.budget,
                deducted_date !== undefined ? deducted_date : category.deducted_date,
                id
            ]
        );

        const updated = await db.get('SELECT * FROM categories WHERE id = ?', id);
        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const deleteCategory = async (req, res) => {
    const { id } = req.params;

    try {
        const db = getDB();

        // Check ownership
        const category = await db.get('SELECT * FROM categories WHERE id = ? AND user_id = ?', [id, req.user.id]);
        if (!category) {
            return res.status(404).json({ success: false, error: 'Category not found' });
        }

        // Check for linked expenses
        const expenses = await db.get('SELECT COUNT(*) as count FROM expenses WHERE category_id = ?', id);
        if (expenses.count > 0) {
            return res.status(400).json({
                success: false,
                error: 'Cannot delete category with existing expenses. Please reassign or delete the expenses first.'
            });
        }

        await db.run('DELETE FROM categories WHERE id = ?', id);
        res.json({ success: true, message: 'Category deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const setCategoryBudget = async (req, res) => {
    const { category_id, amount, month, year, applyToAllYear } = req.body;

    if (!category_id || amount === undefined || !month || !year) {
        return res.status(400).json({ success: false, error: 'Category ID, amount, month, and year are required' });
    }

    try {
        const db = getDB();

        if (applyToAllYear) {
            // Apply to all months of the given year
            for (let m = 1; m <= 12; m++) {
                await db.run(
                    `INSERT INTO category_budgets (user_id, category_id, month, year, amount) 
                     VALUES (?, ?, ?, ?, ?) 
                     ON CONFLICT(user_id, category_id, month, year) DO UPDATE SET amount = excluded.amount`,
                    [req.user.id, category_id, m, year, amount]
                );
            }
        } else {
            // Apply only to the specific month
            await db.run(
                `INSERT INTO category_budgets (user_id, category_id, month, year, amount) 
                 VALUES (?, ?, ?, ?, ?) 
                 ON CONFLICT(user_id, category_id, month, year) DO UPDATE SET amount = excluded.amount`,
                [req.user.id, category_id, month, year, amount]
            );
        }

        res.json({ success: true, message: 'Budget updated' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    setCategoryBudget
};
