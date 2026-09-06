import pino from 'pino';

const isDev = process.env['NODE_ENV'] !== 'production';

export const logger = pino({
  level: process.env['LOG_LEVEL'] ?? 'info',
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:HH:MM:ss',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  formatters: {
    level: (label: string) => ({ level: label }),
  },
  base: {
    service: process.env['SERVICE_NAME'] ?? 'ai-platform',
    env: process.env['NODE_ENV'] ?? 'development',
  },
});

export type Logger = typeof logger;

/**
 * Create a child logger with context binding
 * @example const log = createLogger('AuthService');
 */
export const createLogger = (context: string): Logger =>
  logger.child({ context }) as Logger;

export default logger;
