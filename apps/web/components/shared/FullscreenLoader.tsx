import React from 'react';

const FullscreenLoader = () => {
  return (
    <div className="fixed inset-0 bg-[#101317] flex items-center justify-center z-50">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#ff6b00]"></div>
    </div>
  );
};

export default FullscreenLoader;