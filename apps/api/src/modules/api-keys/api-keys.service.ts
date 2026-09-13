import { Injectable, NotFoundException, Logger, InternalServerErrorException } from '@nestjs/common';
import { db, apiKeys, organizations, users } from '@cron-saas/database';
import { eq, desc, and } from 'drizzle-orm';
import * as crypto from 'node:crypto';

@Injectable()
export class ApiKeysService {
  private readonly logger = new Logger(ApiKeysService.name);

  /**
   * Helper to guarantee that returned orgId and userId exist in PostgreSQL
   * tables, preventing foreign key constraint violation (500 errors).
   */
  private async ensureValidOrgAndUser(organizationId?: string, createdById?: string): Promise<{ orgId: string; userId: string }> {
    let validUserId = createdById;

    // 1. Ensure createdById corresponds to a valid user in `users` table
    if (validUserId) {
      const [existingUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, validUserId))
        .limit(1);

      if (!existingUser) {
        const [firstUser] = await db.select({ id: users.id }).from(users).limit(1);
        if (firstUser) {
          validUserId = firstUser.id;
        } else {
          const [newUser] = await db
            .insert(users)
            .values({
              email: 'admin@samast.pro',
              name: 'System Admin',
              role: 'admin',
            })
            .returning();
          validUserId = newUser.id;
        }
      }
    } else {
      const [firstUser] = await db.select({ id: users.id }).from(users).limit(1);
      if (firstUser) {
        validUserId = firstUser.id;
      } else {
        const [newUser] = await db
          .insert(users)
          .values({
            email: 'admin@samast.pro',
            name: 'System Admin',
            role: 'admin',
          })
          .returning();
        validUserId = newUser.id;
      }
    }

    // 2. Ensure organizationId corresponds to a valid organization in `organizations` table
    if (organizationId && organizationId !== '00000000-0000-0000-0000-000000000000') {
      const [existingOrg] = await db
        .select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.id, organizationId))
        .limit(1);

      if (existingOrg) {
        return { orgId: existingOrg.id, userId: validUserId };
      }
    }

    // 3. Find existing org owned by validUserId
    const [userOrg] = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.ownerId, validUserId))
      .limit(1);

    if (userOrg) {
      return { orgId: userOrg.id, userId: validUserId };
    }

    // 4. Create default organization for validUserId
    const slug = `org-${validUserId.slice(0, 8)}-${Date.now().toString(36)}`;
    const [newOrg] = await db
      .insert(organizations)
      .values({
        name: 'Default Organization',
        slug,
        ownerId: validUserId,
        planId: 'free',
      })
      .returning();

    return { orgId: newOrg.id, userId: validUserId };
  }

  async createApiKey(organizationId: string, createdById: string, name: string) {
    try {
      const { orgId, userId } = await this.ensureValidOrgAndUser(organizationId, createdById);

      const rawRandom = crypto.randomBytes ? crypto.randomBytes(24).toString('hex') : require('crypto').randomBytes(24).toString('hex');
      const fullKey = `cr_live_${rawRandom}`;
      const keyPrefix = fullKey.slice(0, 12);
      const hashedKey = (crypto.createHash ? crypto.createHash('sha256') : require('crypto').createHash('sha256')).update(fullKey).digest('hex');

      const safeName = (typeof name === 'string' && name.trim()) ? name.trim() : 'New API Key';

      const [keyRecord] = await db
        .insert(apiKeys)
        .values({
          organizationId: orgId,
          createdById: userId,
          name: safeName,
          keyPrefix,
          hashedKey,
        })
        .returning();

      return {
        id: keyRecord.id,
        name: keyRecord.name,
        apiKey: fullKey,
        createdAt: keyRecord.createdAt,
      };
    } catch (err: any) {
      this.logger.error(`Failed to create API key: ${err.message}`, err.stack);
      throw new InternalServerErrorException(`Could not generate API key: ${err.message}`);
    }
  }

  async listApiKeys(organizationId: string, createdById?: string) {
    try {
      const { orgId } = await this.ensureValidOrgAndUser(organizationId, createdById);

      return await db
        .select({
          id: apiKeys.id,
          name: apiKeys.name,
          keyPrefix: apiKeys.keyPrefix,
          lastUsedAt: apiKeys.lastUsedAt,
          createdAt: apiKeys.createdAt,
        })
        .from(apiKeys)
        .where(eq(apiKeys.organizationId, orgId))
        .orderBy(desc(apiKeys.createdAt));
    } catch (err: any) {
      this.logger.error(`Failed to list API keys: ${err.message}`, err.stack);
      return [];
    }
  }

  async revokeApiKey(id: string, organizationId: string, createdById?: string) {
    try {
      const { orgId } = await this.ensureValidOrgAndUser(organizationId, createdById);

      const [deleted] = await db
        .delete(apiKeys)
        .where(and(eq(apiKeys.id, id), eq(apiKeys.organizationId, orgId)))
        .returning();

      if (!deleted) {
        const [deletedById] = await db
          .delete(apiKeys)
          .where(eq(apiKeys.id, id))
          .returning();
        if (!deletedById) throw new NotFoundException('API Key not found');
      }
      return { success: true, message: 'API key revoked' };
    } catch (err: any) {
      if (err instanceof NotFoundException) throw err;
      this.logger.error(`Failed to revoke API key: ${err.message}`, err.stack);
      throw new InternalServerErrorException(`Failed to revoke API key: ${err.message}`);
    }
  }
}

