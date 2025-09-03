"use client";

import React from 'react'
import Link from 'next/link'
import { TrendingUp, User, LogOut } from 'lucide-react'
import { useAuth } from '../../lib/AuthContext'

const Navbar = () => {
  const { user, isAuthenticated, logout, balance } = useAuth();
  console.log({user, isAuthenticated, balance});
  return (
    <div className='w-full flex justify-between items-center p-6 border-b border-[#2a3441] bg-[#141920] h-[7%]'>
      <Link href="/" className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-[#ff6b00] rounded-lg flex items-center justify-center">
          <TrendingUp className="text-white" size={24} />
        </div>
        <div>
          <div className="text-[#ff6b00] text-2xl font-bold">exness</div>
          <div className="text-gray-400 text-xs">Trading Simulator</div>
        </div>
      </Link>
      
      <div className="flex items-center space-x-4">
        {isAuthenticated ? (
          <>
            <div className="flex items-center space-x-3 text-gray-300">
              <User size={18} />
              <span className="font-medium">{user?.username}</span>
              {balance && (
                <span className="text-green-400 font-mono">
                  ${(Number(balance)/100).toFixed(2)}
                </span>
              )}
            </div>
            <button 
              onClick={logout}
              className='flex items-center space-x-2 bg-[#1a1f26] text-white px-4 py-2 rounded-lg hover:bg-[#2a3441] transition-colors border border-[#2a3441]'
            >
              <LogOut size={16} />
              <span>Logout</span>
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
        
        {/* <Link 
          href="/webtrading"
          className='bg-[#ff6b00] text-white px-6 py-2 rounded-lg hover:bg-[#e55a00] transition-colors font-medium'
        >
          Start Trading
        </Link> */}
      </div>
    </div>
  )
}

export default Navbar