import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { UpdateProfileDto, UpdateSettingsDto } from './dto/index.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get current user profile and settings
   */
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        settings: true,
        streak: true,
        subscriptions: {
          where: { status: 'active' },
          include: { plan: true },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  /**
   * Update user profile information
   */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const profile = await this.prisma.userProfile.upsert({
      where: { userId },
      update: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        avatarUrl: dto.avatarUrl,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        country: dto.country,
        nativeLanguage: dto.nativeLanguage,
        englishLevel: dto.englishLevel,
        learningGoal: dto.learningGoal,
      },
      create: {
        userId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        avatarUrl: dto.avatarUrl,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        country: dto.country,
        nativeLanguage: dto.nativeLanguage,
        englishLevel: dto.englishLevel,
        learningGoal: dto.learningGoal,
      },
    });

    return profile;
  }

  /**
   * Get user settings
   */
  async getSettings(userId: string) {
    let settings = await this.prisma.userSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await this.prisma.userSettings.create({
        data: { userId },
      });
    }

    return settings;
  }

  /**
   * Update user settings
   */
  async updateSettings(userId: string, dto: UpdateSettingsDto) {
    const settings = await this.prisma.userSettings.upsert({
      where: { userId },
      update: {
        preferredLanguage: dto.preferredLanguage,
        notificationEnabled: dto.notificationEnabled,
        darkMode: dto.darkMode,
        timezone: dto.timezone,
      },
      create: {
        userId,
        preferredLanguage: dto.preferredLanguage ?? 'en',
        notificationEnabled: dto.notificationEnabled ?? true,
        darkMode: dto.darkMode ?? false,
        timezone: dto.timezone ?? 'UTC',
      },
    });

    return settings;
  }

  /**
   * Calculate User Dashboard KPIs and recent learning history
   */
  async getDashboard(userId: string) {
    const [
      user,
      streak,
      totalConversations,
      completedLessons,
      assessments,
      audioStats,
      achievementsCount,
      recentConversations,
    ] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      }),
      this.prisma.userStreak.findUnique({
        where: { userId },
      }),
      this.prisma.conversation.count({
        where: { userId },
      }),
      this.prisma.lessonProgress.count({
        where: { userId, completed: true },
      }),
      this.prisma.assessment.findMany({
        where: { userId },
        select: { overallScore: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.audioFile.aggregate({
        where: { userId },
        _sum: { durationSeconds: true },
      }),
      this.prisma.userAchievement.count({
        where: { userId },
      }),
      this.prisma.conversation.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          _count: { select: { messages: true } },
        },
      }),
    ]);

    // Calculate average score
    const scores = assessments
      .map((a) => (a.overallScore ? Number(a.overallScore) : null))
      .filter((s): s is number => s !== null);

    const averageScore =
      scores.length > 0
        ? Math.round((scores.reduce((sum, val) => sum + val, 0) / scores.length) * 100) / 100
        : null;

    const totalSpeakingMinutes = Math.round(
      (audioStats._sum.durationSeconds ? Number(audioStats._sum.durationSeconds) : 0) / 60,
    );

    return {
      profile: {
        firstName: user?.profile?.firstName,
        lastName: user?.profile?.lastName,
        avatarUrl: user?.profile?.avatarUrl,
        englishLevel: user?.profile?.englishLevel ?? 'Beginner',
        learningGoal: user?.profile?.learningGoal ?? 'Daily Conversation',
      },
      stats: {
        currentStreak: streak?.currentStreak ?? 0,
        longestStreak: streak?.longestStreak ?? 0,
        totalConversations,
        completedLessons,
        averageScore,
        speakingMinutes: totalSpeakingMinutes,
        achievementsUnlocked: achievementsCount,
      },
      recentAssessments: assessments.slice(0, 5),
      recentConversations,
    };
  }
}
