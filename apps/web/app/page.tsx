import Link from 'next/link';
import { TrendingUp, BarChart3, Shield, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0e13] text-white">
      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Trade Like a{' '}
            <span className="text-[#ff6b00]">Professional</span>
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-3xl mx-auto">
            Experience the power of professional trading with our advanced platform. 
            Start with $500,000 demo balance and master the markets risk-free.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/signup"
              className="bg-[#ff6b00] hover:bg-[#e55a00] text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors"
            >
              Start Trading Now
            </Link>
            <Link 
              href="/webtrading"
              className="bg-[#1a1f26] hover:bg-[#2a3441] text-white px-8 py-4 rounded-lg font-bold text-lg border border-[#2a3441] transition-colors"
            >
              Try Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6 bg-[#141920]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose Our Platform?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#ff6b00] rounded-lg mx-auto mb-4 flex items-center justify-center">
                <TrendingUp size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Real-Time Data</h3>
              <p className="text-gray-400">
                Live market data from major exchanges with millisecond precision.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#ff6b00] rounded-lg mx-auto mb-4 flex items-center justify-center">
                <BarChart3 size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Advanced Charts</h3>
              <p className="text-gray-400">
                Professional trading tools with advanced technical indicators.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#ff6b00] rounded-lg mx-auto mb-4 flex items-center justify-center">
                <Shield size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Risk-Free Demo</h3>
              <p className="text-gray-400">
                Practice with $500,000 virtual balance without any risk.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#ff6b00] rounded-lg mx-auto mb-4 flex items-center justify-center">
                <Zap size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Lightning Fast</h3>
              <p className="text-gray-400">
                Ultra-low latency execution for optimal trading performance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trading Stats Section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-[#ff6b00] mb-2">500K+</div>
              <div className="text-gray-400">Demo Balance</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#ff6b00] mb-2">100+</div>
              <div className="text-gray-400">Trading Instruments</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#ff6b00] mb-2">0.1s</div>
              <div className="text-gray-400">Average Execution Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-[#141920]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Start Your Trading Journey?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Join thousands of traders who trust our platform for their trading needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/signup"
              className="bg-[#ff6b00] hover:bg-[#e55a00] text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors"
            >
              Create Free Account
            </Link>
            <Link 
              href="/login"
              className="bg-[#1a1f26] hover:bg-[#2a3441] text-white px-8 py-4 rounded-lg font-bold text-lg border border-[#2a3441] transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}