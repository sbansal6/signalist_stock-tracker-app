'use client';

import { useEffect, useRef, useState } from 'react';

interface QuoteData {
  price: number;
  changePercent: number;
}

type QuoteUpdateCallback = (symbol: string, quote: QuoteData) => void;

// Singleton WebSocket manager
class TwelveDataWebSocketManager {
  private static instance: TwelveDataWebSocketManager;
  private ws: WebSocket | null = null;
  private subscribers: Map<string, Set<QuoteUpdateCallback>> = new Map();
  private subscribedSymbols: Set<string> = new Set();
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private apiKey: string | null = null;

  private constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_TWELVE_DATA_API_KEY || null;
  }

  static getInstance(): TwelveDataWebSocketManager {
    if (!TwelveDataWebSocketManager.instance) {
      TwelveDataWebSocketManager.instance = new TwelveDataWebSocketManager();
    }
    return TwelveDataWebSocketManager.instance;
  }

  private connect() {
    if (!this.apiKey) {
      console.warn('Twelve Data API key not configured, using polling fallback');
      return;
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const wsUrl = `wss://ws.twelvedata.com/v1/quotes/price?apikey=${this.apiKey}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        // Resubscribe to all symbols
        if (this.subscribedSymbols.size > 0) {
          const subscribeMessage = JSON.stringify({
            action: 'subscribe',
            params: {
              symbols: Array.from(this.subscribedSymbols).join(','),
            },
          });
          this.ws?.send(subscribeMessage);
        }

        // Start heartbeat
        this.heartbeatInterval = setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ action: 'heartbeat' }));
          }
        }, 10000);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.event === 'price') {
            const symbol = data.symbol?.toUpperCase();
            const price = parseFloat(data.price);
            const changePercent = parseFloat(data.change_percent || '0');

            if (symbol && !isNaN(price) && !isNaN(changePercent)) {
              const callbacks = this.subscribers.get(symbol);
              if (callbacks) {
                callbacks.forEach((callback) => {
                  callback(symbol, { price, changePercent });
                });
              }
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.ws.onclose = () => {
        // Reconnect after 5 seconds
        this.reconnectTimeout = setTimeout(() => {
          this.connect();
        }, 5000);
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
    }
  }

  subscribe(symbol: string, callback: QuoteUpdateCallback) {
    const upperSymbol = symbol.toUpperCase();
    
    if (!this.subscribers.has(upperSymbol)) {
      this.subscribers.set(upperSymbol, new Set());
    }
    this.subscribers.get(upperSymbol)!.add(callback);

    // If this is a new symbol, subscribe to it
    if (!this.subscribedSymbols.has(upperSymbol)) {
      this.subscribedSymbols.add(upperSymbol);
      
      if (this.ws?.readyState === WebSocket.OPEN) {
        const subscribeMessage = JSON.stringify({
          action: 'subscribe',
          params: {
            symbols: upperSymbol,
          },
        });
        this.ws.send(subscribeMessage);
      } else {
        this.connect();
      }
    }
  }

  unsubscribe(symbol: string, callback: QuoteUpdateCallback) {
    const upperSymbol = symbol.toUpperCase();
    const callbacks = this.subscribers.get(upperSymbol);
    
    if (callbacks) {
      callbacks.delete(callback);
      
      if (callbacks.size === 0) {
        this.subscribers.delete(upperSymbol);
        this.subscribedSymbols.delete(upperSymbol);
        
        // Unsubscribe from WebSocket if connected
        if (this.ws?.readyState === WebSocket.OPEN && this.subscribedSymbols.size === 0) {
          this.ws.close();
        }
      }
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export function useTwelveDataWebSocket(
  symbol: string,
  onUpdate: (quote: QuoteData) => void,
  initialQuote?: QuoteData
) {
  const [quote, setQuote] = useState<QuoteData | null>(initialQuote || null);
  const managerRef = useRef(TwelveDataWebSocketManager.getInstance());
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    const manager = managerRef.current;
    
    const callback = (sym: string, newQuote: QuoteData) => {
      setQuote(newQuote);
      onUpdateRef.current(newQuote);
    };

    manager.subscribe(symbol, callback);

    return () => {
      manager.unsubscribe(symbol, callback);
    };
  }, [symbol]);

  return quote;
}

