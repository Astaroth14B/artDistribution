import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../config';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load user on start
    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                setAuthToken(token);
                try {
                    const res = await axios.get(`${API_URL}/api/v1/auth/user`);
                    setUser(res.data);
                } catch (err) {
                    localStorage.removeItem('token');
                    setAuthToken(null);
                    setUser(null);
                }
            }
            setLoading(false);
        };
        loadUser();
    }, []);

    // Register
    const register = async (formData) => {
        try {
            const res = await axios.post(`${API_URL}/api/v1/auth/register`, formData);
            localStorage.setItem('token', res.data.token);
            setAuthToken(res.data.token);
            setUser(res.data.user);
            return { success: true };
        } catch (err) {
            return {
                success: false,
                msg: err.response?.data?.msg || 'Registration Error',
                needsVerification: err.response?.data?.needsVerification
            };
        }
    };

    // Login
    const login = async (formData) => {
        try {
            const res = await axios.post(`${API_URL}/api/v1/auth/login`, formData);
            localStorage.setItem('token', res.data.token);
            setAuthToken(res.data.token);
            setUser(res.data.user);
            return { success: true };
        } catch (err) {
            return {
                success: false,
                msg: err.response?.data?.msg || 'Login Error',
                isAdmin: err.response?.data?.isAdmin,
                needsVerification: err.response?.data?.needsVerification
            };
        }
    };

    // Logout
    const logout = () => {
        localStorage.removeItem('token');
        setAuthToken(null);
        setUser(null);
    };

    // Resend Code
    const resendCode = async (email) => {
        try {
            const res = await axios.post(`${API_URL}/api/v1/auth/resend-code`, { email });
            return { success: true, msg: res.data.msg };
        } catch (err) {
            return { success: false, msg: err.response?.data?.msg || 'Failed to resend' };
        }
    };

    return (
        <AuthContext.Provider value={{ user, setUser, loading, register, login, logout, resendCode }}>
            {children}
        </AuthContext.Provider>
    );
};

// Helper to set Axios Header
const setAuthToken = (token) => {
    if (token) {
        axios.defaults.headers.common['x-auth-token'] = token;
    } else {
        delete axios.defaults.headers.common['x-auth-token'];
    }
};

export const useAuth = () => useContext(AuthContext);
