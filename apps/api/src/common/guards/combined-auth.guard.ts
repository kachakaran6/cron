import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import * as crypto from 'node:crypto';
import * as jwt from 'jsonwebtoken';
import { db, apiKeys, organizations } from '@cron-saas/database';
import { eq } from 'drizzle-orm';
import { cleanEnv } from '../../modules/auth/auth-url.util';

/**
 * CombinedAuthGuard
 * Supports two auth mechanisms (evaluated in priority order):
 *   1. API Key: X-Api-Key header (cr_live_...) or Authorization: Bearer cr_live_...
 *   2. JWT:     Authorization: Bearer <jwt-token>
 *
 * In production, falls back to 401 if neither is valid.
 * In development (NODE_ENV !== 'production'), falls back to a default org ID.
 */
@Injectable()
export class CombinedAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const apiKeyHeader = req.headers['x-api-key'] || this.extractBearer(req.headers['authorization']);
    const authorizationHeader = req.headers['authorization'];

    // 1. Try API Key
    if (apiKeyHeader && apiKeyHeader.startsWith('cr_live_')) {
      const createHashFn = crypto.createHash || require('crypto').createHash;
      const hashed = createHashFn('sha256').update(apiKeyHeader).digest('hex');

      const [keyRecord] = await db
        .select()
        .from(apiKeys)
        .where(eq(apiKeys.hashedKey, hashed))
        .limit(1);

      if (keyRecord) {
        // Asynchronously update lastUsedAt
        db.update(apiKeys)
          .set({ lastUsedAt: new Date() })
          .where(eq(apiKeys.id, keyRecord.id))
          .catch(() => {});

        req.organizationId = keyRecord.organizationId;
        req.userId = keyRecord.createdById;
        req.authType = 'API_KEY';
        return true;
      }
    }

    // 2. Try JWT Bearer
    const bearerToken = this.extractBearer(authorizationHeader);
    if (bearerToken && !bearerToken.startsWith('cr_live_')) {
      try {
        const jwtSecret = cleanEnv(process.env.JWT_SECRET) || 'samast_cron_jwt_secret_change_in_production_2026';
        const payload = jwt.verify(bearerToken, jwtSecret) as any;
        req.userId = payload.sub || payload.userId;
        req.userEmail = payload.email;
        req.organizationId = payload.orgId || payload.organizationId;
        req.authType = 'JWT';

        // Auto-heal missing, dummy, or non-existent orgId in DB
        let validOrg = null;
        if (req.organizationId && req.organizationId !== '00000000-0000-0000-0000-000000000000' && this.isUuid(req.organizationId)) {
          try {
            [validOrg] = await db
              .select({ id: organizations.id })
              .from(organizations)
              .where(eq(organizations.id, req.organizationId))
              .limit(1);
          } catch {
            validOrg = null;
          }
        }

        if (!validOrg) {
          const userKey = req.userId || 'anon';
          let userOrg = null;
          if (this.isUuid(userKey)) {
            try {
              [userOrg] = await db
                .select({ id: organizations.id })
                .from(organizations)
                .where(eq(organizations.ownerId, userKey))
                .limit(1);
            } catch {
              userOrg = null;
            }
          }

          if (userOrg) {
            req.organizationId = userOrg.id;
          } else {
            const userShort = (userKey || 'user').slice(0, 8);
            const slug = (req.userEmail?.split('@')[0] || 'org')
              .replace(/[^a-z0-9]/gi, '-')
              .toLowerCase() + '-' + Date.now() + '-' + userShort;
            try {
              const [newOrg] = await db
                .insert(organizations)
                .values({
                  name: `${req.userEmail?.split('@')[0] || 'Personal'}'s Organization`,
                  slug,
                  ownerId: this.isUuid(req.userId) ? req.userId : undefined,
                  planId: 'free',
                })
                .returning();
              req.organizationId = newOrg.id;
            } catch {
              // Fallback to any active org in database
              const [anyOrg] = await db.select({ id: organizations.id }).from(organizations).limit(1);
              if (anyOrg) {
                req.organizationId = anyOrg.id;
              }
            }
          }
        }

        return true;
      } catch {
        // Invalid JWT — fall through
      }
    }

    // 3. Development fallback (never expose in production)
    if (process.env.NODE_ENV !== 'production') {
      req.organizationId = process.env.DEFAULT_ORG_ID || '00000000-0000-0000-0000-000000000000';
      req.userId = process.env.DEFAULT_USER_ID || '00000000-0000-0000-0000-000000000001';
      req.authType = 'DEVELOPMENT_FALLBACK';
      return true;
    }

    return false;
  }

  private extractBearer(authHeader?: string): string | null {
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return null;
  }

  private isUuid(val?: string): boolean {
    if (!val) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
  }
}
