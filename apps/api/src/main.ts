import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { createLogger } from '@ai-platform/logger';

const log = createLogger('APIApp');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: false, // use custom pino logger
    cors: {
      origin: [
        process.env['FRONTEND_URL'] ?? 'http://localhost:3000',
        process.env['ADMIN_URL'] ?? 'http://localhost:3002',
      ],
      credentials: true,
    },
  });

  // Security
  app.use(helmet());

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api/v1');

  const port = process.env['PORT'] ?? 3001;
  await app.listen(port);
  log.info(`API service listening on http://localhost:${port}/api/v1`);
}

bootstrap().catch((err) => {
  console.error('Failed to start API:', err);
  process.exit(1);
});
