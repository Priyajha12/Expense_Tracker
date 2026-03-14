const { getDB } = require('../config/db');

const getExpenses = async (req, res) => {
    try {
        const db = getDB();
        const { month, year } = req.query;

        let query = `
      SELECT e.*, c.name as category_name, c.color as category_color 
      FROM expenses e 
      LEFT JOIN categories c ON e.category_id = c.id 
      WHERE e.user_id = ? 
    `;
        const params = [req.user.id];

        if (month && year) {
            // SQLite stores DATE as strings typically YYYY-MM-DD
            query += ` AND strftime('%m', e.date) = ? AND strftime('%Y', e.date) = ?`;
            params.push(month.toString().padStart(2, '0'), year.toString());
        }

        query += ` ORDER BY e.date DESC, e.created_at DESC`;

        const expenses = await db.all(query, params);
        res.json({ success: true, data: expenses });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const createExpense = async (req, res) => {
    const { category_id, amount, date, note, payment_method_id } = req.body;

    if (!category_id || !amount || !date || !payment_method_id) {
        return res.status(400).json({ success: false, error: 'Category, Amount, Date, and Payment Method are required' });
    }

    try {
        const db = getDB();

        // Validate category ownership
        const category = await db.get('SELECT id FROM categories WHERE id = ? AND user_id = ?', [category_id, req.user.id]);
        if (!category) {
            return res.status(400).json({ success: false, error: 'Invalid Category' });
        }

        const result = await db.run(
            'INSERT INTO expenses (user_id, category_id, amount, date, note, payment_method_id) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.id, category_id, amount, date, note, payment_method_id]
        );

        const newExpense = await db.get(`
      SELECT e.*, c.name as category_name, c.color as category_color, pm.name as payment_method_name 
      FROM expenses e 
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN payment_methods pm ON e.payment_method_id = pm.id 
      WHERE e.id = ?
    `, result.lastID);

        res.status(201).json({ success: true, data: newExpense });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const createBulkExpenses = async (req, res) => {
    const { date, expenses } = req.body;

    if (!expenses || !Array.isArray(expenses)) {
        return res.status(400).json({ success: false, error: 'Expense list is required' });
    }

    try {
        const db = getDB();
        await db.run('BEGIN TRANSACTION');

        const insertedIds = [];

        for (const item of expenses) {
            const { category_id, amount, note, payment_method_id, date: itemDate } = item;
            const finalDate = itemDate || date;

            // Basic validation for each item
            if (!category_id || !amount || !payment_method_id || !finalDate) continue;

            const result = await db.run(
                'INSERT INTO expenses (user_id, category_id, amount, date, note, payment_method_id) VALUES (?, ?, ?, ?, ?, ?)',
                [req.user.id, category_id, amount, finalDate, note || null, payment_method_id]
            );
            insertedIds.push(result.lastID);
        }

        await db.run('COMMIT');

        res.status(201).json({ success: true, message: `${insertedIds.length} expenses saved` });
    } catch (error) {
        try { const db = getDB(); await db.run('ROLLBACK'); } catch (e) { }
        res.status(500).json({ success: false, error: error.message });
    }
};

const updateExpense = async (req, res) => {
    const { id } = req.params;
    const { category_id, amount, date, note, payment_method_id } = req.body;

    try {
        const db = getDB();

        const expense = await db.get('SELECT * FROM expenses WHERE id = ? AND user_id = ?', [id, req.user.id]);
        if (!expense) {
            return res.status(404).json({ success: false, error: 'Expense not found' });
        }

        // If changing category, validate it
        if (category_id && category_id !== expense.category_id) {
            const category = await db.get('SELECT id FROM categories WHERE id = ? AND user_id = ?', [category_id, req.user.id]);
            if (!category) {
                return res.status(400).json({ success: false, error: 'Invalid Category' });
            }
        }

        await db.run(
            'UPDATE expenses SET category_id = ?, amount = ?, date = ?, note = ?, payment_method_id = ? WHERE id = ?',
            [
                category_id || expense.category_id,
                amount || expense.amount,
                date || expense.date,
                note !== undefined ? note : expense.note,
                payment_method_id || expense.payment_method_id,
                id
            ]
        );

        const updated = await db.get(`
        SELECT e.*, c.name as category_name, c.color as category_color, pm.name as payment_method_name
        FROM expenses e 
        LEFT JOIN categories c ON e.category_id = c.id 
        LEFT JOIN payment_methods pm ON e.payment_method_id = pm.id
        WHERE e.id = ?
      `, id);

        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const deleteExpense = async (req, res) => {
    const { id } = req.params;

    try {
        const db = getDB();

        // Check ownership
        const result = await db.run('DELETE FROM expenses WHERE id = ? AND user_id = ?', [id, req.user.id]);

        if (result.changes === 0) {
            return res.status(404).json({ success: false, error: 'Expense not found' });
        }

        res.json({ success: true, message: 'Expense deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    getExpenses,
    createExpense,
    createBulkExpenses,
    updateExpense,
    deleteExpense
};
