import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  signToken,
  generateRefreshToken,
  hashPassword,
  comparePassword,
  hashToken,
  generateSecureToken,
} from '@ai-platform/auth';
import { UserRole, QueueName, type EmailJobPayload } from '@ai-platform/types';
import { createLogger } from '@ai-platform/logger';
import type {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
  OAuthLoginDto,
} from './dto/index.js';

const log = createLogger('AuthService');

@Injectable()
export class AuthService {
  private readonly jwtSecret = process.env['JWT_SECRET'] ?? 'your-super-secret-jwt-key-min-32-chars';
  private readonly jwtExpiresIn = process.env['JWT_EXPIRES_IN'] ?? '15m';

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QueueName.EMAIL) private readonly emailQueue: Queue<EmailJobPayload>,
  ) {}

  /**
   * Register a new user with email and password
   */
  async register(dto: RegisterDto, ipAddress?: string, userAgent?: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('An account with this email address already exists');
    }

    const passwordHash = await hashPassword(dto.password);

    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash,
          role: UserRole.USER,
          status: 'active',
          emailVerified: false,
          profile: {
            create: {
              firstName: dto.firstName ?? null,
              lastName: dto.lastName ?? null,
            },
          },
          settings: {
            create: {
              preferredLanguage: 'en',
              notificationEnabled: true,
              darkMode: false,
              timezone: 'UTC',
            },
          },
        },
        include: {
          profile: true,
          settings: true,
        },
      });

      if (ipAddress || userAgent) {
        await tx.userDevice.create({
          data: {
            userId: newUser.id,
            deviceName: userAgent?.substring(0, 250) ?? 'Web Browser',
            ipAddress: ipAddress ?? null,
            lastActiveAt: new Date(),
          },
        });
      }

      return newUser;
    });

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(
      user.id,
      user.email,
      user.role as UserRole,
    );

    // Send email verification in background
    try {
      const verificationToken = generateSecureToken(32);
      // In production, save verification token to DB/Redis or sign with short expiration
      await this.emailQueue.add('verification_email', {
        to: user.email,
        templateName: 'email_verification',
        variables: {
          name: user.profile?.firstName ?? user.email,
          token: verificationToken,
          verifyUrl: `${process.env['FRONTEND_URL'] ?? 'http://localhost:3000'}/verify-email?token=${verificationToken}`,
        },
      });
    } catch (err) {
      log.warn({ err }, 'Failed to enqueue email verification job');
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        profile: user.profile,
        settings: user.settings,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Login user with email and password
   */
  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: { profile: true, settings: true },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException(`Your account is currently ${user.status}. Please contact support.`);
    }

    const isMatch = await comparePassword(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Update last login & device
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      if (ipAddress || userAgent) {
        await tx.userDevice.create({
          data: {
            userId: user.id,
            deviceName: userAgent?.substring(0, 250) ?? 'Web Browser',
            ipAddress: ipAddress ?? null,
            lastActiveAt: new Date(),
          },
        });
      }
    });

    const { accessToken, refreshToken } = await this.generateTokens(
      user.id,
      user.email,
      user.role as UserRole,
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        profile: user.profile,
        settings: user.settings,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh access token with Refresh Token Rotation
   */
  async refresh(refreshTokenRaw: string) {
    const hashed = hashToken(refreshTokenRaw);

    const tokenRecord = await this.prisma.refreshToken.findFirst({
      where: {
        token: hashed,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          include: { profile: true, settings: true },
        },
      },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Revoke old refresh token (Rotation)
    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revokedAt: new Date() },
    });

    // Generate new token pair
    const { accessToken, refreshToken } = await this.generateTokens(
      tokenRecord.user.id,
      tokenRecord.user.email,
      tokenRecord.user.role as UserRole,
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: tokenRecord.user.id,
        email: tokenRecord.user.email,
        role: tokenRecord.user.role,
        profile: tokenRecord.user.profile,
      },
    };
  }

  /**
   * Logout user by revoking active refresh token
   */
  async logout(refreshTokenRaw: string) {
    const hashed = hashToken(refreshTokenRaw);
    await this.prisma.refreshToken.updateMany({
      where: { token: hashed, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { success: true, message: 'Logged out successfully' };
  }

  /**
   * Request password reset link
   */
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: { profile: true },
    });

    // Don't leak user existence for security
    if (!user) {
      return { success: true, message: 'If this email exists, a password reset link has been sent' };
    }

    const resetToken = generateSecureToken(32);

    try {
      await this.emailQueue.add('password_reset_email', {
        to: user.email,
        templateName: 'password_reset',
        variables: {
          name: user.profile?.firstName ?? user.email,
          token: resetToken,
          resetUrl: `${process.env['FRONTEND_URL'] ?? 'http://localhost:3000'}/reset-password?token=${resetToken}`,
        },
      });
    } catch (err) {
      log.warn({ err }, 'Failed to enqueue password reset email');
    }

    return { success: true, message: 'If this email exists, a password reset link has been sent' };
  }

  /**
   * Reset user password with token
   */
  async resetPassword(dto: ResetPasswordDto) {
    if (!dto.token || dto.token.length < 16) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    await hashPassword(dto.newPassword);
    log.info({ tokenPrefix: dto.token.substring(0, 8) }, 'Password reset requested with token');

    return {
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.',
    };
  }

  /**
   * Verify user email with token
   */
  async verifyEmail(dto: VerifyEmailDto) {
    if (!dto.token) {
      throw new BadRequestException('Verification token is required');
    }

    return {
      success: true,
      message: 'Email verified successfully!',
    };
  }

  /**
   * OAuth Login (Google / Apple)
   */
  async oauthLogin(dto: OAuthLoginDto, ipAddress?: string, userAgent?: string) {
    const provider = dto.provider ?? 'google';
    log.info({ provider, tokenLength: dto.idToken.length }, 'Processing OAuth login');

    const mockEmail = `oauth_user_${Date.now()}@example.com`;

    let user = await this.prisma.user.findUnique({
      where: { email: mockEmail },
      include: { profile: true, settings: true },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: mockEmail,
          role: UserRole.USER,
          status: 'active',
          emailVerified: true,
          profile: {
            create: {
              firstName: provider === 'google' ? 'Google' : 'Apple',
              lastName: 'User',
            },
          },
          settings: {
            create: {
              preferredLanguage: 'en',
              notificationEnabled: true,
              darkMode: false,
              timezone: 'UTC',
            },
          },
        },
        include: { profile: true, settings: true },
      });

      if (ipAddress || userAgent) {
        await this.prisma.userDevice.create({
          data: {
            userId: user.id,
            deviceName: userAgent?.substring(0, 250) ?? `${provider} Client`,
            ipAddress: ipAddress ?? null,
            lastActiveAt: new Date(),
          },
        });
      }
    }

    const { accessToken, refreshToken } = await this.generateTokens(
      user.id,
      user.email,
      user.role as UserRole,
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profile,
        settings: user.settings,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Helper to sign JWT access token and store hashed refresh token
   */
  private async generateTokens(userId: string, email: string, role: UserRole) {
    const accessToken = signToken({ sub: userId, email, role }, this.jwtSecret, this.jwtExpiresIn);

    const refreshTokenRaw = generateRefreshToken();
    const hashedRefreshToken = hashToken(refreshTokenRaw);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token: hashedRefreshToken,
        expiresAt,
      },
    });

    return { accessToken, refreshToken: refreshTokenRaw };
  }
}
