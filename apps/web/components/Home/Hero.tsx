import React from 'react'

const HeroSection = () => {
  return (
    <div className='w-full bg-gradient-to-r from-[#213946] to-[#1a2e3a] text-white py-20 px-4'>
      <div className='max-w-7xl mx-auto text-center'>
        <h1 className='text-4xl md:text-5xl font-bold mb-6'>
          Trade with Confidence on Exness
        </h1>
        <p className='text-lg md:text-xl mb-8 max-w-2xl mx-auto'>
          Join millions of traders worldwide with Exness, your trusted platform for forex, stocks, and crypto trading. 
          Experience low spreads, fast execution, and 24/7 support.
        </p>
        <div className='flex justify-center gap-4'>
          <button className='bg-[#00e0c6] text-[#213946] px-6 py-3 rounded-md font-semibold hover:bg-[#00c7b0] transition-colors'>
            Start Trading
          </button>
          <button className='border border-white px-6 py-3 rounded-md font-semibold hover:bg-white hover:text-[#213946] transition-colors'>
            Open Demo Account
          </button>
        </div>
      </div>
    </div>
  )
}

export default HeroSection;