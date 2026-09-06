import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { GatewayModule } from './gateway.module.js';
import { createLogger } from '@ai-platform/logger';

const log = createLogger('AIGateway');

async function bootstrap() {
  const app = await NestFactory.create(GatewayModule, { logger: false });
  const port = process.env['AI_GATEWAY_PORT'] ?? 3003;
  await app.listen(port);
  log.info(`AI Gateway listening on port ${port}`);
}

bootstrap().catch((err) => {
  console.error('Failed to start AI Gateway:', err);
  process.exit(1);
});
