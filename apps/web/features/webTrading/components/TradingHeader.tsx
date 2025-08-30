import { mockInstruments } from '@repo/common';
import { Bell, Settings, User, ChevronDown, LogOut } from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';

const TradingHeader = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const topInstruments = mockInstruments.slice(0, 6);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <header className="bg-[#141920] border-b border-[#2a3441] h-16 flex items-center px-6 shadow-lg">
      {/* Logo and Brand */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <div className="text-[#ff6b00] text-2xl font-bold">exness</div>
          <div className="bg-[#ff6b00] text-white text-xs px-2 py-1 rounded font-medium">
            {isAuthenticated ? 'LIVE' : 'DEMO'}
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <button className="text-white hover:text-[#ff6b00] transition-colors text-sm font-medium">
            Trading
          </button>
          <button className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
            Analytics
          </button>
          <button className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
            Portfolio
          </button>
        </nav>
      </div>
      
      {/* Market Ticker */}
      <div className="flex items-center ml-8 space-x-4 flex-1 overflow-x-auto">
        {topInstruments.map((instrument) => (
          <div key={instrument.id} className="flex items-center space-x-3 cursor-pointer hover:bg-[#1a1f26] px-3 py-2 rounded transition-colors min-w-fit">
            <div className="flex items-center space-x-2">
              {instrument.category === 'crypto' && (
                <div className="w-6 h-6 bg-[#ff6b00] rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">₿</span>
                </div>
              )}
              {instrument.category === 'forex' && (
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">$</span>
                </div>
              )}
              {instrument.category === 'stocks' && (
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">S</span>
                </div>
              )}
              <span className="text-white text-sm font-medium">
                {instrument.symbol}
              </span>
            </div>
            <div className="text-right">
              <div className="text-white text-sm font-mono">
                {instrument.price.toFixed(instrument.category === 'forex' ? 5 : 2)}
              </div>
              <div className={`text-xs font-medium ${instrument.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {instrument.change >= 0 ? '+' : ''}{instrument.changePercent.toFixed(2)}%
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* User Section */}
      <div className="flex items-center space-x-4 ml-6">
        <div className="text-right hidden sm:block">
          <div className="text-gray-400 text-xs">
            {isAuthenticated ? 'Live Account' : 'Demo Account'}
          </div>
          <div className="text-white text-sm font-bold">
            {user?.balance ? `$${user.balance.toLocaleString()}` : '$10,000.00'}
          </div>
        </div>
        
        <button className="p-2 text-gray-400 hover:text-white transition-colors">
          <Bell size={18} />
        </button>
        
        <button className="p-2 text-gray-400 hover:text-white transition-colors">
          <Settings size={18} />
        </button>
        
        {isAuthenticated ? (
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 cursor-pointer hover:bg-[#1a1f26] px-3 py-2 rounded transition-colors">
              <div className="w-8 h-8 bg-[#ff6b00] rounded-full flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
              <span className="text-white text-sm font-medium">{user?.username}</span>
              <ChevronDown size={16} className="text-gray-400" />
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-400 transition-colors"
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <a 
              href="/login"
              className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
            >
              Sign In
            </a>
            <a 
              href="/signup"
              className="bg-[#ff6b00] hover:bg-[#e55a00] text-white px-4 py-2 rounded font-medium transition-colors"
            >
              Sign Up
            </a>
          </div>
        )}
        
        <button className="bg-[#ff6b00] hover:bg-[#e55a00] text-white px-4 py-2 rounded font-medium transition-colors">
          Deposit
        </button>
      </div>
    </header>
  );
};

export default TradingHeader;