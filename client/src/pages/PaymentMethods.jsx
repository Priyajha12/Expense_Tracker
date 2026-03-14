import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, Trash2, Edit2, CheckCircle } from 'lucide-react';
import {
    fetchPaymentMethods,
    createPaymentMethod,
    deletePaymentMethod,
    updatePaymentMethod
} from '../services/paymentMethodService';
import Modal from '../components/Modal';

const PaymentMethods = () => {
    const [methods, setMethods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMethod, setEditingMethod] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        is_default: false,
        credit_limit: '',
        due_date: ''
    });

    // Initial seed list if empty (visual only until backend supports bulk seed or we verify)
    // Actually we should let backend return empty if empty.

    useEffect(() => {
        loadMethods();
    }, []);

    const loadMethods = async () => {
        try {
            const res = await fetchPaymentMethods();
            if (res.success) {
                setMethods(res.data);

                // If no methods exist at all, we could prompt user or auto-create? 
                // But better to just show "Add your first payment method"
                // Or maybe seed default ones on registration?
                // The requirement mentions "These will be added [initially]".
                // We'll rely on the user adding them or a migration script.
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingMethod) {
                await updatePaymentMethod(editingMethod.id, formData);
            } else {
                await createPaymentMethod(formData);
            }
            setIsModalOpen(false);
            loadMethods();
        } catch (err) {
            alert('Failed to save payment method');
        }
    };

    const handleEdit = (method) => {
        setEditingMethod(method);
        setFormData({
            name: method.name,
            is_default: method.is_default === 1,
            credit_limit: method.credit_limit || '',
            due_date: method.due_date || ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this payment method?')) {
            await deletePaymentMethod(id);
            loadMethods();
        }
    };

    const openAddModal = () => {
        setEditingMethod(null);
        setFormData({ name: '', is_default: false, credit_limit: '', due_date: '' });
        setIsModalOpen(true);
    }

    return (
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Payment Methods</h1>
                    <p className="text-gray-500 mt-1">Manage Cash, Cards & UPI</p>
                </div>

                <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium shadow-lg shadow-blue-600/30"
                >
                    <Plus size={20} />
                    Add Method
                </button>
            </div>

            {loading ? (
                <div className="text-center p-10">Loading...</div>
            ) : methods.length === 0 ? (
                <div className="text-center p-20 bg-white rounded-2xl border border-gray-100">
                    <p className="text-gray-500">No payment methods found. Add one like "Cash" or "UPI".</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {methods.map(method => (
                        <div key={method.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${method.is_default ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                                    <CreditCard size={24} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                        {method.name}
                                        {method.is_default === 1 && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Default</span>}
                                    </h3>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                        <p className="text-xs text-gray-400">Payment Method</p>
                                        {method.credit_limit > 0 && (
                                            <p className="text-xs text-rose-500 font-bold">Limit: ₹{method.credit_limit.toLocaleString()}</p>
                                        )}
                                        {method.due_date && (
                                            <p className="text-xs text-amber-600 font-bold">Due: Day {method.due_date}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button onClick={() => handleEdit(method)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                                    <Edit2 size={18} />
                                </button>
                                <button onClick={() => handleDelete(method.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingMethod ? 'Edit Payment Method' : 'New Payment Method'}
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Method Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. UPI, HDFC Credit Card"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Credit Limit (Optional)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-400">₹</span>
                                <input
                                    type="number"
                                    value={formData.credit_limit}
                                    onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                                    placeholder="0"
                                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date (Day of Month)</label>
                            <input
                                type="number"
                                min="1"
                                max="31"
                                value={formData.due_date}
                                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                placeholder="e.g. 15"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="is_default"
                            checked={formData.is_default}
                            onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                            className="w-5 h-5 text-rose-600 rounded focus:ring-rose-500"
                        />
                        <label htmlFor="is_default" className="text-sm text-gray-700 font-medium">Set as default payment method</label>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Method</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default PaymentMethods;
