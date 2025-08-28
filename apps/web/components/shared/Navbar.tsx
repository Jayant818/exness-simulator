"use client";

import Image from 'next/image'
import React from 'react'

const Navbar = () => {

  const handleLogin = async () => { 
    
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_SERVER}/api/auth/login`);

  }

  return (
    <div className='w-full flex justify-between p-4 border-b-[1px] border-b-[#213946]'>
          <Image
              alt='Logo'
              src="/logo.png"
              height={250}
              width={250}
          />
          <div>
              <button onClick={handleLogin} className='bg-[#213946] text-white px-4 py-2 rounded-md hover:bg-[#1a2e3a] transition-colors'>
                  Login
              </button>
          </div>
    </div>
  )
}

export default Navbar