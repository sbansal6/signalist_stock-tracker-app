'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { DannyInsight } from '@/lib/actions/danny-signals.actions';
import { StockQuote } from '@/lib/actions/stock-quotes.actions';
import StockQuoteDisplay from './StockQuoteDisplay';

interface DannySignalsFilterProps {
  insights: DannyInsight[];
  initialQuotes?: Record<string, StockQuote>;
}

const getSignalColor = (signal: string) => {
  const lowerSignal = signal.toLowerCase();
  if (lowerSignal === 'buy') return 'text-green-500';
  if (lowerSignal === 'sell') return 'text-red-500';
  if (lowerSignal === 'hold') return 'text-yellow-500';
  return 'text-gray-400';
};

const getSignalBadgeColor = (signal: string) => {
  const lowerSignal = signal.toLowerCase();
  if (lowerSignal === 'buy') return 'bg-green-500/20 border-green-500/50 text-green-400';
  if (lowerSignal === 'sell') return 'bg-red-500/20 border-red-500/50 text-red-400';
  if (lowerSignal === 'hold') return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400';
  return 'bg-gray-600/20 border-gray-600/50 text-gray-400';
};

const DannySignalsFilter = ({ insights, initialQuotes = {} }: DannySignalsFilterProps) => {
  const [allBuyFilter, setAllBuyFilter] = useState(false);
  const [shortTermFilter, setShortTermFilter] = useState<string>('all');

  const filteredInsights = useMemo(() => {
    let filtered = [...insights];

    // Filter for stocks with "buy" on all three timeframes
    if (allBuyFilter) {
      filtered = filtered.filter(
        (insight) =>
          insight.short_term_signal.toLowerCase() === 'buy' &&
          insight.medium_term_signal.toLowerCase() === 'buy' &&
          insight.long_term_signal.toLowerCase() === 'buy'
      );
    }

    // Filter by short term signal
    if (shortTermFilter !== 'all') {
      filtered = filtered.filter(
        (insight) => insight.short_term_signal.toLowerCase() === shortTermFilter.toLowerCase()
      );
    }

    return filtered;
  }, [insights, allBuyFilter, shortTermFilter]);

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-100 mb-2">DannySignals</h1>
        <p className="text-gray-400">Stock insights and trading signals across different timeframes</p>
      </div>

      {/* Filter Controls */}
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="all-buy-filter"
            checked={allBuyFilter}
            onChange={(e) => setAllBuyFilter(e.target.checked)}
            className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-yellow-500 focus:ring-yellow-500 focus:ring-2"
          />
          <label htmlFor="all-buy-filter" className="text-sm font-medium text-gray-300 cursor-pointer">
            All Timeframes = Buy
          </label>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="short-term-filter" className="text-sm font-medium text-gray-300">
            Short Term:
          </label>
          <select
            id="short-term-filter"
            value={shortTermFilter}
            onChange={(e) => setShortTermFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-gray-600 bg-gray-800 text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          >
            <option value="all">All</option>
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
            <option value="hold">Hold</option>
          </select>
        </div>

        <div className="text-sm text-gray-400">
          Showing {filteredInsights.length} of {insights.length} stocks
        </div>
      </div>

      {filteredInsights.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No insights match the selected filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInsights.map((insight) => (
            <div
              key={insight._id}
              className="bg-gray-800 border border-gray-600 rounded-lg p-4 hover:border-gray-500 transition-colors flex flex-col"
            >
              <div className="mb-3">
                <div className="flex items-start justify-between mb-3">
                  <Link
                    href={`/stocks/${insight.stock_ticker}`}
                    className="text-xl font-bold text-gray-100 hover:text-yellow-500 transition-colors"
                  >
                    {insight.stock_ticker}
                  </Link>
                  <StockQuoteDisplay 
                    symbol={insight.stock_ticker}
                    initialPrice={initialQuotes[insight.stock_ticker]?.price}
                    initialChangePercent={initialQuotes[insight.stock_ticker]?.changePercent}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className={`px-2 py-1 rounded border text-xs font-medium ${getSignalBadgeColor(insight.short_term_signal)}`}>
                    ST: {insight.short_term_signal.toUpperCase()}
                  </div>
                  <div className={`px-2 py-1 rounded border text-xs font-medium ${getSignalBadgeColor(insight.medium_term_signal)}`}>
                    MT: {insight.medium_term_signal.toUpperCase()}
                  </div>
                  <div className={`px-2 py-1 rounded border text-xs font-medium ${getSignalBadgeColor(insight.long_term_signal)}`}>
                    LT: {insight.long_term_signal.toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <h3 className="text-xs font-medium text-gray-400 mb-2">Signals:</h3>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-xs text-gray-500 block">Short</span>
                    <p className={`text-sm font-semibold ${getSignalColor(insight.short_term_signal)}`}>
                      {insight.short_term_signal.toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Medium</span>
                    <p className={`text-sm font-semibold ${getSignalColor(insight.medium_term_signal)}`}>
                      {insight.medium_term_signal.toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Long</span>
                    <p className={`text-sm font-semibold ${getSignalColor(insight.long_term_signal)}`}>
                      {insight.long_term_signal.toUpperCase()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1">
                <h3 className="text-xs font-medium text-gray-400 mb-2">Summary:</h3>
                <p className="text-sm text-gray-300 leading-relaxed line-clamp-4">{insight.summary}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DannySignalsFilter;

