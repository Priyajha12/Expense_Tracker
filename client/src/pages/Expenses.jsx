import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Calendar, FileText, TrendingDown, Layers, ChevronDown, ChevronUp, CreditCard } from 'lucide-react';
import { fetchExpenses, createExpense, createBulkExpenses, updateExpense, deleteExpense } from '../services/expenseService';
import { fetchCategories, createCategory, updateCategory } from '../services/categoryService';
import ExpenseForm from '../components/ExpenseForm';
import CategoryForm from '../components/CategoryForm';
import Modal from '../components/Modal';
import { format, parseISO } from 'date-fns';

const Expenses = () => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const [expenses, setExpenses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [month, setMonth] = useState(currentMonth);
    const [year, setYear] = useState(currentYear);
    const [loading, setLoading] = useState(true);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [editingCategory, setEditingCategory] = useState(null);
    const [prefilledCategoryId, setPrefilledCategoryId] = useState(null);
    const [error, setError] = useState(null);

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const years = [2024, 2025, 2026];

    const loadData = async () => {
        try {
            setLoading(true);
            const [expenseRes, catRes] = await Promise.all([
                fetchExpenses({ month, year }),
                fetchCategories()
            ]);

            if (expenseRes.success) setExpenses(expenseRes.data);
            if (catRes.success) setCategories(catRes.data);
        } catch (err) {
            console.error('Failed to load data', err);
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [month, year]);

    const handleCategoryClick = (categoryId) => {
        setEditingExpense(null);
        setPrefilledCategoryId(categoryId);
        setIsExpenseModalOpen(true);
    };

    const handleCategoryEditClick = (category) => {
        setEditingCategory(category);
        setIsCategoryModalOpen(true);
    };

    const handleEditClick = (expense) => {
        setEditingExpense(expense);
        setPrefilledCategoryId(null);
        setIsExpenseModalOpen(true);
    };

    const handleExpenseSubmit = async (formData) => {
        try {
            if (editingExpense) {
                await updateExpense(editingExpense.id, formData);
            } else if (formData.isBulk) {
                await createBulkExpenses(formData);
            } else {
                await createExpense(formData);
            }
            setIsExpenseModalOpen(false);
            loadData();
        } catch (err) {
            console.error('Operation failed', err);
            alert('Failed to save expense');
        }
    };

    const handleCategorySubmit = async (formData) => {
        try {
            let res;
            if (editingCategory) {
                res = await updateCategory(editingCategory.id, formData);
            } else {
                res = await createCategory(formData);
            }

            if (res.success) {
                setIsCategoryModalOpen(false);
                setEditingCategory(null);
                loadData();
            }
        } catch (err) {
            console.error('Category operation failed', err);
            alert('Failed to save category');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this expense?')) {
            try {
                await deleteExpense(id);
                loadData();
            } catch (err) {
                console.error('Delete failed', err);
                alert('Failed to delete expense');
            }
        }
    };

    const [expandedCategories, setExpandedCategories] = useState({});

    const toggleCategory = (catName) => {
        setExpandedCategories(prev => ({
            ...prev,
            [catName]: !prev[catName]
        }));
    };

    // Prepare data: Ensure ALL categories are present even if 0 expenses
    const getCategorizedData = () => {
        const catMap = {};

        // Initialize with all available categories
        categories.forEach(cat => {
            catMap[cat.name] = {
                id: cat.id,
                name: cat.name,
                color: cat.color || '#9ca3af',
                description: cat.description,
                total: 0,
                budget: cat.budget || 0,
                transactions: []
            };
        });

        // Add expenses to their categories
        expenses.forEach(expense => {
            const catName = expense.category_name || 'Uncategorized';
            if (catMap[catName]) {
                catMap[catName].total += expense.amount;
                catMap[catName].transactions.push(expense);
            }
        });

        // Sort by total spent descending
        return Object.values(catMap).sort((a, b) => b.total - a.total);
    };

    const sortedCategoriesList = getCategorizedData();

    return (
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-12 gap-6">
                <div className="text-center sm:text-left">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-2">Expenses</h1>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">Detailed spending breakdown</p>
                </div>

                <div className="flex items-center gap-2 bg-white p-2 rounded-[2rem] border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-1.5 px-3">
                        <select
                            value={month}
                            onChange={(e) => setMonth(Number(e.target.value))}
                            className="bg-transparent font-black text-slate-700 outline-none cursor-pointer text-sm"
                        >
                            {months.map((m, i) => (
                                <option key={m} value={i + 1}>{m}</option>
                            ))}
                        </select>
                        <select
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
                            className="bg-transparent font-black text-slate-700 outline-none cursor-pointer text-sm"
                        >
                            {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>

                    <div className="w-px h-8 bg-slate-100 mx-1 hidden sm:block"></div>

                    <button
                        onClick={() => setIsExpenseModalOpen(true)}
                        className="px-4 md:px-6 py-3 bg-slate-900 text-white rounded-[1.5rem] hover:bg-slate-800 transition-all font-black text-[10px] md:text-xs uppercase tracking-widest shadow-lg shadow-slate-900/20 flex items-center gap-2 group whitespace-nowrap"
                    >
                        <Plus size={16} strokeWidth={3} className="group-hover:rotate-90 transition-transform hidden md:block" />
                        Record Expense
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-amber-500 shadow-xl"></div>
                </div>
            ) : error ? (
                <div className="text-center p-12 bg-red-50 rounded-3xl border-2 border-red-100 text-red-600 font-bold">
                    {error}
                </div>
            ) : sortedCategoriesList.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                    <div className="mx-auto w-24 h-24 bg-amber-50 text-amber-500 rounded-[2rem] flex items-center justify-center mb-6 border-4 border-white shadow-lg">
                        <TrendingDown size={40} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900">No data available</h3>
                    <p className="text-slate-400 font-bold mt-2">Initialize by adding categories above</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2 mb-2">
                        <div className="flex items-center gap-3">
                            <Layers size={20} className="text-amber-500" />
                            <span className="text-sm font-black text-slate-800 uppercase tracking-widest">Spending Categories</span>
                        </div>
                        <span className="text-[10px] font-black text-slate-400 bg-slate-50 border border-slate-100 px-3 py-1 rounded-full uppercase">
                            Total: ₹{expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                        </span>
                    </div>

                    <div className="space-y-4">
                        {sortedCategoriesList.map((cat) => {
                            const isExpanded = expandedCategories[cat.name];
                            const hasBudget = cat.budget > 0;
                            const percent = hasBudget ? Math.min(100, (cat.total / cat.budget) * 100) : 0;

                            return (
                                <div key={cat.name} className={`bg-white rounded-[2rem] border transition-all duration-300 ${isExpanded ? 'border-amber-200 shadow-2xl shadow-amber-500/5 scale-[1.01]' : 'border-slate-100 shadow-sm hover:translate-x-1'}`}>
                                    {/* Parent Row */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-5 cursor-pointer gap-4" onClick={() => toggleCategory(cat.name)}>
                                        <div className="flex items-center gap-3 md:gap-5 flex-1 select-none">
                                            <div
                                                className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center text-white font-black text-base md:text-lg shadow-lg flex-shrink-0"
                                                style={{ backgroundColor: cat.color }}
                                            >
                                                {cat.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col mb-1">
                                                    <div className="flex flex-col mb-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="font-black text-slate-800 text-base md:text-lg tracking-tight truncate">{cat.name}</h3>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    // Find the actual category object from the list to get all details
                                                                    const fullCat = categories.find(c => c.id === cat.id);
                                                                    handleCategoryEditClick(fullCat);
                                                                }}
                                                                className="p-1 text-slate-300 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                                                                title="Edit Category Settings"
                                                            >
                                                                <Edit2 size={12} />
                                                            </button>
                                                        </div>
                                                        {cat.description && (
                                                            <p className="text-[10px] md:text-xs text-slate-400 font-bold leading-tight italic truncate max-w-sm">
                                                                {cat.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                    {hasBudget && (
                                                        <div className="flex items-center gap-2 w-full max-w-[120px]">
                                                            <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full transition-all duration-1000 ${percent > 90 ? 'bg-red-500' : percent > 70 ? 'bg-orange-500' : 'bg-amber-500'}`}
                                                                    style={{ width: `${percent}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="text-[8px] md:text-[9px] font-black text-slate-400">{percent.toFixed(0)}%</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                                        {cat.transactions.length} Transactions
                                                    </span>
                                                    {hasBudget && (
                                                        <>
                                                            <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                                                            <span className="text-[10px] font-black text-amber-500 uppercase tracking-tighter">
                                                                {cat.total > cat.budget ? 'Over Budget' : `₹${(cat.budget - cat.total).toLocaleString()} left`}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between sm:justify-end gap-3 md:gap-5">
                                            <div className="text-left sm:text-right">
                                                <span className="font-black text-slate-900 text-lg md:text-xl block leading-none">₹{cat.total.toLocaleString()}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleCategoryClick(cat.id);
                                                    }}
                                                    className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center bg-amber-50 text-amber-600 rounded-xl md:rounded-2xl hover:bg-amber-100 transition-all shadow-sm border border-amber-100"
                                                >
                                                    <Plus size={18} strokeWidth={3} className="md:w-5 md:h-5" />
                                                </button>
                                                <div className={`text-slate-300 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                                    <ChevronDown size={20} className="md:w-6 md:h-6" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expandable Section */}
                                    {isExpanded && (
                                        <div className="border-t border-slate-50 px-6 pb-6 pt-2 animate-in slide-in-from-top-4 duration-300">
                                            {cat.transactions.length > 0 ? (
                                                <div className="space-y-2">
                                                    {cat.transactions.sort((a, b) => new Date(b.date) - new Date(a.date)).map((t) => (
                                                        <div key={t.id} className="group flex flex-col sm:flex-row sm:items-center justify-between py-3 px-4 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 gap-3">
                                                            <div className="flex items-center gap-4 md:gap-5 flex-1 min-w-0">
                                                                <div className="w-10 md:w-14 flex-shrink-0">
                                                                    <div className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase leading-none mb-1">
                                                                        {format(parseISO(t.date), 'MMM')}
                                                                    </div>
                                                                    <div className="text-base md:text-lg font-black text-slate-900 leading-none">
                                                                        {format(parseISO(t.date), 'dd')}
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-col min-w-0">
                                                                    <div className="flex flex-wrap items-center gap-2 md:gap-3">
                                                                        <span className="text-sm md:text-lg font-black text-slate-900 flex-shrink-0">₹{t.amount.toLocaleString()}</span>
                                                                        {t.payment_method_name && (
                                                                            <span className="text-[9px] font-black text-slate-500 uppercase bg-slate-100/80 px-2 py-0.5 rounded-lg border border-slate-200/50 flex items-center gap-1">
                                                                                <CreditCard size={10} className="text-slate-400" />
                                                                                {t.payment_method_name}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    {t.note ? (
                                                                        <div className="flex items-start gap-1.5 mt-1">
                                                                            <FileText size={12} className="text-slate-300 mt-0.5" />
                                                                            <p className="text-[10px] md:text-xs text-slate-500 font-bold leading-relaxed max-w-md">
                                                                                {t.note}
                                                                            </p>
                                                                        </div>
                                                                    ) : (
                                                                        <p className="text-[10px] text-slate-300 italic font-bold mt-1">No note provided</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center justify-end gap-2 sm:opacity-0 group-hover:opacity-100 transition-all sm:translate-x-4 group-hover:translate-x-0 border-t sm:border-t-0 border-slate-50 pt-2 sm:pt-0">
                                                                <button
                                                                    onClick={() => handleEditClick(t)}
                                                                    className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-md rounded-xl transition-all border border-transparent hover:border-blue-100"
                                                                >
                                                                    <Edit2 size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(t.id)}
                                                                    className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-white hover:shadow-md rounded-xl transition-all border border-transparent hover:border-red-100"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="py-8 text-center bg-slate-50/50 rounded-[1.5rem] border border-dashed border-slate-200">
                                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No transactions this month</p>
                                                    <button
                                                        onClick={() => handleCategoryClick(cat.id)}
                                                        className="mt-3 text-[10px] font-black text-amber-500 hover:text-amber-600 uppercase"
                                                    >
                                                        + Record First Expense
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Add Category Button Card */}
                        <button
                            onClick={() => setIsCategoryModalOpen(true)}
                            className="w-full py-8 md:py-10 border-2 border-dashed border-slate-100 rounded-[2rem] text-slate-400 hover:text-amber-500 hover:border-amber-200 hover:bg-amber-50/30 transition-all flex flex-col items-center justify-center gap-3 group"
                        >
                            <div className="w-12 h-12 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300 group-hover:border-amber-200 group-hover:text-amber-500 transition-all">
                                <Plus size={24} strokeWidth={3} />
                            </div>
                            <span className="font-black text-[10px] md:text-xs uppercase tracking-widest">Add New Category</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Expense Form Modal */}
            <Modal
                isOpen={isExpenseModalOpen}
                onClose={() => setIsExpenseModalOpen(false)}
                title={editingExpense ? 'Edit Expense' : 'New Expense'}
                maxWidth="max-w-3xl"
            >
                <ExpenseForm
                    initialData={editingExpense}
                    prefilledCategoryId={prefilledCategoryId}
                    onSubmit={handleExpenseSubmit}
                    onCancel={() => setIsExpenseModalOpen(false)}
                />
            </Modal>

            {/* Category Form Modal */}
            <Modal
                isOpen={isCategoryModalOpen}
                onClose={() => {
                    setIsCategoryModalOpen(false);
                    setEditingCategory(null);
                }}
                title={editingCategory ? 'Edit Category Settings' : 'Add New Category'}
                maxWidth="max-w-lg"
            >
                <CategoryForm
                    initialData={editingCategory}
                    onSubmit={handleCategorySubmit}
                    onCancel={() => {
                        setIsCategoryModalOpen(false);
                        setEditingCategory(null);
                    }}
                />
            </Modal>
        </div>
    );
};

export default Expenses;
