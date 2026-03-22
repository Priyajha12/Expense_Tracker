const { getDB } = require('../config/db');

const getDashboardData = async (req, res) => {
    try {
        const db = getDB();
        const { month, year } = req.query;

        const currentYear = year || new Date().getFullYear();
        const currentMonth = month || (new Date().getMonth() + 1);

        // Filter by Month & Year
        const monthStr = currentMonth.toString().padStart(2, '0');
        const yearStr = currentYear.toString();

        // 1. Total Expense & Transaction Count for the month
        const statsResult = await db.get(
            `SELECT SUM(amount) as total, COUNT(*) as count
             FROM expenses 
             WHERE user_id = ? 
             AND strftime('%m', date) = ? 
             AND strftime('%Y', date) = ?`,
            [req.user.id, monthStr, yearStr]
        );
        const totalExpense = statsResult.total || 0;
        const transactionCount = statsResult.count || 0;

        // 2. Daily Trend (Categorized)
        const dailyTrend = await db.all(
            `SELECT 
                e.date,
                SUM(CASE WHEN c.is_fixed = 1 THEN e.amount ELSE 0 END) as fixedAmount,
                SUM(CASE WHEN c.is_fixed = 0 THEN e.amount ELSE 0 END) as variableAmount,
                SUM(e.amount) as total
             FROM expenses e
             JOIN categories c ON e.category_id = c.id
             WHERE e.user_id = ? 
             AND strftime('%m', e.date) = ? 
             AND strftime('%Y', e.date) = ?
             GROUP BY e.date
             ORDER BY e.date ASC`,
            [req.user.id, monthStr, yearStr]
        );

        // 3. Category Breakdown
        const breakdown = await db.all(
            `SELECT 
                c.id, c.name, c.color, c.is_fixed,
                COALESCE(cb.amount, c.budget, 0) as budget,
                COALESCE(SUM(e.amount), 0) as total 
            FROM categories c
            LEFT JOIN category_budgets cb ON cb.category_id = c.id 
                AND cb.month = ? AND cb.year = ?
            LEFT JOIN expenses e ON e.category_id = c.id
                AND strftime('%m', e.date) = ? 
                AND strftime('%Y', e.date) = ?
            WHERE c.user_id = ? 
            GROUP BY c.id
            HAVING total > 0 OR budget > 0`,
            [monthStr, yearStr, monthStr, yearStr, req.user.id]
        );

        // 4. Monthly Income
        const incomeResult = await db.get(
            `SELECT SUM(amount) as total
             FROM incomes
             WHERE user_id = ?
             AND strftime('%m', date) = ?
             AND strftime('%Y', date) = ?`,
            [req.user.id, monthStr, yearStr]
        );
        const totalIncome = incomeResult.total || 0;

        // 5. Peak Day Insight
        const peakDay = dailyTrend.reduce((max, day) => (day.total > (max.total || 0) ? day : max), {});

        // 6. Payment Method Split
        console.log(`[Dashboard] Fetching split for UID: ${req.user.id}, Date: ${yearStr}-${monthStr}`);
        const paymentSplit = await db.all(
            `SELECT 
                pm.id, pm.name, pm.credit_limit,
                COALESCE(SUM(e.amount), 0) as total
             FROM payment_methods pm
             LEFT JOIN expenses e ON e.payment_method_id = pm.id
                AND strftime('%m', e.date) = ? 
                AND strftime('%Y', e.date) = ?
             WHERE pm.user_id = ?
             GROUP BY pm.id, pm.name, pm.credit_limit`,
            [monthStr, yearStr, req.user.id]
        );
        console.log(`[Dashboard] Found ${paymentSplit.length} methods`);

        res.json({
            success: true,
            data: {
                total: totalExpense,
                income: totalIncome,
                balance: totalIncome - totalExpense,
                transactionCount,
                dailyTrend,
                breakdown: breakdown.sort((a, b) => b.total - a.total),
                paymentSplit,
                peakDay,
                period: { month: currentMonth, year: currentYear }
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = { getDashboardData };
