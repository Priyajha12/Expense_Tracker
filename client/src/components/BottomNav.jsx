import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Wallet, User } from 'lucide-react';

const BottomNav = () => {
    const location = useLocation();

    const isActive = (path) => {
        return location.pathname === path;
    };

    const navItems = [
        { path: '/dashboard', label: 'Home', icon: LayoutDashboard },
        { path: '/expenses', label: 'Expenses', icon: Wallet },
        // { path: '/profile', label: 'Profile', icon: User }, // Placeholder for future
    ];

    return (
        <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl z-40 p-2 flex items-center justify-around h-16">
            {navItems.map((item) => (
                <Link
                    key={item.path}
                    to={item.path}
                    className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-all ${isActive(item.path)
                        ? 'text-amber-400 font-bold'
                        : 'text-slate-500 hover:text-slate-300'
                        }`}
                >
                    <item.icon size={22} strokeWidth={isActive(item.path) ? 3 : 2} />
                    <span className="text-[10px] uppercase font-black tracking-widest">{item.label}</span>
                    {isActive(item.path) && (
                        <div className="absolute -bottom-1 w-1 h-1 bg-amber-400 rounded-full animate-pulse"></div>
                    )}
                </Link>
            ))}
        </nav>
    );
};

export default BottomNav;
