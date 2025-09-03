"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  username: string;
  balance?: number;
}

export type Balance = {
  usd: number; // scaled (cents)
  locked_usd: number; // scaled
  [asset: string]: any;
};

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  balance: Balance | null;
  login: (token:string) => void;
  logout: () => void;
  fetchBalance: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    async function initializeAuth() { 
      const token = localStorage.getItem('token');
      if (token) {
        await login(token);
      }
      setIsAuthenticated(true);
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

        setBalance(parseFloat(data.usd));

        console.log("data",data)
        console.log('Fetched balance:', data.usd);
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
        try {
          await fetch(`${process.env.NEXT_PUBLIC_API_SERVER}/api/v1/system/restart-polling`, {
            method: 'POST',
            
          })
        }
        catch (error) { 
          console.error('Failed to restart polling:', error);
        }
      }
      setIsAuthenticated(true);
      fetchUserBalance();

      // start the Polling when someone starts the session

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
    balance: balance || 0,
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
