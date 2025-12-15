'use client';

import { useEffect, useState } from 'react';

interface StockQuoteDisplayProps {
  symbol: string;
  initialPrice?: number;
  initialChangePercent?: number;
}

interface QuoteData {
  price: number;
  changePercent: number;
}

const StockQuoteDisplay = ({ symbol, initialPrice, initialChangePercent }: StockQuoteDisplayProps) => {
  const [quote, setQuote] = useState<QuoteData | null>(
    initialPrice !== undefined && initialChangePercent !== undefined
      ? { price: initialPrice, changePercent: initialChangePercent }
      : null
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_TWELVE_DATA_API_KEY;
    
    // If no Twelve Data API key, fall back to polling with Finnhub
    if (!apiKey) {
      // Poll every 30 seconds using a simple fetch
      const pollInterval = setInterval(async () => {
        try {
          setIsLoading(true);
          const response = await fetch(`/api/stock-quote?symbol=${symbol}`);
          if (response.ok) {
            const data = await response.json();
            if (data.price && data.changePercent !== undefined) {
              setQuote({ price: data.price, changePercent: data.changePercent });
            }
          }
        } catch (error) {
          console.error(`Error fetching quote for ${symbol}:`, error);
        } finally {
          setIsLoading(false);
        }
      }, 30000);

      return () => clearInterval(pollInterval);
    }

    // Use Twelve Data WebSocket for real-time updates
    const wsUrl = `wss://ws.twelvedata.com/v1/quotes/price?apikey=${apiKey}`;
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connect = () => {
      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          // Subscribe to the symbol
          const subscribeMessage = JSON.stringify({
            action: 'subscribe',
            params: {
              symbols: symbol,
            },
          });
          ws?.send(subscribeMessage);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.event === 'price') {
              const price = parseFloat(data.price);
              const changePercent = parseFloat(data.change_percent || '0');
              
              if (!isNaN(price) && !isNaN(changePercent)) {
                setQuote({ price, changePercent });
              }
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

        ws.onclose = () => {
          // Reconnect after 5 seconds
          reconnectTimeout = setTimeout(() => {
            connect();
          }, 5000);
        };
      } catch (error) {
        console.error('Error connecting to WebSocket:', error);
        // Fallback to polling if WebSocket fails
        const pollInterval = setInterval(async () => {
          try {
            setIsLoading(true);
            const response = await fetch(`/api/stock-quote?symbol=${symbol}`);
            if (response.ok) {
              const data = await response.json();
              if (data.price && data.changePercent !== undefined) {
                setQuote({ price: data.price, changePercent: data.changePercent });
              }
            }
          } catch (error) {
            console.error(`Error fetching quote for ${symbol}:`, error);
          } finally {
            setIsLoading(false);
          }
        }, 30000);

        return () => clearInterval(pollInterval);
      }
    };

    connect();

    // Send heartbeat every 10 seconds to keep connection alive
    const heartbeatInterval = setInterval(() => {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ action: 'heartbeat' }));
      }
    }, 10000);

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      if (ws) {
        ws.close();
      }
    };
  }, [symbol]);

  if (!quote && !isLoading) {
    return null;
  }

  const changeColor = quote && quote.changePercent >= 0 ? 'text-green-500' : 'text-red-500';
  const changeSign = quote && quote.changePercent >= 0 ? '+' : '';

  return (
    <div className="text-right">
      {isLoading && !quote ? (
        <div className="text-xs text-gray-500">Loading...</div>
      ) : quote ? (
        <>
          <div className="text-sm font-semibold text-gray-100">
            ${quote.price.toFixed(2)}
          </div>
          <div className={`text-xs font-medium ${changeColor}`}>
            {changeSign}{quote.changePercent.toFixed(2)}%
          </div>
        </>
      ) : null}
    </div>
  );
};

export default StockQuoteDisplay;

