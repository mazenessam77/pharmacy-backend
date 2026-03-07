import http from 'http';
import app from './app';
import { env } from './config/env';
import { connectDB } from './config/db';
import { initFirebase } from './config/firebase';
import { initSocket } from './socket';
import { logger } from './utils/logger';

const startServer = async (): Promise<void> => {
  // Connect to MongoDB
  await connectDB();

  // Initialize Firebase
  initFirebase();

  // Create HTTP server
  const httpServer = http.createServer(app);

  // Initialize Socket.io
  initSocket(httpServer);

  // Start listening
  httpServer.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    logger.info(`API docs: http://localhost:${env.PORT}/api-docs`);
    logger.info(`Health: http://localhost:${env.PORT}/health`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down gracefully...');
    httpServer.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
  process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Rejection:', err);
  });
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    process.exit(1);
  });
};

startServer();
