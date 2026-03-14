import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for token in localStorage
        const token = localStorage.getItem('token');
        if (token) {
            checkUserLoggedIn(token);
        } else {
            setLoading(false);
        }
    }, []);

    const checkUserLoggedIn = async (token) => {
        try {
            // We set the token in the api instance header temporarily or rely on interceptor
            // But the interceptor might not be set up yet if we imported api above.
            // Actually, let's just make a request. The interceptor in api.js will handle attaching the token 
            // if it reads from localStorage.

            // Wait, 'api.js' needs to be updated first to read from localStorage.
            const res = await api.get('/auth/me');
            if (res.data.success) {
                setUser(res.data.user);
            } else {
                localStorage.removeItem('token');
            }
        } catch (err) {
            console.error("Auth check failed", err);
            localStorage.removeItem('token');
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        if (res.data.success) {
            localStorage.setItem('token', res.data.token);
            setUser(res.data.user);
            return res.data.user;
        }
    };

    const register = async (name, email, password) => {
        const res = await api.post('/auth/register', { name, email, password });
        if (res.data.success) {
            localStorage.setItem('token', res.data.token);
            setUser(res.data.user);
            return res.data.user;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
