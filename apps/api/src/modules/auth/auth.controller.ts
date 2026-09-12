import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new account' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.name, dto.email, dto.password);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email & password' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Get('google')
  @ApiOperation({ summary: 'Redirect to Google OAuth consent screen' })
  async googleRedirect(@Res() res: Response) {
    const url = this.authService.getGoogleAuthUrl();
    return res.redirect(url);
  }

  @Get('google/callback')
  @ApiOperation({ summary: 'Handle Google OAuth callback code' })
  async googleCallback(@Query('code') code: string, @Res() res: Response) {
    try {
      const result = await this.authService.handleGoogleCallback(code);
      const frontendUrl = process.env.FRONTEND_URL || 'https://cron.samast.pro';
      return res.redirect(`${frontendUrl}/oauth-callback?token=${result.token}`);
    } catch (err: any) {
      const frontendUrl = process.env.FRONTEND_URL || 'https://cron.samast.pro';
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(err.message || 'Google OAuth failed')}`);
    }
  }

  @Get('github')
  @ApiOperation({ summary: 'Redirect to GitHub OAuth consent screen' })
  async githubRedirect(@Res() res: Response) {
    const url = this.authService.getGithubAuthUrl();
    return res.redirect(url);
  }

  @Get('github/callback')
  @ApiOperation({ summary: 'Handle GitHub OAuth callback code' })
  async githubCallback(@Query('code') code: string, @Res() res: Response) {
    try {
      const result = await this.authService.handleGithubCallback(code);
      const frontendUrl = process.env.FRONTEND_URL || 'https://cron.samast.pro';
      return res.redirect(`${frontendUrl}/oauth-callback?token=${result.token}`);
    } catch (err: any) {
      const frontendUrl = process.env.FRONTEND_URL || 'https://cron.samast.pro';
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(err.message || 'GitHub OAuth failed')}`);
    }
  }

  @Post('oauth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate via Google or GitHub OAuth' })
  async oauth(@Body() body: { provider: 'google' | 'github'; email: string; name?: string; providerId?: string; image?: string }) {
    if (!body.email) {
      throw new UnauthorizedException('Email is required for OAuth authentication');
    }
    return this.authService.oauthLogin(body);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('dashboard-jwt')
  @ApiOperation({ summary: 'Get current authenticated user' })
  async me(@Req() req: any) {
    return this.authService.getMe(req.userId);
  }
}
