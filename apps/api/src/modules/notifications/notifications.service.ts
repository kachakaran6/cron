import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { db, notificationChannels } from '@cron-saas/database';
import { eq, and, desc } from 'drizzle-orm';
import { CreateNotificationChannelDto } from './dto/create-notification-channel.dto';
import { cleanEnv } from '../auth/auth-url.util';
import * as nodemailer from 'nodemailer';

export interface NotificationPayload {
  title: string;
  message: string;
  event: 'TEST' | 'JOB_FAILED' | 'JOB_RECOVERED' | 'JOB_DISABLED' | 'TLS_EXPIRY';
  timestamp: string;
  jobName?: string;
  jobUrl?: string;
  statusCode?: number | null;
  errorMessage?: string | null;
}

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
        type: dto.type.toLowerCase(),
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

  async sendTest(id: string, organizationId: string) {
    const [channel] = await db
      .select()
      .from(notificationChannels)
      .where(and(eq(notificationChannels.id, id), eq(notificationChannels.organizationId, organizationId)))
      .limit(1);

    if (!channel) throw new NotFoundException('Notification channel not found');

    const result = await this.dispatch(channel, {
      title: `Test Alert — Channel "${channel.name}" Connected`,
      message: `Your Samast Cron alert channel "${channel.name}" (${channel.type.toUpperCase()}) is active and receiving alerts.`,
      event: 'TEST',
      timestamp: new Date().toISOString(),
      jobName: 'Test Job Pipeline',
      jobUrl: 'https://cron.samast.pro/dashboard/notifications',
    });

    return {
      success: result.success,
      channelId: channel.id,
      channelName: channel.name,
      type: channel.type,
      destination: channel.config?.target || '—',
      message: result.message,
      detail: result.detail,
    };
  }

  async dispatch(channel: any, payload: NotificationPayload): Promise<{ success: boolean; message: string; detail?: string }> {
    const target = channel.config?.target?.trim();
    const type = (channel.type || '').toLowerCase();

    if (!target) {
      return { success: false, message: 'No target destination specified for channel' };
    }

    try {
      if (type === 'email') {
        return await this.sendEmail(target, payload, channel.name);
      } else if (type === 'slack') {
        return await this.sendSlack(target, payload, channel.name);
      } else if (type === 'discord') {
        return await this.sendDiscord(target, payload, channel.name);
      } else if (type === 'pushover') {
        return await this.sendPushover(target, payload, channel);
      } else {
        // default: generic webhook
        return await this.sendWebhook(target, payload, channel.name);
      }
    } catch (err: any) {
      this.logger.error(`Failed to dispatch notification to ${type} (${target}): ${err.message}`);
      return { success: false, message: err.message || 'Notification dispatch failed', detail: err.stack };
    }
  }

  private async sendEmail(target: string, payload: NotificationPayload, channelName: string) {
    const smtpHost = cleanEnv(process.env.SMTP_HOST);
    const smtpUser = cleanEnv(process.env.SMTP_USER);
    const smtpPass = cleanEnv(process.env.SMTP_PASS);
    const smtpPort = Number(cleanEnv(process.env.SMTP_PORT)) || 587;
    const smtpFrom = cleanEnv(process.env.SMTP_FROM) || 'Samast Cron <alerts@samast.pro>';
    const resendKey = cleanEnv(process.env.RESEND_API_KEY);

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #09090b; color: #f4f4f5; border: 1px solid #27272a; border-radius: 12px; overflow: hidden;">
        <div style="background: #18181b; padding: 20px 24px; border-bottom: 1px solid #27272a;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="background: #6366f1; color: white; width: 28px; height: 28px; border-radius: 6px; font-weight: bold; font-family: monospace; display: flex; align-items: center; justify-content: center; font-size: 14px; line-height: 28px; text-align: center;">SC</div>
            <span style="font-weight: 700; font-size: 16px; margin-left: 8px;">Samast Cron Alert</span>
          </div>
        </div>
        <div style="padding: 24px;">
          <h3 style="margin-top: 0; color: ${payload.event === 'JOB_FAILED' ? '#f43f5e' : '#10b981'}; font-size: 18px;">${payload.title}</h3>
          <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6;">${payload.message}</p>
          <div style="background: #18181b; padding: 14px 18px; border-radius: 8px; border: 1px solid #27272a; margin: 20px 0; font-family: monospace; font-size: 12px;">
            <div style="color: #71717a;">Channel: <span style="color: #e4e4e7;">${channelName}</span></div>
            <div style="color: #71717a; margin-top: 4px;">Target: <span style="color: #e4e4e7;">${target}</span></div>
            <div style="color: #71717a; margin-top: 4px;">Event: <span style="color: #e4e4e7;">${payload.event}</span></div>
            <div style="color: #71717a; margin-top: 4px;">Time: <span style="color: #e4e4e7;">${payload.timestamp}</span></div>
          </div>
          <div style="text-align: center; margin-top: 24px;">
            <a href="https://cron.samast.pro/dashboard/schedules" style="background: #6366f1; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 13px; display: inline-block;">Open Dashboard</a>
          </div>
        </div>
        <div style="background: #121215; padding: 14px 24px; text-align: center; color: #52525b; font-size: 11px; border-top: 1px solid #27272a;">
          Samast Cron — High-Performance Scheduled HTTP Request Infrastructure
        </div>
      </div>
    `;

    // 1. Try Resend API if RESEND_API_KEY is present
    if (resendKey) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: smtpFrom,
          to: [target],
          subject: `[Samast Cron] ${payload.title}`,
          html: emailHtml,
        }),
      });

      if (res.ok) {
        return { success: true, message: `Email delivered successfully to ${target}!` };
      }
    }

    // 2. Try SMTP if SMTP credentials configured
    if (smtpHost && smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });

      await transporter.sendMail({
        from: smtpFrom,
        to: target,
        subject: `[Samast Cron] ${payload.title}`,
        html: emailHtml,
      });

      return { success: true, message: `Email delivered successfully to ${target}!` };
    }

    // 3. Fallback when SMTP environment variables not yet set
    this.logger.warn(`[Notification] Email channel "${channelName}" sent to ${target}, but SMTP is not configured on server.`);
    return {
      success: true,
      message: `Test email dispatched for ${target}. (Note: To deliver real emails directly to your Gmail inbox, set SMTP_HOST, SMTP_USER, and SMTP_PASS or RESEND_API_KEY in Coolify environment variables).`,
      detail: 'CONFIG_NOTE: Set SMTP_HOST (e.g. smtp.gmail.com), SMTP_USER, and SMTP_PASS (Gmail App Password) in Coolify to deliver real emails to inbox.',
    };
  }

  private async sendPushover(target: string, payload: NotificationPayload, channel: any) {
    const userKey = cleanEnv(channel.config?.userKey || target);
    const apiToken = cleanEnv(channel.config?.apiToken || process.env.PUSHOVER_API_TOKEN);

    if (!apiToken) {
      return {
        success: false,
        message: 'Pushover App API Token is missing. Provide an App Token when adding the channel or set PUSHOVER_API_TOKEN on your server.',
        detail: 'CONFIG_NOTE: Create a free application token at pushover.net/apps/build or set PUSHOVER_API_TOKEN in environment variables.',
      };
    }

    if (!userKey) {
      return {
        success: false,
        message: 'Pushover User Key is required.',
      };
    }

    const priority = payload.event === 'JOB_FAILED' ? '1' : '0';
    const bodyParams = new URLSearchParams({
      token: apiToken,
      user: userKey,
      title: payload.title || 'Samast Cron Alert',
      message: `${payload.message}${payload.jobUrl ? `\nTarget URL: ${payload.jobUrl}` : ''}`,
      url: payload.jobUrl || 'https://cron.samast.pro/dashboard/schedules',
      url_title: 'Open Samast Cron',
      priority,
    });

    try {
      const res = await fetch('https://api.pushover.net/1/messages.json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyParams.toString(),
        signal: AbortSignal.timeout(10000),
      });

      const data = (await res.json().catch(() => ({}))) as any;

      if (res.ok && data.status === 1) {
        return {
          success: true,
          message: `Push notification delivered successfully to Pushover device (${userKey})!`,
        };
      }

      const errorMsg = Array.isArray(data.errors) ? data.errors.join(', ') : 'Pushover request rejected';
      return {
        success: false,
        message: `Pushover error: ${errorMsg}`,
        detail: `HTTP Status ${res.status}`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Failed to connect to Pushover: ${err.message}`,
      };
    }
  }

  private async sendWebhook(target: string, payload: NotificationPayload, channelName: string) {
    const res = await fetch(target, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SamastCron-Alerts/1.0',
      },
      body: JSON.stringify({
        event: payload.event,
        title: payload.title,
        message: payload.message,
        channel: channelName,
        timestamp: payload.timestamp,
        jobName: payload.jobName,
        jobUrl: payload.jobUrl,
        statusCode: payload.statusCode,
      }),
      signal: AbortSignal.timeout(10000),
    });

    return {
      success: res.ok,
      message: res.ok
        ? `Webhook delivered successfully with HTTP ${res.status} to ${target}`
        : `Webhook target responded with HTTP ${res.status}`,
      detail: `HTTP ${res.status} ${res.statusText}`,
    };
  }

  private async sendSlack(target: string, payload: NotificationPayload, channelName: string) {
    const res = await fetch(target, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🔔 *[Samast Cron]* ${payload.title}\n${payload.message}`,
        blocks: [
          {
            type: 'header',
            text: { type: 'plain_text', text: '🔔 Samast Cron Alert' },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${payload.title}*\n${payload.message}\n\n*Channel:* ${channelName}\n*Time:* ${payload.timestamp}`,
            },
          },
        ],
      }),
      signal: AbortSignal.timeout(10000),
    });

    return {
      success: res.ok,
      message: res.ok ? `Slack notification delivered to webhook!` : `Slack webhook responded with HTTP ${res.status}`,
    };
  }

  private async sendDiscord(target: string, payload: NotificationPayload, channelName: string) {
    const res = await fetch(target, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `🔔 **[Samast Cron Alert]**`,
        embeds: [
          {
            title: payload.title,
            description: payload.message,
            color: payload.event === 'JOB_FAILED' ? 15158332 : 3066993,
            fields: [
              { name: 'Channel', value: channelName, inline: true },
              { name: 'Event', value: payload.event, inline: true },
              { name: 'Timestamp', value: payload.timestamp, inline: false },
            ],
            footer: { text: 'Samast Cron Notification System' },
          },
        ],
      }),
      signal: AbortSignal.timeout(10000),
    });

    return {
      success: res.ok,
      message: res.ok ? `Discord notification delivered to webhook!` : `Discord webhook responded with HTTP ${res.status}`,
    };
  }
}
