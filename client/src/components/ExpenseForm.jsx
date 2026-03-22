import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fetchCategories } from '../services/categoryService';
import { fetchPaymentMethods } from '../services/paymentMethodService';
import { Plus, Trash2 } from 'lucide-react';

const ExpenseForm = ({ initialData, prefilledCategoryId, onSubmit, onCancel }) => {
    const [categories, setCategories] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([]);

    const [items, setItems] = useState([
        {
            id: Date.now(),
            category_id: '',
            payment_method_id: '',
            amount: '',
            note: '',
            date: format(new Date(), 'yyyy-MM-dd')
        }
    ]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [catRes, pmRes] = await Promise.all([
                    fetchCategories(),
                    fetchPaymentMethods()
                ]);

                if (catRes.success) {
                    setCategories(catRes.data);
                }

                if (pmRes.success) {
                    setPaymentMethods(pmRes.data);
                    const defaultPm = pmRes.data.find(pm => pm.is_default);

                    if (!initialData) {
                        const preselectedCatId = prefilledCategoryId || (catRes.data.length > 0 ? catRes.data[0].id : '');
                        const selectedCat = catRes.data.find(c => c.id === Number(preselectedCatId));

                        setItems(prev => prev.map(item => ({
                            ...item,
                            category_id: preselectedCatId,
                            payment_method_id: defaultPm ? defaultPm.id : (pmRes.data.length > 0 ? pmRes.data[0].id : ''),
                            amount: (selectedCat && selectedCat.is_fixed) ? selectedCat.fixed_amount : ''
                        })));
                    }
                }
            } catch (err) {
                console.error("Failed to load form data", err);
            }
        };
        loadData();
    }, [initialData]);

    useEffect(() => {
        if (initialData) {
            setItems([{
                id: initialData.id,
                category_id: initialData.category_id,
                payment_method_id: initialData.payment_method_id || '',
                amount: initialData.amount,
                note: initialData.note || '',
                date: initialData.date
            }]);
        }
    }, [initialData]);

    const handleAddItem = () => {
        const defaultPm = paymentMethods.find(pm => pm.is_default);
        const preselectedCatId = prefilledCategoryId || (categories.length > 0 ? categories[0].id : '');
        const selectedCat = categories.find(c => c.id === Number(preselectedCatId));

        setItems([...items, {
            id: Date.now(),
            category_id: preselectedCatId,
            payment_method_id: defaultPm ? defaultPm.id : (paymentMethods.length > 0 ? paymentMethods[0].id : ''),
            amount: (selectedCat && selectedCat.is_fixed) ? selectedCat.fixed_amount : '',
            note: '',
            date: format(new Date(), 'yyyy-MM-dd')
        }]);
    };

    const handleRemoveItem = (id) => {
        if (items.length > 1) {
            setItems(items.filter(item => item.id !== id));
        }
    };

    const handleItemChange = (id, field, value) => {
        setItems(items.map(item => {
            if (item.id === id) {
                const updatedItem = { ...item, [field]: value };

                if (field === 'category_id') {
                    const selectedCat = categories.find(c => c.id === Number(value));
                    if (selectedCat && selectedCat.is_fixed && selectedCat.fixed_amount) {
                        updatedItem.amount = selectedCat.fixed_amount;
                    }
                }

                return updatedItem;
            }
            return item;
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (initialData) {
            onSubmit(items[0]);
        } else {
            const validItems = items.filter(item => item.amount !== '');
            if (validItems.length === 0) return;

            onSubmit({
                isBulk: true,
                expenses: validItems
            });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {items.map((item, index) => (
                    <div key={item.id} className="relative group bg-white p-4 md:p-5 rounded-2xl border border-slate-100 hover:border-amber-200 transition-all hover:shadow-lg hover:shadow-amber-500/5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end mb-4">
                            {/* Category */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest pl-1">Category</label>
                                <select
                                    value={item.category_id}
                                    onChange={(e) => handleItemChange(item.id, 'category_id', Number(e.target.value))}
                                    className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-bold text-slate-700 h-[42px] appearance-none"
                                    required
                                >
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Amount */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest pl-1">Amount</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-2.5 text-slate-400 font-black">₹</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={item.amount}
                                        onChange={(e) => handleItemChange(item.id, 'amount', e.target.value)}
                                        className="w-full pl-8 pr-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-black text-slate-900 h-[42px]"
                                        placeholder="0"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Date */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest pl-1">Date</label>
                                <input
                                    type="date"
                                    value={item.date}
                                    onChange={(e) => handleItemChange(item.id, 'date', e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-bold text-slate-700 h-[42px]"
                                    required
                                />
                            </div>

                            {/* Payment Method */}
                            <div className="flex items-end gap-2">
                                <div className="flex-1">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest pl-1">Payment</label>
                                    <select
                                        value={item.payment_method_id}
                                        onChange={(e) => handleItemChange(item.id, 'payment_method_id', Number(e.target.value))}
                                        className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-bold text-slate-700 h-[42px] appearance-none"
                                        required
                                    >
                                        {paymentMethods.map(pm => (
                                            <option key={pm.id} value={pm.id}>{pm.name}</option>
                                        ))}
                                    </select>
                                </div>
                                {!initialData && items.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveItem(item.id)}
                                        className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all h-[42px]"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Note - Moving below and making it full width */}
                        <div className="w-full">
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest pl-1">Note / Description (Optional)</label>
                            <input
                                type="text"
                                value={item.note}
                                onChange={(e) => handleItemChange(item.id, 'note', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-bold text-slate-700"
                                placeholder="What was this for? (e.g. Starbucks with friends, Monthly Electricity...)"
                            />
                        </div>
                    </div>
                ))}
            </div>

            {!initialData && (
                <button
                    type="button"
                    onClick={handleAddItem}
                    className="w-full py-3 border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 hover:text-amber-500 hover:border-amber-100 hover:bg-amber-50/30 transition-all flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest"
                >
                    <Plus size={16} strokeWidth={3} />
                    Add Another Item
                </button>
            )}

            <div className="flex gap-4 justify-end pt-6 border-t border-slate-50">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-2 text-slate-400 hover:text-slate-600 font-black uppercase text-xs tracking-widest transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-10 py-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all font-black uppercase text-xs tracking-widest shadow-xl shadow-slate-900/10 active:scale-95"
                >
                    {initialData ? 'Update Expense' : `Save ${items.length} ${items.length === 1 ? 'Expense' : 'Expenses'}`}
                </button>
            </div>
        </form>
    );
};

export default ExpenseForm;
