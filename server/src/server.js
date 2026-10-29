const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');
const { PORT } = require('./config/config');

let server;

const startServer = async () => {
  try {
    await connectDB();
    server = app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`  Insurance Claim Automation API Server Started`);
      console.log(`  Listening on port: ${PORT}`);
      console.log(`  API Base URL: http://localhost:${PORT}/api`);
      console.log(`  Health Check: http://localhost:${PORT}/api/health`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('Fatal error starting server:', error);
    process.exit(1);
  }
};

const handleShutdown = async (signal) => {
  console.log(`\n[Process] Received ${signal}. Gracefully shutting down server...`);
  if (server) {
    server.close(async () => {
      console.log('[Server] HTTP connections closed.');
      await disconnectDB();
      process.exit(0);
    });
  } else {
    await disconnectDB();
    process.exit(0);
  }
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

startServer();

