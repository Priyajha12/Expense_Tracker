# MVP Expense Tracker Implementation Plan

## 1. Project Folder Structure

We will use a structure that separates the frontend and backend clearly, allowing for independent development and scaling.

```text
MVP_Expense/
├── client/                     # Frontend: React + Tailwind
│   ├── public/
│   ├── src/
│   │   ├── components/         # Reusable UI components (Buttons, Inputs, Cards)
│   │   ├── contexts/           # React Context for Auth and potentially Theme
│   │   ├── hooks/              # Custom hooks (useAuth, useFetch)
│   │   ├── layouts/            # Page layouts (DashboardLayout, AuthLayout)
│   │   ├── pages/              # Main view pages (Login, Dashboard, Expenses)
│   │   ├── services/           # API service calls (axios/fetch wrappers)
│   │   ├── utils/              # Helper functions (date formatting, validation)
│   │   ├── App.jsx             # Main App component with Routing
│   │   ├── main.jsx            # Entry point
│   │   └── index.css           # Tailwind directives and global styles
│   ├── .env                    # Environment variables
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                     # Backend: Node.js + Express + SQLite
│   ├── src/
│   │   ├── config/             # Configuration (database connection, JWT secrets)
│   │   ├── controllers/        # Request logic (getExpenses, loginUser)
│   │   ├── middleware/         # Auth verification, error handling
│   │   ├── models/             # Database models/schema definitions
│   │   ├── routes/             # API route definitions
│   │   ├── utils/              # Helper functions (password hashing)
│   │   └── index.js            # Server entry point
│   ├── .env                    # Secrets and configs
│   ├── database.sqlite         # SQLite database file
│   └── package.json
│
└── README.md
```

## 2. Database Schema (SQLite)

We will use a relational mapping. Since SQLite doesn't enforce standard SQL types deeply, we'll manage schemas typically via a library like `sequelize` or `knex` or raw SQL initialization.

### Users Table
Stores user credentials.
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `username`: TEXT UNIQUE NOT NULL
- `email`: TEXT UNIQUE NOT NULL
- `password_hash`: TEXT NOT NULL
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

### Categories Table
User-defined categories for grouping expenses.
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `user_id`: INTEGER NOT NULL (Foreign Key -> Users.id)
- `name`: TEXT NOT NULL
- `type`: TEXT CHECK( type IN ('income', 'expense') ) DEFAULT 'expense' -- *Optional extensibility*
- `color`: TEXT -- Hex code for UI representation
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

### Expenses Table
Individual transaction records.
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `user_id`: INTEGER NOT NULL (Foreign Key -> Users.id)
- `category_id`: INTEGER (Foreign Key -> Categories.id) -- *Nullable if category deleted, or handle via cascade*
- `amount`: REAL NOT NULL
- `date`: DATE NOT NULL
- `description`: TEXT
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

## 3. API Design

All endpoints should be prefixed with `/api`.
 Responses should follow a standard JSON format: `{ "success": true, "data": ... }` or `{ "success": false, "error": "message" }`.

### Authentication
- `POST /api/auth/register`: Create a new user.
  - Body: `{ username, email, password }`
- `POST /api/auth/login`: Authenticate and receive JWT.
  - Body: `{ email, password }`
  - Response: `{ token, user: { id, username, email } }`

### Categories
*Protected Routes (Require Valid JWT)*
- `GET /api/categories`: Fetch all categories for the logged-in user.
- `POST /api/categories`: Create a new category.
  - Body: `{ name, type, color }`
- `PUT /api/categories/:id`: Update a category.
- `DELETE /api/categories/:id`: Delete a category. Use checks to handle orphaned expenses (e.g., move to "Uncategorized" or block deletion).

### Expenses
*Protected Routes (Require Valid JWT)*
- `GET /api/expenses`: Get expenses list.
  - Query params: `?month=MM&year=YYYY` or `?startDate=...&endDate=...`
- `POST /api/expenses`: Add a new expense.
  - Body: `{ category_id, amount, date, description }`
- `PUT /api/expenses/:id`: Edit an expense.
- `DELETE /api/expenses/:id`: Remove an expense.

### Dashboard / Summary
*Protected Routes (Require Valid JWT)*
- `GET /api/dashboard/summary`: Get aggregated data for charts.
  - Query params: `?month=MM&year=YYYY`
  - Response:
    ```json
    {
      "total_expense": 1250.00,
      "by_category": [
        { "category_name": "Food", "total": 450.00, "color": "#FF5733" },
        { "category_name": "Rent", "total": 800.00, "color": "#33FF57" }
      ],
      "recent_transactions": [ ... ]
    }
    ```
