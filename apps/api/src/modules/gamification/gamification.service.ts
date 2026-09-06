import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type {
  UserStreakDto,
  UserAchievementDto,
} from '@ai-platform/types';
import { createLogger } from '@ai-platform/logger';

const log = createLogger('GamificationService');

@Injectable()
export class GamificationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper to normalize a date to YYYY-MM-DD string
   */
  private toDateString(date: Date): string {
    return date.toISOString().split('T')[0]!;
  }

  /**
   * Helper to calculate date difference in calendar days
   */
  private daysDiff(date1Str: string, date2Str: string): number {
    const d1 = new Date(date1Str + 'T00:00:00Z');
    const d2 = new Date(date2Str + 'T00:00:00Z');
    const diffMs = d2.getTime() - d1.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Get user's current streak information
   */
  async getStreak(userId: string): Promise<UserStreakDto> {
    let streak = await this.prisma.userStreak.findUnique({
      where: { userId },
    });

    if (!streak) {
      streak = await this.prisma.userStreak.create({
        data: {
          userId,
          currentStreak: 0,
          longestStreak: 0,
          lastActivityDate: null,
        },
      });
    }

    const todayStr = this.toDateString(new Date());
    let isActiveToday = false;
    let streakStatus: 'active' | 'pending' | 'at_risk' | 'broken' = 'pending';

    if (streak.lastActivityDate) {
      const lastActStr = this.toDateString(streak.lastActivityDate);
      const diff = this.daysDiff(lastActStr, todayStr);

      if (diff === 0) {
        isActiveToday = true;
        streakStatus = 'active';
      } else if (diff === 1) {
        isActiveToday = false;
        streakStatus = 'pending';
      } else if (diff === 2) {
        isActiveToday = false;
        streakStatus = 'at_risk';
      } else {
        isActiveToday = false;
        streakStatus = 'broken';
      }
    } else {
      streakStatus = 'pending';
    }

    return {
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      lastActivityDate: streak.lastActivityDate ? this.toDateString(streak.lastActivityDate) : null,
      isActiveToday,
      streakStatus,
    };
  }

  /**
   * Record practice activity (conversation, assessment, or lesson completion)
   */
  async recordActivity(userId: string): Promise<{
    streak: UserStreakDto;
    newlyUnlocked: UserAchievementDto[];
  }> {
    const today = new Date();
    const todayStr = this.toDateString(today);

    let streak = await this.prisma.userStreak.findUnique({
      where: { userId },
    });

    if (!streak) {
      streak = await this.prisma.userStreak.create({
        data: {
          userId,
          currentStreak: 1,
          longestStreak: 1,
          lastActivityDate: today,
        },
      });
    } else {
      const lastActStr = streak.lastActivityDate ? this.toDateString(streak.lastActivityDate) : null;

      if (lastActStr === todayStr) {
        // Already practiced today, keep streak
        streak = await this.prisma.userStreak.update({
          where: { userId },
          data: { updatedAt: new Date() },
        });
      } else if (lastActStr && this.daysDiff(lastActStr, todayStr) === 1) {
        // Practiced yesterday, increment streak
        const newCurrent = streak.currentStreak + 1;
        const newLongest = Math.max(newCurrent, streak.longestStreak);

        streak = await this.prisma.userStreak.update({
          where: { userId },
          data: {
            currentStreak: newCurrent,
            longestStreak: newLongest,
            lastActivityDate: today,
          },
        });
      } else {
        // Gap of 2 or more days, reset streak to 1
        const newCurrent = 1;
        const newLongest = Math.max(newCurrent, streak.longestStreak);

        streak = await this.prisma.userStreak.update({
          where: { userId },
          data: {
            currentStreak: newCurrent,
            longestStreak: newLongest,
            lastActivityDate: today,
          },
        });
      }
    }

    // Check achievement conditions
    const newlyUnlocked = await this.checkAndUnlockAchievements(userId, streak.currentStreak, streak.longestStreak);

    const updatedStreakDto = await this.getStreak(userId);
    return { streak: updatedStreakDto, newlyUnlocked };
  }

  /**
   * Get all achievements and user unlock status
   */
  async getAchievements(userId: string): Promise<UserAchievementDto[]> {
    const [allAchievements, userAchievements, totalConvs, streak] = await Promise.all([
      this.prisma.achievement.findMany(),
      this.prisma.userAchievement.findMany({
        where: { userId },
        include: { achievement: true },
      }),
      this.prisma.conversation.count({ where: { userId } }),
      this.getStreak(userId),
    ]);

    const unlockedMap = new Map<string, Date>();
    for (const ua of userAchievements) {
      unlockedMap.set(ua.achievementId, ua.unlockedAt);
    }

    return allAchievements.map((ach) => {
      const isUnlocked = unlockedMap.has(ach.id);
      const unlockedAt = unlockedMap.get(ach.id);

      // Calculate progress percentage
      let progress = 0;
      const cond = (ach.condition as Record<string, any>) || {};

      if (isUnlocked) {
        progress = 100;
      } else if (cond.type === 'conversation_count') {
        const target = Number(cond.value) || 1;
        progress = Math.min(100, Math.round((totalConvs / target) * 100));
      } else if (cond.type === 'streak_days') {
        const target = Number(cond.value) || 1;
        const best = Math.max(streak.currentStreak, streak.longestStreak);
        progress = Math.min(100, Math.round((best / target) * 100));
      } else {
        progress = 0;
      }

      return {
        id: ach.id,
        achievementId: ach.id,
        title: ach.title,
        description: ach.description,
        iconUrl: ach.iconUrl,
        isUnlocked,
        unlockedAt: unlockedAt ? unlockedAt.toISOString() : '',
        progress,
      };
    });
  }

  /**
   * Check and unlock achievements
   */
  async checkAndUnlockAchievements(
    userId: string,
    currentStreak?: number,
    longestStreak?: number,
  ): Promise<UserAchievementDto[]> {
    const userAchievements = await this.prisma.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true },
    });
    const unlockedIds = new Set(userAchievements.map((u) => u.achievementId));

    const lockedAchievements = await this.prisma.achievement.findMany({
      where: {
        id: { notIn: Array.from(unlockedIds) },
      },
    });

    if (lockedAchievements.length === 0) {
      return [];
    }

    // Query user metrics
    const [totalConvs, totalAssessments] = await Promise.all([
      this.prisma.conversation.count({ where: { userId } }),
      this.prisma.assessment.count({ where: { userId } }),
    ]);

    let streakCurrent = currentStreak;
    let streakLongest = longestStreak;
    if (streakCurrent === undefined || streakLongest === undefined) {
      const s = await this.prisma.userStreak.findUnique({ where: { userId } });
      streakCurrent = s?.currentStreak ?? 0;
      streakLongest = s?.longestStreak ?? 0;
    }

    const newlyUnlocked: UserAchievementDto[] = [];

    for (const ach of lockedAchievements) {
      const cond = (ach.condition as Record<string, any>) || {};
      let shouldUnlock = false;

      if (cond.type === 'conversation_count') {
        const target = Number(cond.value) || 1;
        if (totalConvs >= target) {
          shouldUnlock = true;
        }
      } else if (cond.type === 'streak_days') {
        const target = Number(cond.value) || 1;
        if (streakCurrent >= target || streakLongest >= target) {
          shouldUnlock = true;
        }
      } else if (cond.type === 'speaking_count') {
        const target = Number(cond.value) || 1;
        if (totalAssessments >= target) {
          shouldUnlock = true;
        }
      }

      if (shouldUnlock) {
        try {
          const unlocked = await this.prisma.userAchievement.create({
            data: {
              userId,
              achievementId: ach.id,
            },
            include: { achievement: true },
          });

          // Create in-app celebration notification
          await this.prisma.notification.create({
            data: {
              userId,
              title: `🏆 Achievement Unlocked: ${ach.title}`,
              message: ach.description || `Congratulations! You unlocked the ${ach.title} badge.`,
              type: 'achievement',
            },
          });

          log.info({ userId, achievementId: ach.id, title: ach.title }, 'Unlocked achievement');

          newlyUnlocked.push({
            id: unlocked.id,
            achievementId: ach.id,
            title: ach.title,
            description: ach.description,
            iconUrl: ach.iconUrl,
            unlockedAt: unlocked.unlockedAt.toISOString(),
            isUnlocked: true,
            progress: 100,
          });
        } catch (err) {
          log.warn({ err, achievementId: ach.id }, 'Failed to create user achievement (possible race condition)');
        }
      }
    }

    return newlyUnlocked;
  }
}
