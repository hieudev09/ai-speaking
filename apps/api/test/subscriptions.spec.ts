import { describe, it } from 'node:test';
import assert from 'node:assert';
import { FREE_PLAN_DAILY_LIMIT, UserRole } from '@ai-platform/types';

describe('Subscription & Quota Enforcement Rules', () => {
  function checkQuota(userRole: UserRole, usedToday: number) {
    const isUnlimited = userRole === UserRole.PREMIUM || userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;

    if (isUnlimited) {
      return {
        limit: -1,
        usedToday,
        remaining: -1,
        isUnlimited: true,
        canProceed: true,
      };
    }

    const limit = FREE_PLAN_DAILY_LIMIT;
    const remaining = Math.max(0, limit - usedToday);
    return {
      limit,
      usedToday,
      remaining,
      isUnlimited: false,
      canProceed: remaining > 0,
    };
  }

  it('should allow free users with under 10 sessions today', () => {
    const result = checkQuota(UserRole.USER, 3);
    assert.strictEqual(result.limit, 10);
    assert.strictEqual(result.usedToday, 3);
    assert.strictEqual(result.remaining, 7);
    assert.strictEqual(result.canProceed, true);
  });

  it('should block free users who have reached 10 sessions today', () => {
    const result = checkQuota(UserRole.USER, 10);
    assert.strictEqual(result.remaining, 0);
    assert.strictEqual(result.canProceed, false);
  });

  it('should grant unlimited access to premium users', () => {
    const result = checkQuota(UserRole.PREMIUM, 25);
    assert.strictEqual(result.isUnlimited, true);
    assert.strictEqual(result.limit, -1);
    assert.strictEqual(result.canProceed, true);
  });

  it('should grant unlimited access to admins', () => {
    const result = checkQuota(UserRole.ADMIN, 100);
    assert.strictEqual(result.isUnlimited, true);
    assert.strictEqual(result.canProceed, true);
  });
});
