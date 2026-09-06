import {
  Controller,
  Post,
  Body,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service.js';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
  OAuthLoginDto,
} from './dto/index.js';
import { Public } from './decorators/index.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    const ip = req.ip ?? req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.register(dto, ip, userAgent);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const ip = req.ip ?? req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.login(dto, ip, userAgent);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Public()
  @Post('google')
  @HttpCode(HttpStatus.OK)
  async googleAuth(@Body() dto: OAuthLoginDto, @Req() req: Request) {
    const ip = req.ip ?? req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.oauthLogin({ ...dto, provider: 'google' }, ip, userAgent);
  }

  @Public()
  @Post('apple')
  @HttpCode(HttpStatus.OK)
  async appleAuth(@Body() dto: OAuthLoginDto, @Req() req: Request) {
    const ip = req.ip ?? req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.oauthLogin({ ...dto, provider: 'apple' }, ip, userAgent);
  }
}
