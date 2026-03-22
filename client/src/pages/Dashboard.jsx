import React, { useState, useEffect } from 'react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { fetchDashboardData } from '../services/dashboardService';
import {
    Filter, ArrowUpDown, ChevronUp, ChevronDown, Plus,
    TrendingUp, Zap, Calendar, DollarSign, Target, Activity,
    Layers, ShoppingBag, ArrowRight, Shield, CreditCard, PieChart as PieChartIcon, Edit2
} from 'lucide-react';
import { updatePaymentMethod } from '../services/paymentMethodService';

import { createIncome, fetchIncomeCategories } from '../services/incomeService';
import { format, parseISO, getDaysInMonth } from 'date-fns';
import Modal from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [excludeFixed, setExcludeFixed] = useState(false);
    const [excludeFixedTop3, setExcludeFixedTop3] = useState(false);

    // Sorting State for details table
    const [sortConfig, setSortConfig] = useState({ key: 'total', direction: 'desc' });

    // Income Modal State
    const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
    const [incomeCategories, setIncomeCategories] = useState([]);
    const [incomeFormData, setIncomeFormData] = useState({
        income_category_id: '',
        amount: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        note: ''
    });

    // Payment Method Limit Edit State
    const [editingPm, setEditingPm] = useState(null);
    const [pmLimit, setPmLimit] = useState('');

    const COLORS = ['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#F43F5E', '#06B6D4', '#6366F1'];

    useEffect(() => {
        loadData();
    }, [month, year]);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const incomeRes = await fetchIncomeCategories();
                if (incomeRes.success) {
                    setIncomeCategories(incomeRes.data);
                    const salaryCat = incomeRes.data.find(c => c.name === 'Salary');
                    if (salaryCat) {
                        setIncomeFormData(prev => ({ ...prev, income_category_id: salaryCat.id }));
                    } else if (incomeRes.data.length > 0) {
                        setIncomeFormData(prev => ({ ...prev, income_category_id: incomeRes.data[0].id }));
                    }
                }
            } catch (err) {
                console.error(err);
            }
        };
        loadInitialData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await fetchDashboardData(month, year);
            if (res.success) {
                setData(res.data);
            }
        } catch (err) {
            console.error('Failed to load dashboard data', err);
        } finally {
            setLoading(false);
        }
    };

    const handleIncomeSubmit = async (e) => {
        e.preventDefault();
        try {
            await createIncome(incomeFormData);
            setIsIncomeModalOpen(false);
            setIncomeFormData(prev => ({ ...prev, amount: '', note: '' }));
            loadData();
        } catch (err) {
            alert('Failed to add income');
        }
    };

    const handleLimitUpdate = async (e) => {
        e.preventDefault();
        try {
            await updatePaymentMethod(editingPm.id, { credit_limit: Number(pmLimit) });
            setEditingPm(null);
            loadData();
        } catch (err) {
            alert('Failed to update limit');
        }
    };

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const currentYear = new Date().getFullYear();
    const years = [currentYear - 1, currentYear, currentYear + 1];

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedBreakdown = React.useMemo(() => {
        if (!data?.breakdown) return [];
        const items = [...data.breakdown];
        items.sort((a, b) => {
            const aVal = a[sortConfig.key];
            const bVal = b[sortConfig.key];
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return items;
    }, [data?.breakdown, sortConfig]);

    const topCategories = React.useMemo(() => {
        if (!data?.breakdown) return [];
        return data.breakdown
            .filter(c => !excludeFixedTop3 || c.is_fixed === 0)
            .sort((a, b) => b.total - a.total)
            .slice(0, 3);
    }, [data?.breakdown, excludeFixedTop3]);

    if (loading && !data) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
        </div>
    );

    if (!data) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
            <Activity size={48} className="mb-4 opacity-20" />
            <p className="font-black uppercase tracking-widest text-xs">Failed to load dashboard</p>
            <button
                onClick={loadData}
                className="mt-4 px-6 py-2 bg-slate-100 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-colors"
            >
                Retry Connection
            </button>
        </div>
    );

    const totalSpent = data?.total || 0;
    const totalIncome = data?.income || 0;
    const leftAmount = Math.max(0, totalIncome - totalSpent);
    const avgDaily = totalSpent / getDaysInMonth(new Date(year, month - 1));

    const fixedTotal = (data?.breakdown || []).filter(c => c.is_fixed === 1).reduce((sum, c) => sum + c.total, 0) || 0;
    const variableTotal = (data?.breakdown || []).filter(c => c.is_fixed === 0).reduce((sum, c) => sum + c.total, 0) || 0;

    const donutData = [
        { name: 'Variable', value: variableTotal, color: '#F59E0B' },
        { name: 'Fixed', value: fixedTotal, color: '#10B981' }
    ];

    const barChartData = (data?.dailyTrend || []).map(day => {
        let dateLabel = 'N/A';
        try {
            if (day.date) dateLabel = format(parseISO(day.date), 'MMM dd');
        } catch (e) {
            console.error("Date formatting error", e);
        }

        return {
            ...day,
            dateFormatted: dateLabel,
            displayValue: excludeFixed ? (day.variableAmount || 0) : (day.total || 0)
        };
    });



    return (
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* 1. Header & Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-1">
                        Monthly <span className="text-amber-500">Summary</span>
                    </h1>
                    <p className="text-slate-500 font-bold tracking-tight uppercase text-xs">
                        {months[month - 1]} {year} Analytics
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsIncomeModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl hover:shadow-xl hover:shadow-amber-500/20 transition-all font-bold group text-sm"
                    >
                        <Plus size={18} className="text-white group-hover:rotate-90 transition-transform" />
                        Add Income
                    </button>

                    <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-slate-100 shadow-sm">
                        <Filter size={18} className="text-amber-500" />
                        <select
                            value={month}
                            onChange={(e) => setMonth(Number(e.target.value))}
                            className="bg-transparent border-none text-slate-700 font-bold focus:ring-0 cursor-pointer outline-none text-sm"
                        >
                            {months.map((m, i) => (
                                <option key={i} value={i + 1}>{m}</option>
                            ))}
                        </select>
                        <div className="w-px h-6 bg-slate-100"></div>
                        <select
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
                            className="bg-transparent border-none text-slate-700 font-bold focus:ring-0 cursor-pointer outline-none text-sm"
                        >
                            {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* 1. Monthly Overview Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12">
                {/* Total Expenses */}
                <div className="bg-white p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col justify-between">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-50 text-amber-500 rounded-xl md:rounded-2xl flex items-center justify-center mb-3 md:mb-4 border border-amber-100">
                        <DollarSign size={20} className="md:w-6 md:h-6" />
                    </div>
                    <div>
                        <p className="text-slate-400 font-bold text-[8px] md:text-[10px] uppercase tracking-widest leading-none mb-1 md:mb-2">Total Expenses</p>
                        <h3 className="text-xl md:text-3xl font-black text-slate-900 leading-none tracking-tight">₹{totalSpent.toLocaleString()}</h3>
                    </div>
                </div>

                {/* Savings (How much left) */}
                <div className="bg-white p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col justify-between">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-50 text-emerald-500 rounded-xl md:rounded-2xl flex items-center justify-center mb-3 md:mb-4 border border-emerald-100">
                        <Zap size={20} className="md:w-6 md:h-6" />
                    </div>
                    <div>
                        <p className="text-slate-400 font-bold text-[8px] md:text-[10px] uppercase tracking-widest leading-none mb-1 md:mb-2">Savings</p>
                        <h3 className="text-xl md:text-3xl font-black text-slate-900 leading-none tracking-tight">₹{leftAmount.toLocaleString()}</h3>
                    </div>
                </div>

                {/* Avg Daily Spend */}
                <div className="bg-white p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col justify-between">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-50 text-indigo-500 rounded-xl md:rounded-2xl flex items-center justify-center mb-3 md:mb-4 border border-indigo-100">
                        <TrendingUp size={20} className="md:w-6 md:h-6" />
                    </div>
                    <div>
                        <p className="text-slate-400 font-bold text-[8px] md:text-[10px] uppercase tracking-widest leading-none mb-1 md:mb-2">Avg. Daily Spend</p>
                        <h3 className="text-xl md:text-3xl font-black text-slate-900 leading-none tracking-tight">₹{Math.round(avgDaily).toLocaleString()}</h3>
                    </div>
                </div>

                {/* Transactions */}
                <div className="bg-white p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col justify-between">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 text-blue-500 rounded-xl md:rounded-2xl flex items-center justify-center mb-3 md:mb-4 border border-blue-100">
                        <Activity size={20} className="md:w-6 md:h-6" />
                    </div>
                    <div>
                        <p className="text-slate-400 font-bold text-[8px] md:text-[10px] uppercase tracking-widest leading-none mb-1 md:mb-2">Transactions</p>
                        <h3 className="text-xl md:text-3xl font-black text-slate-900 leading-none tracking-tight">{data?.transactionCount || 0}</h3>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                {/* 2. Spending by Category */}
                <div className="lg:col-span-1 bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-8 border border-slate-100 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-6 md:mb-8">
                        <h3 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">Category Split</h3>
                        <Layers size={20} className="text-slate-300" />
                    </div>

                    <div className="h-[250px] mb-8">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data?.breakdown || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="total"
                                >
                                    {data?.breakdown?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} cornerRadius={4} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value) => [`₹${value.toLocaleString()} (${totalSpent > 0 ? ((value / totalSpent) * 100).toFixed(1) : '0'}%)`, 'Spent']}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="space-y-4 flex-1">
                        {sortedBreakdown.slice(0, 5).map((cat, idx) => (
                            <div key={cat.id} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color || COLORS[idx % COLORS.length] }}></div>
                                    <span className="text-sm font-bold text-slate-700">{cat.name}</span>
                                </div>
                                <span className="text-sm font-black text-slate-900">₹{cat.total.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>

                    <button className="mt-8 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-amber-500 transition-colors">
                        View Full List <ArrowRight size={14} />
                    </button>
                </div>

                {/* 3. Daily Spending Trend */}
                <div className="lg:col-span-2 bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-8 border border-slate-100 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-10">
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">Daily Spending Trend</h3>
                            <button
                                onClick={() => setExcludeFixed(!excludeFixed)}
                                className={`text-[9px] font-black uppercase px-3 py-1 rounded-full transition-all border ${excludeFixed ? 'bg-amber-500 text-white border-amber-500' : 'bg-slate-50 text-slate-400 border-slate-100'}`}
                            >
                                {excludeFixed ? 'Excluding Fixed' : 'Including Fixed'}
                            </button>
                        </div>
                        <Calendar size={20} className="text-slate-300 hidden sm:block" />
                    </div>

                    <div className="h-[250px] md:h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barChartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="dateFormatted"
                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(val) => `₹${val}`}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc', radius: 10 }}
                                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value) => [`₹${value.toLocaleString()}`, 'Spent']}
                                />
                                <Bar
                                    dataKey="displayValue"
                                    fill="#F59E0B"
                                    radius={[6, 6, 0, 0]}
                                    barSize={24}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="mt-8 p-3 md:p-4 bg-slate-50 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3 md:gap-4 font-black">
                            <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-amber-500">
                                <TrendingUp size={16} className="md:w-5 md:h-5" />
                            </div>
                            <div>
                                <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-tighter">Peak Spending Day</p>
                                <p className="text-xs md:text-sm font-black text-slate-800">
                                    {data?.peakDay?.date ? format(parseISO(data.peakDay.date), 'MMMM do') : 'N/A'}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-tighter">Amount</p>
                            <p className="text-xs md:text-sm font-black text-amber-500">₹{data?.peakDay?.total?.toLocaleString() || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                {/* 1. Payment Method Split Pie Chart */}
                <div className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-slate-100 shadow-sm flex flex-col min-h-[400px]">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                                <PieChartIcon size={20} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Payment Split</h3>
                        </div>
                        <span className="text-[10px] font-black uppercase text-slate-400">By usage volume</span>
                    </div>

                    <div className="flex-1 min-h-[250px] relative">
                        {data?.paymentSplit && data.paymentSplit.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.paymentSplit}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={85}
                                        paddingAngle={5}
                                        dataKey="total"
                                        nameKey="name"
                                    >
                                        {data.paymentSplit.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        formatter={(v) => [`₹${(Number(v) || 0).toLocaleString()}`, 'Usage']}
                                    />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300">
                                <Activity size={40} className="mb-2 opacity-20" />
                                <p className="text-[10px] uppercase font-black tracking-widest">No spending data</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Credit Wall (Limits and Tracking) */}
                <div className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-slate-100 shadow-sm flex flex-col min-h-[400px]">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center">
                                <CreditCard size={20} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Credit & Wallet Wall</h3>
                        </div>
                    </div>

                    <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
                        {data?.paymentSplit && data.paymentSplit.length > 0 ? (
                            data.paymentSplit.map((pm) => {
                                const limit = Number(pm.credit_limit || 0);
                                const total = Number(pm.total || 0);
                                const hasLimit = limit > 0;
                                const utilization = hasLimit ? Math.min(100, (total / limit) * 100) : 0;
                                const isCritical = utilization > 80;

                                return (
                                    <div key={pm.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all group">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h4 className="font-black text-slate-800 text-sm md:text-base">{pm.name}</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    Spent: <span className="text-slate-900">₹{total.toLocaleString()}</span>
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => { setEditingPm(pm); setPmLimit(pm.credit_limit || ''); }}
                                                className="p-1.5 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-amber-500 hover:bg-white rounded-lg transition-all shadow-sm"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                        </div>

                                        {hasLimit ? (
                                            <div>
                                                <div className="flex justify-between items-center mb-1.5 px-0.5">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${isCritical ? 'text-red-500' : 'text-slate-400'}`}>
                                                        {Math.round(utilization)}% Utilized
                                                    </span>
                                                    <span className="text-[10px] font-black text-slate-900">₹{limit.toLocaleString()} Limit</span>
                                                </div>
                                                <div className="w-full h-2 bg-slate-200/50 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-1000 ${isCritical ? 'bg-red-500' : 'bg-emerald-500'}`}
                                                        style={{ width: `${utilization}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => { setEditingPm(pm); setPmLimit(''); }}
                                                className="w-full py-2.5 border border-dashed border-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-amber-500 hover:border-amber-400 hover:bg-white transition-all bg-white/50"
                                            >
                                                + Assign Credit Limit
                                            </button>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300 pb-12">
                                <Shield size={40} className="mb-2 opacity-20" />
                                <p className="text-[10px] uppercase font-black tracking-widest">Initialization required</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* 4. Insights & Highlights */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] md:rounded-[3rem] p-8 md:p-10 text-white shadow-2xl relative overflow-hidden h-full">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                                <Zap size={18} className="text-white" />
                            </div>
                            <h3 className="text-xl font-black tracking-tight">FinLady Insights</h3>
                        </div>

                        <div className="space-y-8">
                            <div>
                                <label className="text-amber-500/60 text-[10px] font-black uppercase tracking-widest block mb-1">Top Category</label>
                                <p className="text-lg font-bold leading-snug">
                                    You spent the most on <span className="text-amber-400 font-black">{data?.breakdown?.[0]?.name || '...'}</span> this month.
                                </p>
                            </div>

                            <div>
                                <label className="text-amber-500/60 text-[10px] font-black uppercase tracking-widest block mb-1">Biggest Spending spike</label>
                                <p className="text-lg font-bold leading-snug">
                                    Your highest spending day was <span className="text-amber-400 font-black">{data?.peakDay?.date ? format(parseISO(data.peakDay.date), 'MMMM do') : 'March 1'}.</span>
                                </p>
                            </div>

                            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Shield size={16} className="text-emerald-400" />
                                    <span className="text-xs font-bold text-slate-400">Spending within limits</span>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 underline cursor-pointer">Deep Dive</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Additional Analytics: Top 3 & Distribution */}
                <div className="grid grid-cols-1 gap-6">
                    <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-4 md:p-6 border border-slate-100 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-3 md:gap-5">
                            <div className="w-10 h-10 md:w-14 md:h-14 bg-amber-50 text-amber-500 rounded-xl md:rounded-2xl flex items-center justify-center border border-amber-100 shadow-sm shadow-amber-500/10">
                                <Target size={20} className="md:w-7 md:h-7" />
                            </div>
                            <div>
                                <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Variable vs Fixed</p>
                                <div className="flex items-center gap-2 md:gap-3">
                                    <span className="text-sm md:text-lg font-black text-slate-900">₹{variableTotal.toLocaleString()}</span>
                                    <span className="text-slate-200">/</span>
                                    <span className="text-sm md:text-lg font-black text-slate-400">₹{fixedTotal.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                        <div className="w-16 h-16">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={donutData}
                                        innerRadius={22}
                                        outerRadius={30}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {donutData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 border border-slate-100 shadow-sm h-full flex flex-col justify-center">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                            <div className="flex items-center gap-3">
                                <h4 className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Top 3 Burners</h4>
                                <button
                                    onClick={() => setExcludeFixedTop3(!excludeFixedTop3)}
                                    className={`text-[7px] md:text-[8px] font-black uppercase px-2 py-0.5 rounded-full transition-all border ${excludeFixedTop3 ? 'bg-amber-500 text-white border-amber-500' : 'bg-slate-50 text-slate-400 border-slate-100'}`}
                                >
                                    {excludeFixedTop3 ? 'Excluding Fixed' : 'Including Fixed'}
                                </button>
                            </div>
                            <ShoppingBag size={16} className="text-slate-300 hidden sm:block" />
                        </div>
                        <div className="space-y-4">
                            {topCategories.map((cat, i) => (
                                <div key={cat.id} className="flex items-center gap-4">
                                    <span className="text-2xl font-black text-slate-100 italic">{i + 1}</span>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-end mb-1">
                                            <span className="text-sm font-bold text-slate-700">{cat.name}</span>
                                            <span className="text-xs font-black text-slate-900">₹{cat.total.toLocaleString()}</span>
                                        </div>
                                        <div className="w-full h-1 bg-slate-50 rounded-full overflow-hidden">
                                            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${totalSpent > 0 ? (cat.total / totalSpent) * 100 : 0}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={!!editingPm}
                onClose={() => setEditingPm(null)}
                title={`Manage ${editingPm?.name} Limit`}
            >
                <form onSubmit={handleLimitUpdate} className="space-y-6 pt-4">
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Monthly Credit/Limit Amount</label>
                        <div className="relative">
                            <span className="absolute left-4 top-3.5 text-slate-400 font-black">₹</span>
                            <input
                                type="number"
                                value={pmLimit}
                                onChange={e => setPmLimit(e.target.value)}
                                className="w-full pl-10 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-amber-500 transition-all font-black text-slate-900 text-xl"
                                placeholder="e.g. 50000"
                            />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 font-bold px-1 italic">
                            Set this to track your monthly usage against a specific limit (e.g. for Credit Cards or a fixed Cash budget).
                        </p>
                    </div>
                    <div className="flex gap-4 justify-end pt-4">
                        <button type="button" onClick={() => setEditingPm(null)} className="px-6 py-2 text-slate-400 font-black uppercase text-xs tracking-widest">Cancel</button>
                        <button type="submit" className="px-10 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-slate-900/10">Save Limit</button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={isIncomeModalOpen}
                onClose={() => setIsIncomeModalOpen(false)}
                title="Add New Income"
            >
                <form onSubmit={handleIncomeSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                        <select
                            value={incomeFormData.income_category_id}
                            onChange={e => setIncomeFormData({ ...incomeFormData, income_category_id: Number(e.target.value) })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
                            required
                        >
                            {incomeCategories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-500 font-bold">₹</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={incomeFormData.amount}
                                    onChange={e => setIncomeFormData({ ...incomeFormData, amount: e.target.value })}
                                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                            <input
                                type="date"
                                value={incomeFormData.date}
                                onChange={e => setIncomeFormData({ ...incomeFormData, date: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Note (Optional)</label>
                        <input
                            type="text"
                            value={incomeFormData.note}
                            onChange={e => setIncomeFormData({ ...incomeFormData, note: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={() => setIsIncomeModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Add Income</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Dashboard;
