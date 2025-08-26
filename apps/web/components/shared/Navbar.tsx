import Image from 'next/image'
import React from 'react'

const Navbar = () => {
  return (
    <div className='w-full flex justify-between p-4 '>
          <Image
              alt='Logo'
              src="https://my.exness.com/cnf/app-icons/logo_yellow.svg"
              height={100}
              width={100}
          />
          <div>
              
          </div>
    </div>
  )
}

export default Navbar