"use client";

import React from 'react'
import Link from 'next/link'
import { TrendingUp, User, LogOut } from 'lucide-react'
import { useAuth } from '../../lib/AuthContext'

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className='w-full flex justify-between items-center p-6 border-b border-[#2a3441] bg-[#141920]'>
      <Link href="/" className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-[#ff6b00] rounded-lg flex items-center justify-center">
          <TrendingUp className="text-white" size={24} />
        </div>
        <div>
          <div className="text-[#ff6b00] text-2xl font-bold">exness</div>
          <div className="text-gray-400 text-xs">Trading Simulator</div>
        </div>
      </Link>
      
      {/* <nav className="hidden md:flex items-center space-x-8">
        <Link href="/" className="text-gray-300 hover:text-white transition-colors font-medium">
          Home
        </Link>
        <Link href="/webtrading" className="text-gray-300 hover:text-[#ff6b00] transition-colors font-medium">
          Trading Platform
        </Link>
        <Link href="/markets" className="text-gray-300 hover:text-white transition-colors font-medium">
          Markets
        </Link>
        <Link href="/education" className="text-gray-300 hover:text-white transition-colors font-medium">
          Education
        </Link>
      </nav> */}
      
      <div className="flex items-center space-x-4">
        {isAuthenticated ? (
          <>
            <div className="flex items-center space-x-3 text-gray-300">
              <User size={18} />
              <span className="font-medium">{user?.username}</span>
              {user?.balance && (
                <span className="text-green-400 font-mono">
                  ${user.balance.toLocaleString()}
                </span>
              )}
            </div>
            <button 
              onClick={handleLogout}
              className='flex items-center space-x-2 bg-[#1a1f26] text-white px-4 py-2 rounded-lg hover:bg-[#2a3441] transition-colors border border-[#2a3441]'
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </>
        ) : (
          <>
            <Link 
              href="/login"
              className='bg-[#1a1f26] text-white px-6 py-2 rounded-lg hover:bg-[#2a3441] transition-colors border border-[#2a3441] font-medium'
            >
              Sign In
            </Link>
            <Link 
              href="/signup"
              className='bg-[#ff6b00] text-white px-6 py-2 rounded-lg hover:bg-[#e55a00] transition-colors font-medium'
            >
              Sign Up
            </Link>
          </>
        )}
        
        <Link 
          href="/webtrading"
          className='bg-[#ff6b00] text-white px-6 py-2 rounded-lg hover:bg-[#e55a00] transition-colors font-medium'
        >
          Start Trading
        </Link>
      </div>
    </div>
  )
}

export default Navbar