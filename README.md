# 🌸 FinLady: Your Intelligently Simple Expense Tracker

FinLady is a modern, high-performance web application designed to help you master your personal finances. It goes beyond simple tracking by providing deep insights into your spending habits, separating your lifestyle choices from your fixed commitments, and helping you visualize your financial health in real-time.

---

## ✨ Key Features & Why You'll Love Them

### 1. 📊 Advanced Monthly Summary (Dashboard)
Your financial command center. See a high-level overview of your month including Total Expenses, Savings, Average Daily Spend, and Transaction Volume.
*   **The Benefit:** Instant clarity. No more wondering "Where did my money go?" at the end of the month.

### 2. 📉 Dynamic Spending Trend Analysis
Interactive bar charts that show your daily spending pace.
*   **The Feature:** A "Fixed vs. Variable" toggle to filter out recurring bills (Rent, EMI, Utilities).
*   **The Benefit:** Identify spikes in **discretionary** spending. By hiding fixed costs, you can see exactly when you overspent on shopping or dining out, allowing for immediate behavioral adjustments.

### 3. 🍕 Intelligent Category Split
A beautiful pie chart breakdown of your spending by category, showing both the exact amount and the percentage of your total budget.
*   **The Benefit:** Contextual awareness. Knowing you spent ₹5,000 is one thing; knowing it represents 45% of your total income is a wake-up call.

### 4. ⚡ Ultra-Fast Bulk Expense Entry
A streamlined modal interface designed for high-speed logging. Add multiple expenses at once with smart defaults for payment methods and categories.
*   **The Feature:** Per-item dates and optional notes.
*   **The Benefit:** Frictionless logging. Most trackers fail because logging is a chore. FinLady makes it fast so you actually stick to the habit.

### 5. 🔥 Top 3 Burners
Automatically identifies the three categories eating up most of your budget.
*   **The Feature:** Toggle to include or exclude fixed expenses.
*   **The Benefit:** Strategic focus. If your "Fixed" expenses are the top burners, you need to look at downsizing commitments. If "Variable" are the burners, you need to look at lifestyle discipline.

### 6. 💳 Credit Wall & Payment Tracking
Track not just *what* you spent, but *how* you paid. Manage credit limits and due dates (Credit Wall) for your cards.
*   **The Benefit:** Never miss a payment and keep your credit utilization in check.

---

## 🛠 Tech Stack

**Frontend:**
*   **React 19** for a fast, component-based UI.
*   **Vite** for lightning-fast development and builds.
*   **Tailwind CSS** for a premium, responsive design.
*   **Recharts** for interactive, data-driven visualizations.
*   **Lucide React** for clean, modern iconography.

**Backend:**
*   **Node.js & Express** for a robust RESTful API.
*   **SQLite** for a lightweight, portable, and reliable database.
*   **JWT (JSON Web Tokens)** for secure, session-less authentication.
*   **Date-fns** for advanced date manipulation and formatting.

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (v16 or higher)
*   npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/MVP_Expense.git
   cd MVP_Expense
   ```

2. **Setup Backend:**
   ```bash
   cd server
   npm install
   # Create a .env file based on .env.example
   npm run dev
   ```

3. **Setup Frontend:**
   ```bash
   cd client
   npm install
   npm run dev
   ```

4. **Access the App:**
   Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📂 Project Structure

```text
├── client/              # React Vite Application
│   ├── src/
│   │   ├── components/  # Reusable UI (Modal, Sidebar, ExpenseForm)
│   │   ├── pages/       # Dashboard, Expenses, Auth
│   │   ├── services/    # API communication logic
│   │   └── contexts/    # Global state (AuthContext)
├── server/              # Node.js Express API
│   ├── src/
│   │   ├── controllers/ # Business logic
│   │   ├── routes/      # API Endpoints
│   │   ├── config/      # DB Connection
│   │   └── utils/       # Helpers
└── schema.sql           # Database schema definition
```

---

## 🛡️ Privacy & Security
FinLady is built with privacy in mind. Your data is stored locally in an SQLite database, giving you full control over your financial records. Authentication is handled via secure JWT tokens stored in your browser's local storage.

---

Designed with ❤️ for better financial futures.
