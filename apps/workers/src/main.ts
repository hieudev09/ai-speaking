import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { WorkersModule } from './workers.module.js';
import { createLogger } from '@ai-platform/logger';

const log = createLogger('WorkersApp');

async function bootstrap() {
  const app = await NestFactory.create(WorkersModule, { logger: false });
  const port = process.env['WORKERS_PORT'] ?? 3004;
  await app.listen(port);
  log.info(`Workers service listening on port ${port}`);
}

bootstrap().catch((err) => {
  console.error('Failed to start workers:', err);
  process.exit(1);
});
