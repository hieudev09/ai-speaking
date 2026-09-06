import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@ai-platform/prisma';
import { createLogger } from '@ai-platform/logger';

const log = createLogger('PrismaService');

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
      log.info('Connected to PostgreSQL database');
    } catch (err) {
      log.warn({ err }, 'Could not immediately connect to DB (will retry on first query)');
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    log.info('Disconnected from PostgreSQL database');
  }
}
