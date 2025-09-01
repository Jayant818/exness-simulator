import { Bell, Settings, User, ChevronDown, LogOut } from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';

const TradingHeader = () => {
  const { user, isAuthenticated, logout,balance } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <header className="bg-[#141920] border-b border-[#2a3441] h-16 flex items-center justify-between px-6 shadow-lg">
      {/* Logo and Brand */}
      <div className="flex items-center ">
        <div className="flex items-center space-x-2">
          <div className="text-[#ff6b00] text-2xl font-bold">exness</div>
          <div className="bg-[#ff6b00] text-white text-xs px-2 py-1 rounded font-medium">
            {isAuthenticated ? 'LIVE' : 'DEMO'}
          </div>
        </div>
      </div>

      {/* User Section */}
      <div className="flex items-center space-x-4 ml-6">
        <div className="text-right hidden sm:block">
          <div className="text-gray-400 text-xs">
            {isAuthenticated ? 'Live Account' : 'Demo Account'}
          </div>
          <div className="text-white text-sm font-bold">
            {balance ? `$${(balance / 100).toFixed(3)}` : '$0'}
          </div>
        </div>
      
        
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