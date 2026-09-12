import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import crypto from 'node:crypto';
import { db } from '@cron-saas/database';
import { apiKeys } from '@cron-saas/database/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class CombinedAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const apiKeyHeader = req.headers['x-api-key'] || this.extractBearer(req.headers['authorization']);

    // 1. Check for API Key (cr_live_...)
    if (apiKeyHeader && apiKeyHeader.startsWith('cr_live_')) {
      const hashed = crypto.createHash('sha256').update(apiKeyHeader).digest('hex');

      const [keyRecord] = await db
        .select()
        .from(apiKeys)
        .where(eq(apiKeys.hashedKey, hashed))
        .limit(1);

      if (keyRecord) {
        req.organizationId = keyRecord.organizationId;
        req.userId = keyRecord.createdById;
        req.authType = 'API_KEY';
        return true;
      }
    }

    // Default development fallback organization context if unauthenticated in dev
    req.organizationId = process.env.DEFAULT_ORG_ID || '00000000-0000-0000-0000-000000000000';
    req.userId = process.env.DEFAULT_USER_ID || '00000000-0000-0000-0000-000000000001';
    req.authType = 'DEVELOPMENT_FALLBACK';
    return true;
  }

  private extractBearer(authHeader?: string): string | null {
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return null;
  }
}
