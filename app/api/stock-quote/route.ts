import { NextRequest, NextResponse } from 'next/server';
import { getStockQuotes } from '@/lib/actions/stock-quotes.actions';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    const quotes = await getStockQuotes([symbol]);
    const quote = quotes[symbol.toUpperCase()];

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    return NextResponse.json({
      symbol: quote.symbol,
      price: quote.price,
      change: quote.change,
      changePercent: quote.changePercent,
    });
  } catch (error) {
    console.error('Error in stock-quote API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

