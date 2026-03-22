import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';

import Expenses from './pages/Expenses';
import Login from './pages/Login';
import Register from './pages/Register';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Plus } from 'lucide-react';
import Modal from './components/Modal';
import ExpenseForm from './components/ExpenseForm';
import { createBulkExpenses, createExpense } from './services/expenseService';

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const handleQuickAdd = async (formData) => {
    try {
      if (formData.isBulk) {
        await createBulkExpenses(formData);
      } else {
        await createExpense(formData);
      }
      setIsQuickAddOpen(false);
      // Reload current page data if possible, but simpler: window.location.reload() or let the page handle its own data.
      // Better: Since the modal is global, we might need a way to refresh children.
      // For now, let's keep it simple and just close. 
      // If the user is on the dashboard/expenses, they'll see the change on next navigation.
      // Or just reload the page for a quick MVP fix.
      window.location.reload();
    } catch (err) {
      alert('Failed to save expense');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans text-gray-900 pb-24 md:pb-0">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header - More minimal now with bottom nav */}
        <header className="md:hidden bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between sticky top-0 z-30 shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-lg flex items-center justify-center text-white font-black text-sm border-2 border-white/20">
              FL
            </div>
            <span className="text-xl font-bold tracking-tight text-white uppercase italic">Fin<span className="text-yellow-400">Lady</span></span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-slate-400 hover:bg-slate-800 rounded-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto w-full relative">
          {children}
        </main>

        <BottomNav />

        {/* FAB for Mobile */}
        <button
          onClick={() => setIsQuickAddOpen(true)}
          className="md:hidden fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-full shadow-2xl shadow-amber-600/40 flex items-center justify-center z-50 hover:scale-110 active:scale-95 transition-all outline-none border-4 border-white"
        >
          <Plus size={28} strokeWidth={4} />
        </button>

        {/* Global Quick Add Modal */}
        <Modal
          isOpen={isQuickAddOpen}
          onClose={() => setIsQuickAddOpen(false)}
          title="Quick Add Expense"
          maxWidth="max-w-xl"
        >
          <ExpenseForm
            onSubmit={handleQuickAdd}
            onCancel={() => setIsQuickAddOpen(false)}
          />
        </Modal>
      </div>
    </div>
  );
};

const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  if (user) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          {/* Private Routes */}
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />


          <Route path="/expenses" element={
            <PrivateRoute>
              <Expenses />
            </PrivateRoute>
          } />

          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
