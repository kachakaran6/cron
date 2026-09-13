import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { db, users, organizations } from '@cron-saas/database';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

export interface JwtPayload {
  sub: string;
  email: string;
  orgId: string;
  role?: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  private get jwtSecret(): string {
    return process.env.JWT_SECRET || 'samast_cron_jwt_secret_change_in_production_2026';
  }

  signToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, this.jwtSecret, { expiresIn: '30d' });
  }

  verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.jwtSecret) as JwtPayload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async register(name: string, email: string, password: string) {
    const normalized = email.toLowerCase().trim();
    const role = normalized === 'kachakaran6@gmail.com' ? 'admin' : 'user';

    // Check if user already exists
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalized))
      .limit(1);

    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const [user] = await db
      .insert(users)
      .values({
        email: normalized,
        name: name.trim() || normalized.split('@')[0],
        passwordHash,
        role,
        emailVerified: false,
      })
      .returning();

    // Create personal organization for the user
    const slug = normalized.split('@')[0].replace(/[^a-z0-9]/gi, '-').toLowerCase() + '-' + user.id.slice(0, 8);
    const [org] = await db
      .insert(organizations)
      .values({
        name: `${user.name}'s Organization`,
        slug,
        ownerId: user.id,
        planId: role === 'admin' ? 'enterprise' : 'free',
      })
      .returning();

    const token = this.signToken({ sub: user.id, email: user.email, orgId: org.id, role: user.role });

    return {
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      organization: { id: org.id, name: org.name, slug: org.slug, planId: org.planId },
    };
  }

  async login(email: string, password: string) {
    const normalized = email.toLowerCase().trim();

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, normalized))
      .limit(1);

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Auto-upgrade kachakaran6@gmail.com to admin if role is user
    let userRole = user.role;
    if (normalized === 'kachakaran6@gmail.com' && userRole !== 'admin') {
      await db.update(users).set({ role: 'admin' }).where(eq(users.id, user.id));
      userRole = 'admin';
    }

    // Find user's organization
    let [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.ownerId, user.id))
      .limit(1);

    if (!org) {
      // Auto-create personal organization if user registered before orgs table existed
      const slug = normalized.split('@')[0].replace(/[^a-z0-9]/gi, '-').toLowerCase() + '-' + user.id.slice(0, 8);
      const [newOrg] = await db
        .insert(organizations)
        .values({
          name: `${user.name || 'Personal'}'s Organization`,
          slug,
          ownerId: user.id,
          planId: userRole === 'admin' ? 'enterprise' : 'free',
        })
        .returning();
      org = newOrg;
    }

    const token = this.signToken({ sub: user.id, email: user.email, orgId: org.id, role: userRole });

    return {
      token,
      user: { id: user.id, email: user.email, name: user.name, role: userRole },
      organization: { id: org.id, name: org.name, slug: org.slug, planId: org.planId },
    };
  }

  async getMe(userId: string) {
    let [user] = await db
      .select({ id: users.id, email: users.email, name: users.name, role: users.role, createdAt: users.createdAt })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) throw new UnauthorizedException('User not found');

    if (user.email.toLowerCase() === 'kachakaran6@gmail.com' && user.role !== 'admin') {
      await db.update(users).set({ role: 'admin' }).where(eq(users.id, user.id));
      user = { ...user, role: 'admin' };
    }

    let [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.ownerId, userId))
      .limit(1);

    if (!org) {
      const slug = (user.name || 'org').replace(/[^a-z0-9]/gi, '-').toLowerCase() + '-' + userId.slice(0, 8);
      const [newOrg] = await db
        .insert(organizations)
        .values({
          name: `${user.name || 'Personal'}'s Organization`,
          slug,
          ownerId: userId,
          planId: user.role === 'admin' ? 'enterprise' : 'free',
        })
        .returning();
      org = newOrg;
    }

    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      organization: { id: org.id, name: org.name, slug: org.slug, planId: org.planId },
    };
  }

  async oauthLogin(dto: {
    provider: 'google' | 'github';
    email: string;
    name?: string;
    providerId?: string;
    image?: string;
  }) {
    const normalized = dto.email.toLowerCase().trim();
    let [user] = await db.select().from(users).where(eq(users.email, normalized)).limit(1);

    const role = normalized === 'kachakaran6@gmail.com' ? 'admin' : (user?.role || 'user');

    if (!user) {
      const [newUser] = await db
        .insert(users)
        .values({
          email: normalized,
          name: dto.name || normalized.split('@')[0],
          role,
          provider: dto.provider,
          providerId: dto.providerId || `oauth-${Date.now()}`,
          emailVerified: true,
          image: dto.image || null,
        })
        .returning();
      user = newUser;
    } else {
      await db
        .update(users)
        .set({
          provider: dto.provider,
          providerId: dto.providerId || user.providerId,
          role,
          image: dto.image || user.image,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));
    }

    let [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.ownerId, user.id))
      .limit(1);

    if (!org) {
      const slug = normalized.split('@')[0].replace(/[^a-z0-9]/gi, '-').toLowerCase() + '-' + user.id.slice(0, 8);
      const [newOrg] = await db
        .insert(organizations)
        .values({
          name: `${user.name || 'Personal'}'s Organization`,
          slug,
          ownerId: user.id,
          planId: role === 'admin' ? 'enterprise' : 'free',
        })
        .returning();
      org = newOrg;
    }

    const token = this.signToken({ sub: user.id, email: user.email, orgId: org.id, role });

    return {
      token,
      user: { id: user.id, email: user.email, name: user.name, role, image: user.image },
      organization: { id: org.id, name: org.name, slug: org.slug, planId: org.planId },
    };
  }

  private get googleClientId(): string {
    return process.env.GOOGLE_CLIENT_ID || '';
  }

  private get googleClientSecret(): string {
    return process.env.GOOGLE_CLIENT_SECRET || '';
  }

  private get githubClientId(): string {
    return process.env.GITHUB_CLIENT_ID || '';
  }

  private get githubClientSecret(): string {
    return process.env.GITHUB_CLIENT_SECRET || '';
  }

  getGoogleAuthUrl(): string {
    const redirectUri = `${process.env.APP_PUBLIC_URL || 'https://cron.samast.pro'}/api/v1/auth/google/callback`;
    const clientId = this.googleClientId;
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent('openid email profile')}&access_type=offline&prompt=consent`;
  }

  async handleGoogleCallback(code: string) {
    const redirectUri = `${process.env.APP_PUBLIC_URL || 'https://cron.samast.pro'}/api/v1/auth/google/callback`;
    const clientId = this.googleClientId;
    const clientSecret = this.googleClientSecret;

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      throw new UnauthorizedException(tokenData.error_description || 'Failed to exchange Google OAuth authorization code');
    }

    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const userData = await userRes.json();
    if (!userRes.ok || !userData.email) {
      throw new UnauthorizedException('Failed to fetch user profile from Google');
    }

    return this.oauthLogin({
      provider: 'google',
      email: userData.email,
      name: userData.name || userData.email.split('@')[0],
      providerId: userData.sub,
      image: userData.picture || undefined,
    });
  }

  getGithubAuthUrl(): string {
    const redirectUri = `${process.env.APP_PUBLIC_URL || 'https://cron.samast.pro'}/api/v1/auth/github/callback`;
    const clientId = this.githubClientId;
    return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email`;
  }

  async handleGithubCallback(code: string) {
    const redirectUri = `${process.env.APP_PUBLIC_URL || 'https://cron.samast.pro'}/api/v1/auth/github/callback`;
    const clientId = this.githubClientId;
    const clientSecret = this.githubClientSecret;

    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      throw new UnauthorizedException(tokenData.error_description || 'Failed to exchange GitHub OAuth authorization code');
    }

    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'User-Agent': 'Samast-Cron-OAuth',
      },
    });

    const userData = await userRes.json();
    let email = userData.email;

    if (!email) {
      const emailsRes = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'User-Agent': 'Samast-Cron-OAuth',
        },
      });
      const emails = await emailsRes.json();
      if (Array.isArray(emails)) {
        const primary = emails.find((e: any) => e.primary && e.verified) || emails[0];
        if (primary) email = primary.email;
      }
    }

    if (!email) {
      throw new UnauthorizedException('Failed to retrieve primary email address from GitHub account');
    }

    return this.oauthLogin({
      provider: 'github',
      email,
      name: userData.name || userData.login || email.split('@')[0],
      providerId: String(userData.id),
      image: userData.avatar_url || undefined,
    });
  }
}
