import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Wallet, CreditCard, LogOut, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
    const location = useLocation();
    const { logout } = useAuth();

    const isActive = (path) => {
        return location.pathname === path;
    };

    const navItems = [
        { path: '/dashboard', label: 'Monthly Summary', icon: LayoutDashboard },
        { path: '/expenses', label: 'Expenses', icon: Wallet }
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden pointer-events-auto"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out 
                md:static md:h-screen md:sticky md:top-0 md:translate-x-0
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                md:transform-none
            `}>
                <div className="p-6 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-yellow-500/20 border-2 border-white/30">
                            <span className="font-black text-xl italic tracking-tighter">FL</span>
                        </div>
                        <span className="text-2xl font-black tracking-tight text-white">
                            Fin<span className="text-yellow-400">Lady</span>
                        </span>
                    </div>
                    {/* Close button for mobile */}
                    <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <nav className="flex-1 px-4 space-y-1 mt-4">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => onClose()} // Close on click (mobile)
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold ${isActive(item.path)
                                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <item.icon size={20} className={isActive(item.path) ? 'text-white' : ''} />
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors font-medium">
                        <LogOut size={20} />
                        Sign Out
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
