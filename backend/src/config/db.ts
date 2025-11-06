import mongoose from 'mongoose';

/**
 * Establishes connection to MongoDB database
 * Uses MONGODB_URI from environment variables
 */
const connectDB = async (): Promise<void> => {
  try {
    const options = {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000,
    };
    
    const conn = await mongoose.connect(process.env.MONGODB_URI || '', options);
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection errors after initial connection
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });
    
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error instanceof Error ? error.message : String(error)}`);
    console.error('Please check:');
    console.error('1. MongoDB Atlas IP whitelist includes your current IP');
    console.error('2. Database user credentials are correct');
    console.error('3. Network connection is stable');
    process.exit(1);
  }
};

export { connectDB };