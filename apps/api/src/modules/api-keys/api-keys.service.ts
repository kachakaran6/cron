import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '@cron-saas/database';
import { apiKeys } from '@cron-saas/database/schema';
import { eq, desc } from 'drizzle-orm';
import crypto from 'node:crypto';

@Injectable()
export class ApiKeysService {
  async createApiKey(organizationId: string, createdById: string, name: string) {
    const rawRandom = crypto.randomBytes(24).toString('hex');
    const fullKey = `cr_live_${rawRandom}`;
    const keyPrefix = fullKey.slice(0, 12);
    const hashedKey = crypto.createHash('sha256').update(fullKey).digest('hex');

    const [keyRecord] = await db
      .insert(apiKeys)
      .values({
        organizationId,
        createdById,
        name,
        keyPrefix,
        hashedKey,
      })
      .returning();

    return {
      id: keyRecord.id,
      name: keyRecord.name,
      apiKey: fullKey, // Revealed only once upon creation
      createdAt: keyRecord.createdAt,
    };
  }

  async listApiKeys(organizationId: string) {
    return db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        lastUsedAt: apiKeys.lastUsedAt,
        createdAt: apiKeys.createdAt,
      })
      .from(apiKeys)
      .where(eq(apiKeys.organizationId, organizationId))
      .orderBy(desc(apiKeys.createdAt));
  }

  async revokeApiKey(id: string, organizationId: string) {
    const [deleted] = await db
      .delete(apiKeys)
      .where(eq(apiKeys.id, id))
      .returning();

    if (!deleted) throw new NotFoundException('API Key not found');
    return { success: true, message: 'API key revoked' };
  }
}
