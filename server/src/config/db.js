const mongoose = require('mongoose');
const { MONGODB_URI, USE_MEMORY_DB_FALLBACK, NODE_ENV } = require('./config');

let memoryServer = null;

const connectDB = async (customUri = null) => {
  const uri = customUri || MONGODB_URI;

  try {
    // Attempt connecting to the specified MongoDB instance
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log(`[Database] Connected successfully to MongoDB at: ${uri}`);
    return mongoose.connection;
  } catch (primaryError) {
    if (USE_MEMORY_DB_FALLBACK || NODE_ENV === 'test') {
      console.warn(`[Database] Could not connect to primary MongoDB (${primaryError.message}).`);
      console.log('[Database] Starting in-memory MongoDB instance for development/demonstration...');
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        memoryServer = await MongoMemoryServer.create();
        const memUri = memoryServer.getUri();
        await mongoose.connect(memUri);
        console.log(`[Database] Connected to in-memory MongoDB at: ${memUri}`);
        return mongoose.connection;
      } catch (memError) {
        console.error('[Database] Failed to start in-memory MongoDB:', memError.message);
        throw memError;
      }
    } else {
      console.error(`[Database] Fatal: Unable to connect to MongoDB at ${uri}`);
      throw primaryError;
    }
  }
};

const disconnectDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (memoryServer) {
      await memoryServer.stop();
      memoryServer = null;
    }
    console.log('[Database] Disconnected from MongoDB');
  } catch (err) {
    console.error('[Database] Error disconnecting from database:', err.message);
  }
};

module.exports = { connectDB, disconnectDB };

