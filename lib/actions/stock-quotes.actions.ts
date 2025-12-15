'use server';

import { fetchJSON } from './finnhub.actions';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const NEXT_PUBLIC_FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? '';

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

export async function getStockQuotes(symbols: string[]): Promise<Record<string, StockQuote>> {
  try {
    const token = process.env.FINNHUB_API_KEY ?? NEXT_PUBLIC_FINNHUB_API_KEY;
    if (!token) {
      console.error('FINNHUB API key is not configured');
      return {};
    }

    const quotes: Record<string, StockQuote> = {};

    // Fetch quotes for all symbols in parallel
    await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const url = `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&token=${token}`;
          const data = await fetchJSON<any>(url, 60); // Cache for 60 seconds
          
          if (data && typeof data.c === 'number' && typeof data.d === 'number' && typeof data.dp === 'number') {
            quotes[symbol] = {
              symbol: symbol.toUpperCase(),
              price: data.c, // current price
              change: data.d, // change amount
              changePercent: data.dp, // change percent
            };
          }
        } catch (error) {
          console.error(`Error fetching quote for ${symbol}:`, error);
        }
      })
    );

    return quotes;
  } catch (error) {
    console.error('Error fetching stock quotes:', error);
    return {};
  }
}

