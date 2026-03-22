import React, { useState, useEffect } from 'react';

const COLORS = [
    '#dc2626', '#d97706', '#65a30d', '#059669',
    '#0891b2', '#2563eb', '#7c3aed', '#db2777',
    '#475569', '#000000'
];

const CategoryForm = ({ initialData, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        name: '',
        color: COLORS[0],
        is_fixed: false,
        fixed_amount: '',
        budget: '',
        deducted_date: '',
        description: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                color: initialData.color || COLORS[0],
                is_fixed: initialData.is_fixed === 1,
                fixed_amount: initialData.fixed_amount || '',
                budget: initialData.budget || '',
                deducted_date: initialData.deducted_date || '',
                description: initialData.description || ''
            });
        }
    }, [initialData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                        Category Name
                    </label>
                </div>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-bold"
                    placeholder="e.g., Groceries"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                </label>
                <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="e.g. Home essentials and kitchen supplies"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly Budget (Optional)
                </label>
                <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500">₹</span>
                    <input
                        type="number"
                        value={formData.budget}
                        onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="e.g. 5000"
                    />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Set a spending limit for this category</p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color Code
                </label>
                <div className="flex flex-wrap gap-3">
                    {COLORS.map((color) => (
                        <button
                            key={color}
                            type="button"
                            onClick={() => setFormData({ ...formData, color })}
                            className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${formData.color === color
                                ? 'ring-2 ring-offset-2 ring-blue-500 scale-110 shadow-md'
                                : 'border border-gray-200'
                                }`}
                            style={{ backgroundColor: color }}
                            aria-label={`Select color ${color}`}
                        />
                    ))}
                </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                    <input
                        type="checkbox"
                        id="is_fixed"
                        checked={formData.is_fixed}
                        onChange={(e) => setFormData({ ...formData, is_fixed: e.target.checked })}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div>
                        <label htmlFor="is_fixed" className="font-medium text-gray-900 block">Fixed / Mandatory Expense</label>
                        <p className="text-xs text-gray-500">Auto-add this expense every month</p>
                    </div>
                </div>

                {formData.is_fixed && (
                    <div className="ml-8 animate-in fade-in slide-in-from-top-2 duration-300 grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Monthly Amount
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-500">₹</span>
                                <input
                                    type="number"
                                    value={formData.fixed_amount}
                                    onChange={(e) => setFormData({ ...formData, fixed_amount: e.target.value })}
                                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g. 12000"
                                    required={formData.is_fixed}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Deducted Date
                            </label>
                            <input
                                type="date"
                                value={formData.deducted_date}
                                onChange={(e) => setFormData({ ...formData, deducted_date: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="flex gap-3 justify-end pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-xl hover:shadow-blue-600/20 transition-all font-bold group relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <span className="relative">{initialData ? 'Update Category' : 'Create Category'}</span>
                </button>
            </div>
        </form>
    );
};

export default CategoryForm;
