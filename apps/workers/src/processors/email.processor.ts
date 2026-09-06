import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QueueName, type EmailJobPayload } from '@ai-platform/types';
import { createLogger } from '@ai-platform/logger';

const log = createLogger('EmailProcessor');

@Processor(QueueName.EMAIL)
export class EmailProcessor extends WorkerHost {
  async process(job: Job<EmailJobPayload>): Promise<void> {
    const { to, templateName, variables } = job.data;
    log.info({ jobId: job.id, to, templateName }, 'Dispatching transactional email');

    switch (templateName) {
      case 'email_verification': {
        const verifyUrl = variables['verifyUrl'] as string | undefined;
        log.info(
          { to, verifyUrl },
          `[EMAIL DISPATCH] Verification link sent to ${to}: ${verifyUrl}`,
        );
        break;
      }
      case 'password_reset': {
        const resetUrl = variables['resetUrl'] as string | undefined;
        log.info(
          { to, resetUrl },
          `[EMAIL DISPATCH] Password reset link sent to ${to}: ${resetUrl}`,
        );
        break;
      }
      case 'welcome': {
        log.info(
          { to, name: variables['name'] },
          `[EMAIL DISPATCH] Welcome email sent to ${to}`,
        );
        break;
      }
      case 'payment_receipt': {
        const amount = variables['amount'];
        const invoiceNumber = variables['invoiceNumber'];
        const planName = variables['planName'];
        log.info(
          { to, amount, invoiceNumber, planName },
          `[EMAIL DISPATCH] Payment receipt sent to ${to}: Plan ${planName}, Amount $${amount}, Invoice #${invoiceNumber}`,
        );
        break;
      }
      case 'achievement_unlocked': {
        const title = variables['title'];
        log.info(
          { to, title },
          `[EMAIL DISPATCH] Achievement unlock email sent to ${to}: Badge "${title}"`,
        );
        break;
      }
      case 'streak_reminder': {
        const streakDays = variables['streakDays'];
        log.info(
          { to, streakDays },
          `[EMAIL DISPATCH] Streak reminder sent to ${to}: Keep your ${streakDays}-day streak alive!`,
        );
        break;
      }
      default: {
        log.info({ to, templateName, variables }, `[EMAIL DISPATCH] Email sent to ${to}`);
        break;
      }
    }
  }
}
