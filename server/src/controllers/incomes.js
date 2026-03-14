const { getDB } = require('../config/db');

// --- Incomes ---
const createIncome = async (req, res) => {
    const { income_category_id, amount, date, note } = req.body;

    if (!income_category_id || !amount || !date) {
        return res.status(400).json({ success: false, error: 'Category, Amount, and Date are required' });
    }

    try {
        const db = getDB();

        // Validate income category
        const category = await db.get('SELECT id FROM income_categories WHERE id = ? AND user_id = ?', [income_category_id, req.user.id]);
        if (!category) {
            return res.status(400).json({ success: false, error: 'Invalid Income Category' });
        }

        const result = await db.run(
            'INSERT INTO incomes (user_id, income_category_id, amount, date, note) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, income_category_id, amount, date, note]
        );

        const newIncome = await db.get('SELECT i.*, ic.name as category_name FROM incomes i JOIN income_categories ic ON i.income_category_id = ic.id WHERE i.id = ?', result.lastID);

        res.status(201).json({ success: true, data: newIncome });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const getIncomes = async (req, res) => {
    const { month, year } = req.query;
    try {
        const db = getDB();
        let query = `
            SELECT i.*, ic.name as category_name 
            FROM incomes i 
            JOIN income_categories ic ON i.income_category_id = ic.id 
            WHERE i.user_id = ?
        `;
        const params = [req.user.id];

        if (month && year) {
            query += " AND strftime('%m', i.date) = ? AND strftime('%Y', i.date) = ?";
            params.push(month.toString().padStart(2, '0'), year.toString());
        }

        query += " ORDER BY i.date DESC";

        const incomes = await db.all(query, params);
        res.json({ success: true, data: incomes });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const deleteIncome = async (req, res) => {
    const { id } = req.params;
    try {
        const db = getDB();
        const result = await db.run('DELETE FROM incomes WHERE id = ? AND user_id = ?', [id, req.user.id]);
        if (result.changes === 0) {
            return res.status(404).json({ success: false, error: 'Income not found' });
        }
        res.json({ success: true, message: 'Income deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// --- Income Categories ---
const getIncomeCategories = async (req, res) => {
    try {
        const db = getDB();
        let cats = await db.all('SELECT * FROM income_categories WHERE user_id = ?', req.user.id);

        if (cats.length === 0) {
            const defaultIncomeCats = ['Salary', 'Bonus', 'Gift', 'Savings'];
            for (const catName of defaultIncomeCats) {
                await db.run(
                    'INSERT INTO income_categories (user_id, name) VALUES (?, ?)',
                    [req.user.id, catName]
                );
            }
            cats = await db.all('SELECT * FROM income_categories WHERE user_id = ?', req.user.id);
        }

        res.json({ success: true, data: cats });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    createIncome,
    getIncomes,
    deleteIncome,
    getIncomeCategories
};
