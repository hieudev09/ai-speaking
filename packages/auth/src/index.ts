import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { UserRole } from '@ai-platform/types';

// ==================== JWT ====================

export interface JwtPayload {
  sub: string;       // user ID
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export const signToken = (
  payload: Omit<JwtPayload, 'iat' | 'exp'>,
  secret: string,
  expiresIn: string = '15m',
): string => jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);

export const verifyToken = (token: string, secret: string): JwtPayload => {
  const decoded = jwt.verify(token, secret);
  return decoded as JwtPayload;
};

export const decodeToken = (token: string): JwtPayload | null => {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
};

// ==================== REFRESH TOKENS ====================

export const generateRefreshToken = (): string =>
  randomBytes(64).toString('hex');

// ==================== RBAC ====================

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [UserRole.GUEST]: ['course:read', 'pricing:read'],
  [UserRole.USER]: [
    'course:read', 'lesson:read', 'conversation:create', 'conversation:read',
    'assessment:read', 'profile:read', 'profile:update', 'notification:read',
  ],
  [UserRole.PREMIUM]: [
    'course:read', 'lesson:read', 'conversation:create', 'conversation:read',
    'assessment:read', 'profile:read', 'profile:update', 'notification:read',
    'conversation:unlimited', 'analytics:advanced', 'roadmap:personalized',
  ],
  [UserRole.ADMIN]: [
    'user:manage', 'course:manage', 'lesson:manage', 'subscription:manage',
    'analytics:admin', 'prompt:manage', 'conversation:read', 'assessment:read',
  ],
  [UserRole.SUPER_ADMIN]: ['*'], // all permissions
};

export const hasPermission = (role: UserRole, action: string): boolean => {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.includes('*') || permissions.includes(action);
};

export const getRolePermissions = (role: UserRole): string[] =>
  ROLE_PERMISSIONS[role] ?? [];

export const isAtLeast = (userRole: UserRole, minRole: UserRole): boolean => {
  const hierarchy = [UserRole.GUEST, UserRole.USER, UserRole.PREMIUM, UserRole.ADMIN, UserRole.SUPER_ADMIN];
  return hierarchy.indexOf(userRole) >= hierarchy.indexOf(minRole);
};

// ==================== PASSWORD HASHING (scrypt) ====================

import { scrypt, timingSafeEqual, createHash } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

/**
 * Hash a plain text password with a unique salt using scrypt (Node.js crypto)
 */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString('hex')}`;
};

/**
 * Verify a plain text password against a stored salt:hash string
 */
export const comparePassword = async (password: string, storedHash: string): Promise<boolean> => {
  try {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;
    const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
    const keyBuffer = Buffer.from(key, 'hex');
    return timingSafeEqual(derivedKey, keyBuffer);
  } catch {
    return false;
  }
};

/**
 * Hash a verification/reset token before saving to database (SHA-256)
 */
export const hashToken = (token: string): string => {
  return createHash('sha256').update(token).digest('hex');
};

/**
 * Generate random URL-safe token (for email verification, password reset)
 */
export const generateSecureToken = (bytes: number = 32): string => {
  return randomBytes(bytes).toString('hex');
};

