import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { db, notificationChannels } from '@cron-saas/database';
import { eq, and, desc } from 'drizzle-orm';
import { CreateNotificationChannelDto } from './dto/create-notification-channel.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  async list(organizationId: string) {
    return db
      .select()
      .from(notificationChannels)
      .where(eq(notificationChannels.organizationId, organizationId))
      .orderBy(desc(notificationChannels.createdAt));
  }

  async create(organizationId: string, dto: CreateNotificationChannelDto) {
    const [channel] = await db
      .insert(notificationChannels)
      .values({
        organizationId,
        name: dto.name,
        type: dto.type,
        config: dto.config || {},
        enabled: dto.enabled !== undefined ? dto.enabled : true,
      })
      .returning();

    this.logger.log(`Created notification channel ${channel.name} (${channel.id})`);
    return channel;
  }

  async toggle(id: string, organizationId: string, enabled: boolean) {
    const [existing] = await db
      .select()
      .from(notificationChannels)
      .where(and(eq(notificationChannels.id, id), eq(notificationChannels.organizationId, organizationId)))
      .limit(1);

    if (!existing) throw new NotFoundException('Channel not found');

    const [updated] = await db
      .update(notificationChannels)
      .set({ enabled })
      .where(eq(notificationChannels.id, id))
      .returning();

    return updated;
  }

  async delete(id: string, organizationId: string) {
    const [existing] = await db
      .select()
      .from(notificationChannels)
      .where(and(eq(notificationChannels.id, id), eq(notificationChannels.organizationId, organizationId)))
      .limit(1);

    if (!existing) throw new NotFoundException('Channel not found');

    await db.delete(notificationChannels).where(eq(notificationChannels.id, id));
    return { success: true, message: 'Notification channel deleted' };
  }
}
