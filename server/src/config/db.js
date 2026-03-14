const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');

let db;

async function connectDB() {
    if (db) return db;

    const dbPath = process.env.DB_PATH || path.join(__dirname, '../../expense_tracker.sqlite');

    try {
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });

        console.log(`Connected to SQLite database at ${dbPath}`);

        // Initialize schema
        const schemaPath = path.join(__dirname, '../../schema.sql');
        if (fs.existsSync(schemaPath)) {
            const schema = fs.readFileSync(schemaPath, 'utf8');
            await db.exec(schema);
            console.log('Database schema initialized.');
        } else {
            console.warn('schema.sql not found, skipping schema initialization.');
        }

        // Migration: Check if payment_method_id exists in expenses
        try {
            await db.run('ALTER TABLE expenses ADD COLUMN payment_method_id INTEGER REFERENCES payment_methods(id)');
            console.log('Migration: Added payment_method_id to expenses table');
        } catch (err) {
            // Ignore error if column already exists
            if (!err.message.includes('duplicate column')) {
                // console.log('Column payment_method_id likely exists');
            }
        }

        // Migration: Add is_fixed, fixed_amount, and deducted_date to categories
        try {
            await db.run('ALTER TABLE categories ADD COLUMN is_fixed BOOLEAN DEFAULT 0');
            await db.run('ALTER TABLE categories ADD COLUMN fixed_amount REAL DEFAULT 0');
            await db.run('ALTER TABLE categories ADD COLUMN deducted_date DATE');
            console.log('Migration: Added fixed expense columns to categories');
        } catch (err) {
            // Check for individual columns if partial migration happened
            try { await db.run('ALTER TABLE categories ADD COLUMN deducted_date DATE'); } catch (e) { }
        }

        // Migration: Add budget to categories
        try {
            await db.run('ALTER TABLE categories ADD COLUMN budget REAL DEFAULT 0');
            console.log('Migration: Added budget column to categories');
        } catch (err) { }

        // Migration: Add credit_limit and due_date to payment_methods
        try {
            await db.run('ALTER TABLE payment_methods ADD COLUMN credit_limit REAL DEFAULT 0');
            await db.run('ALTER TABLE payment_methods ADD COLUMN due_date INTEGER');
            console.log('Migration: Added credit limit and due date to payment_methods');
        } catch (err) { }

        // Migration: Create category_budgets table
        try {
            await db.run(`
                CREATE TABLE IF NOT EXISTS category_budgets (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    category_id INTEGER NOT NULL,
                    month INTEGER NOT NULL,
                    year INTEGER NOT NULL,
                    amount REAL NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
                    UNIQUE(user_id, category_id, month, year)
                )
            `);
            console.log('Migration: Created category_budgets table');
        } catch (err) { }

        return db;
    } catch (error) {
        console.error('Error connecting to database:', error);
        process.exit(1);
    }
}

function getDB() {
    if (!db) {
        throw new Error('Database not initialized. Call connectDB first.');
    }
    return db;
}

module.exports = { connectDB, getDB };
