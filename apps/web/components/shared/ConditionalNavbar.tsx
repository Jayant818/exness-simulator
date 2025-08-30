"use client";

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

const ConditionalNavbar = () => {
  const pathname = usePathname();
  
  // Hide navbar on trading pages
  const hideNavbar = pathname.startsWith('/webtrading');
  
  if (hideNavbar) {
    return null;
  }
  
  return <Navbar />;
};

export default ConditionalNavbar;
