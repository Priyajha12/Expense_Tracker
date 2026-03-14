const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getDB } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

const register = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    try {
        const db = getDB();
        const existingUser = await db.get('SELECT id FROM users WHERE email = ?', email);

        if (existingUser) {
            return res.status(400).json({ success: false, error: 'Email already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const result = await db.run(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );


        const newUser = await db.get('SELECT id, name, email FROM users WHERE id = ?', result.lastID);

        // Seed Default Categories
        const defaultCats = [
            { name: 'Food', color: '#f87171' },
            { name: 'Groceries', color: '#fbbf24' },
            { name: 'Transport', color: '#60a5fa' },
            { name: 'Shopping', color: '#f472b6' },
            { name: 'Rent', color: '#818cf8' },
            { name: 'Bills', color: '#fb923c' },
            { name: 'Entertainment', color: '#a78bfa' },
            { name: 'Health', color: '#34d399' },
            { name: 'Travel', color: '#2dd4bf' }
        ];
        for (const cat of defaultCats) {
            await db.run(
                'INSERT INTO categories (user_id, name, color) VALUES (?, ?, ?)',
                [newUser.id, cat.name, cat.color]
            );
        }

        // Seed Default Payment Methods
        const defaultMethods = ['Cash', 'UPI', 'Debit Card', 'Credit Card'];
        for (const methodName of defaultMethods) {
            // Set 'Cash' as default (is_default = 1), others 0
            const isDefault = methodName === 'Cash' ? 1 : 0;
            await db.run(
                'INSERT INTO payment_methods (user_id, name, is_default) VALUES (?, ?, ?)',
                [newUser.id, methodName, isDefault]
            );
        }

        // Seed Default Income Categories
        const defaultIncomeCats = ['Salary', 'Bonus', 'Gift', 'Savings'];
        for (const catName of defaultIncomeCats) {
            await db.run(
                'INSERT INTO income_categories (user_id, name) VALUES (?, ?)',
                [newUser.id, catName]
            );
        }

        // Generate Config
        const token = jwt.sign({ id: newUser.id }, JWT_SECRET, {
            expiresIn: '30d'
        });

        res.status(201).json({ success: true, token, user: newUser });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    try {
        const db = getDB();
        const user = await db.get('SELECT * FROM users WHERE email = ?', email);

        if (!user) {
            return res.status(400).json({ success: false, error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        // Check and seed categories if missing
        const catCount = await db.get('SELECT COUNT(*) as count FROM categories WHERE user_id = ?', user.id);
        if (catCount.count === 0) {
            const defaultCats = [
                { name: 'Food', color: '#f87171' },
                { name: 'Groceries', color: '#fbbf24' },
                { name: 'Transport', color: '#60a5fa' },
                { name: 'Shopping', color: '#f472b6' },
                { name: 'Rent', color: '#818cf8' },
                { name: 'Bills', color: '#fb923c' },
                { name: 'Entertainment', color: '#a78bfa' },
                { name: 'Health', color: '#34d399' },
                { name: 'Travel', color: '#2dd4bf' }
            ];
            for (const cat of defaultCats) {
                await db.run(
                    'INSERT INTO categories (user_id, name, color) VALUES (?, ?, ?)',
                    [user.id, cat.name, cat.color]
                );
            }
        }

        // Check and seed payment methods if missing (Backward compatibility)
        const methodCount = await db.get('SELECT COUNT(*) as count FROM payment_methods WHERE user_id = ?', user.id);
        if (methodCount.count === 0) {
            const defaultMethods = ['Cash', 'UPI', 'Debit Card', 'Credit Card'];
            for (const methodName of defaultMethods) {
                const isDefault = methodName === 'Cash' ? 1 : 0;
                await db.run(
                    'INSERT INTO payment_methods (user_id, name, is_default) VALUES (?, ?, ?)',
                    [user.id, methodName, isDefault]
                );
            }
        }

        // Check and seed income categories if missing
        const incomeCatCount = await db.get('SELECT COUNT(*) as count FROM income_categories WHERE user_id = ?', user.id);
        if (incomeCatCount.count === 0) {
            const defaultIncomeCats = ['Salary', 'Bonus', 'Gift', 'Savings'];
            for (const catName of defaultIncomeCats) {
                await db.run(
                    'INSERT INTO income_categories (user_id, name) VALUES (?, ?)',
                    [user.id, catName]
                );
            }
        }

        const token = jwt.sign({ id: user.id }, JWT_SECRET, {
            expiresIn: '30d'
        });

        // Don't send password back
        delete user.password;

        res.json({ success: true, token, user });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const getMe = async (req, res) => {
    try {
        const db = getDB();
        const user = await db.get('SELECT id, name, email FROM users WHERE id = ?', req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = { register, login, getMe };
