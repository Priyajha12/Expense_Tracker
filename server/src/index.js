require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const authRoutes = require('./routes/auth');
const categoryRoutes = require('./routes/categories');

const expenseRoutes = require('./routes/expenses');
const dashboardRoutes = require('./routes/dashboard');
const paymentMethodRoutes = require('./routes/paymentMethods');
const incomeRoutes = require('./routes/incomes');

const app = express();
const PORT = process.env.PORT || 5001;

// Logging Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.use(cors());
app.use(express.json());

// Routes
console.log('Registering Routes...');
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use('/api/incomes', incomeRoutes);

// Test Routes
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.get('/', (req, res) => {
    res.send('MVP Expense Tracker API is running on ' + PORT);
});

// 404 Handler
app.use((req, res) => {
    console.log('404 Hit: ' + req.url);
    res.status(404).json({ error: 'Route not found' });
});

async function startServer() {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

startServer();
