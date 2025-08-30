import { mockInstruments } from '@repo/common';

const TradingHeader = () => {
  const topInstruments = mockInstruments.slice(0, 6);

  return (
    <header className="bg-trading-bg-secondary border-b border-trading-border h-14 flex items-center px-4">
      <div className="flex items-center space-x-1">
        <div className="text-trading-warning text-xl font-bold">exness</div>
      </div>
      
      <div className="flex items-center ml-8 space-x-6 flex-1">
        {topInstruments.map((instrument) => (
          <div key={instrument.id} className="flex items-center space-x-3 cursor-pointer hover:bg-trading-bg-tertiary px-2 py-1 rounded">
            <div className="flex items-center space-x-2">
              {instrument.category === 'crypto' && (
                <div className="w-6 h-6 bg-trading-warning rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-black">₿</span>
                </div>
              )}
              {instrument.category === 'forex' && (
                <div className="w-6 h-6 bg-trading-blue rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold">$</span>
                </div>
              )}
              {instrument.category === 'stocks' && (
                <div className="w-6 h-6 bg-trading-success rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold">S</span>
                </div>
              )}
              <span className="text-trading-text-primary text-sm font-medium">
                {instrument.symbol}
              </span>
            </div>
            <div className="text-right">
              <div className="text-trading-text-primary text-sm font-medium">
                {instrument.price.toFixed(instrument.category === 'forex' ? 5 : 2)}
              </div>
              <div className={`text-xs ${instrument.change >= 0 ? 'text-trading-success' : 'text-trading-danger'}`}>
                {instrument.change >= 0 ? '+' : ''}{instrument.changePercent.toFixed(2)}%
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center space-x-4">
        <div className="text-trading-text-secondary text-sm">Demo: Standard</div>
        <div className="text-trading-text-primary text-sm font-medium">10,000.00 USD</div>
        <button className="bg-trading-blue hover:bg-trading-blue-light text-white px-4 py-1.5 rounded text-sm font-medium">
          Deposit
        </button>
      </div>
    </header>
  );
};

export default TradingHeader;