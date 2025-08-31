"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  username: string;
  balance?: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  balance: number;
  login: (token:string) => void;
  logout: () => void;
  fetchBalance: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initializeAuth() { 
      const token = localStorage.getItem('token');
      if (token) {
        await login(token);
      }
      
      setIsLoading(false);
    }
    initializeAuth();
  }, []);

  const fetchUserBalance = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_SERVER}/api/v1/user/balance`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(prev => prev ? { ...prev, balance: parseFloat(data.usd_balance) } : null);
      }
    } catch (error) {
      console.error('Failed to fetch balance for user:', error);
    }
  };

  const login = async (token: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_SERVER}/api/v1/user/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });
      
      if (res.ok) {
        const data = await res.json();
        setUser({ id: data.userId, username: data.username, balance: parseFloat(data.balance.usd) });
      }
      setIsAuthenticated(true);
      fetchUserBalance();
    } catch (error) {
      console.error('Failed to login:', error);
    }
  };

  const logout = async () => {
    // TODO: write logout API
    // try {
    //   // Call logout endpoint to clear server-side session
    //   await fetch(`${process.env.NEXT_PUBLIC_API_SERVER}/api/v1/user/logout`, {
    //     method: 'POST',
    //     credentials: 'include'
    //   });
    // } catch (error) {
    //   console.error('Logout error:', error);
    // }

    setIsAuthenticated(false);
    localStorage.removeItem('token');
  };

  const fetchBalance = () => fetchUserBalance();

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    fetchBalance,
    balance: user?.balance || 0,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
