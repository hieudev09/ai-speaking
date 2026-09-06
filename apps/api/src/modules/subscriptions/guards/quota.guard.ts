import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { SubscriptionsService } from '../subscriptions.service.js';

@Injectable()
export class QuotaGuard implements CanActivate {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.sub) {
      throw new UnauthorizedException('Authentication required');
    }

    const quota = await this.subscriptionsService.getQuotaStatus(user.sub);

    if (!quota.canProceed) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Quota Exceeded',
        message: 'You have reached your daily limit of 10 AI conversations. Upgrade to Premium for unlimited practice!',
        quota,
      });
    }

    return true;
  }
}
