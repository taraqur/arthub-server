import { MongoClient } from 'mongodb';

let db;
let client;

const connectDB = async () => {
  if (db) return db;
  try {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const dbName = process.env.MONGODB_URI.split('/').pop().split('?')[0] || 'arthub';
    db = client.db(dbName);
    console.log('MongoDB connected natively');
    return db;
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

export const getDb = () => {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB first.');
  }
  return db;
};

export default connectDB;
