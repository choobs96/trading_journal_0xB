import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import rawTrades from '../data.js';
import { enrichTrades } from '../utils/tradeStats.js';

const TradeContext = createContext();

export function TradeProvider({ children }) {
  const [trades, setTrades] = useState(rawTrades);
  const [notes, setNotes] = useState({}); // { [tradeId]: htmlString }

  const enriched = useMemo(() => enrichTrades(trades), [trades]);

  const addTrade = useCallback((trade) => {
    const newTrade = {
      ...trade,
      id: Date.now(),
    };
    setTrades((prev) => [...prev, newTrade]);
    return newTrade.id;
  }, []);

  const deleteTrade = useCallback((id) => {
    setTrades((prev) => prev.filter((t) => t.id !== id));
    setNotes((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const importTrades = useCallback((newTrades) => {
    setTrades((prev) => [...prev, ...newTrades]);
  }, []);

  const updateNote = useCallback((tradeId, html) => {
    setNotes((prev) => ({ ...prev, [tradeId]: html }));
  }, []);

  const getNote = useCallback((tradeId) => notes[tradeId] || '', [notes]);

  return (
    <TradeContext.Provider
      value={{ trades, enriched, addTrade, deleteTrade, importTrades, updateNote, getNote }}
    >
      {children}
    </TradeContext.Provider>
  );
}

export function useTrades() {
  const ctx = useContext(TradeContext);
  if (!ctx) throw new Error('useTrades must be used within TradeProvider');
  return ctx;
}
