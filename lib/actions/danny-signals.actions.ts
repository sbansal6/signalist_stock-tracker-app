'use server';

import { connectToDatabase } from '@/database/mongoose';

export interface DannyInsight {
  _id: string;
  stock_ticker: string;
  long_term_signal: string;
  medium_term_signal: string;
  short_term_signal: string;
  summary: string;
}

export async function getDannyInsights(): Promise<DannyInsight[]> {
  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error('MongoDB connection not found');

    // Connect to test_db database
    const testDb = mongoose.connection.useDb('test_db');
    const collection = testDb.db.collection('danny_insights');

    // Fetch all documents and sort by stock_ticker
    const documents = await collection
      .find({})
      .sort({ stock_ticker: 1 })
      .toArray();

    // Convert to the expected format
    return documents.map((doc) => ({
      _id: String(doc._id),
      stock_ticker: String(doc.stock_ticker || ''),
      long_term_signal: String(doc.long_term_signal || ''),
      medium_term_signal: String(doc.medium_term_signal || ''),
      short_term_signal: String(doc.short_term_signal || ''),
      summary: String(doc.summary || ''),
    }));
  } catch (err) {
    console.error('getDannyInsights error:', err);
    return [];
  }
}

