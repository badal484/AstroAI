import type { Server } from 'node:http';
import { createApp } from './app';
import { env } from './config/env';
import { connectMongo, disconnectMongo } from './lib/mongo';
import { connectRedis, disconnectRedis } from './lib/redis';
import { logger } from './shared/logger';

async function main(): Promise<void> {
  await connectMongo();
  await connectRedis();

  const app = createApp();
  const server: Server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, 'Backend listening');
  });

  registerShutdown(server);
}

function registerShutdown(server: Server): void {
  const shutdown = (signal: string) => {
    logger.info({ signal }, 'Shutting down gracefully');
    server.close(() => {
      void (async () => {
        try {
          await disconnectMongo();
          await disconnectRedis();
          process.exit(0);
        } catch (error) {
          logger.error({ err: error }, 'Error during shutdown');
          process.exit(1);
        }
      })();
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((error: unknown) => {
  logger.fatal({ err: error }, 'Failed to start backend');
  process.exit(1);
});
