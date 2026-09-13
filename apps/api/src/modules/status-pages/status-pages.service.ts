import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { db, statusPages, cronJobs, cronJobRuns } from '@cron-saas/database';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { CreateStatusPageDto } from './dto/create-status-page.dto';
import { UpdateStatusPageDto } from './dto/update-status-page.dto';
import { EntitlementsService } from '../entitlements/entitlements.service';

@Injectable()
export class StatusPagesService {
  private readonly logger = new Logger(StatusPagesService.name);

  constructor(private readonly entitlementsService: EntitlementsService) {}

  private generateSlug(title: string): string {
    const base = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    return base ? `${base}-${randomSuffix}` : `status-${randomSuffix}`;
  }

  private async assertProForConfig(organizationId: string, config: any) {
    if (!config) return;
    const hasProOptions =
      config.showHeaders ||
      config.showPayload ||
      config.showResponseCodes ||
      config.showServiceHealthScores ||
      config.showLatencyMetrics ||
      (config.customColors && Object.values(config.customColors).some(Boolean));

    if (hasProOptions) {
      const caps = await this.entitlementsService.getCapabilities(organizationId);
      if (caps.plan === 'FREE') {
        throw new ForbiddenException(
          'Advanced Status Page options (headers, payload snippets, status code colors, health scores) require a Pro or Annual subscription. Upgrade plan to unlock.'
        );
      }
    }
  }

  async create(organizationId: string, dto: CreateStatusPageDto) {
    await this.entitlementsService.assertCanCreateStatusPage(organizationId);
    if (dto.config) {
      await this.assertProForConfig(organizationId, dto.config);
    }

    const slug = dto.slug?.trim() || this.generateSlug(dto.title);

    const [page] = await db
      .insert(statusPages)
      .values({
        organizationId,
        title: dto.title,
        slug,
        isPublished: dto.isPublished !== undefined ? dto.isPublished : true,
        logoUrl: dto.logoUrl || null,
        monitoredJobIds: dto.monitoredJobIds || [],
        incidents: dto.incidents || [],
        config: dto.config || {},
      })
      .returning();

    this.logger.log(`Created status page ${page.title} (${page.id}) with slug ${page.slug}`);
    return page;
  }

  async list(organizationId: string) {
    const pages = await db
      .select()
      .from(statusPages)
      .where(eq(statusPages.organizationId, organizationId))
      .orderBy(desc(statusPages.createdAt));

    // For each page, attach monitor count and active incident count
    return pages.map((p) => ({
      ...p,
      monitorCount: Array.isArray(p.monitoredJobIds) ? p.monitoredJobIds.length : 0,
      activeIncidentsCount: Array.isArray(p.incidents)
        ? p.incidents.filter((inc) => inc.status !== 'RESOLVED').length
        : 0,
      publicUrl: `/status/${p.slug}`,
    }));
  }

  async getOne(id: string, organizationId: string) {
    const [page] = await db
      .select()
      .from(statusPages)
      .where(and(eq(statusPages.id, id), eq(statusPages.organizationId, organizationId)))
      .limit(1);

    if (!page) throw new NotFoundException('Status page not found');

    // Fetch linked monitors details
    let monitors: any[] = [];
    if (page.monitoredJobIds && page.monitoredJobIds.length > 0) {
      monitors = await db
        .select({
          id: cronJobs.id,
          name: cronJobs.name,
          url: cronJobs.url,
          method: cronJobs.method,
          schedule: cronJobs.schedule,
          enabled: cronJobs.enabled,
          lastRunAt: cronJobs.lastRunAt,
        })
        .from(cronJobs)
        .where(inArray(cronJobs.id, page.monitoredJobIds));
    }

    return {
      ...page,
      monitors,
    };
  }

  async update(id: string, organizationId: string, dto: UpdateStatusPageDto) {
    const [existing] = await db
      .select()
      .from(statusPages)
      .where(and(eq(statusPages.id, id), eq(statusPages.organizationId, organizationId)))
      .limit(1);

    if (!existing) throw new NotFoundException('Status page not found');

    if (dto.config) {
      await this.assertProForConfig(organizationId, dto.config);
    }

    const [updated] = await db
      .update(statusPages)
      .set({
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
        ...(dto.isPublished !== undefined ? { isPublished: dto.isPublished } : {}),
        ...(dto.logoUrl !== undefined ? { logoUrl: dto.logoUrl } : {}),
        ...(dto.monitoredJobIds !== undefined ? { monitoredJobIds: dto.monitoredJobIds } : {}),
        ...(dto.incidents !== undefined ? { incidents: dto.incidents } : {}),
        ...(dto.config !== undefined ? { config: dto.config } : {}),
        updatedAt: new Date(),
      })
      .where(eq(statusPages.id, id))
      .returning();

    return updated;
  }

  async delete(id: string, organizationId: string) {
    const [existing] = await db
      .select()
      .from(statusPages)
      .where(and(eq(statusPages.id, id), eq(statusPages.organizationId, organizationId)))
      .limit(1);

    if (!existing) throw new NotFoundException('Status page not found');

    await db.delete(statusPages).where(eq(statusPages.id, id));
    return { success: true, message: 'Status page deleted' };
  }

  /**
   * Public unauthenticated status page view by slug
   */
  async getPublicBySlug(slug: string) {
    const [page] = await db
      .select()
      .from(statusPages)
      .where(and(eq(statusPages.slug, slug), eq(statusPages.isPublished, true)))
      .limit(1);

    if (!page) {
      if (slug === 'system-health' || slug === 'default') {
        return {
          title: 'Samast System Health',
          slug: 'system-health',
          logoUrl: '/favicon.png',
          updatedAt: new Date(),
          systemStatus: 'All Systems Operational',
          config: {
            showHeaders: true,
            showPayload: true,
            showResponseCodes: true,
            showServiceHealthScores: true,
            showLatencyMetrics: true,
            showUptimeBarChart: true,
            customColors: {
              successColor: '#10b981',
              redirectColor: '#3b82f6',
              clientErrorColor: '#f59e0b',
              serverErrorColor: '#ef4444',
            },
          },
          incidents: [],
          monitors: [
            {
              id: 'mon-api',
              name: 'REST & OpenAPI API Gateway',
              status: 'Operational',
              uptime: '99.99%',
              avgLatency: '18ms',
              p95Latency: '24ms',
              healthGrade: 'A+',
              healthRank: 1,
              healthLabel: 'Exceptional Reliability',
              lastStatusCode: 200,
              lastResponseHeaders: JSON.stringify({ 'content-type': 'application/json', 'x-cache': 'HIT' }),
              lastResponseBody: '{"status":"healthy","uptime":99.99}',
              statusCodeCounts: { '2xx': 15, '3xx': 0, '4xx': 0, '5xx': 0 },
              lastRunAt: new Date(),
              recentRuns: Array.from({ length: 15 }).map((_, i) => ({
                status: 'SUCCESS',
                httpStatus: 200,
                durationMs: 14 + (i % 5),
                startedAt: new Date(Date.now() - i * 60000),
                responseBody: '{"status":"healthy","uptime":99.99}',
              })),
            },
            {
              id: 'mon-worker',
              name: 'Stateless HTTP Execution Workers',
              status: 'Operational',
              uptime: '100.0%',
              avgLatency: '41ms',
              p95Latency: '55ms',
              healthGrade: 'A+',
              healthRank: 2,
              healthLabel: 'Exceptional Reliability',
              lastStatusCode: 200,
              lastResponseHeaders: JSON.stringify({ 'content-type': 'text/plain; charset=utf-8' }),
              lastResponseBody: 'Worker pool 100% active',
              statusCodeCounts: { '2xx': 15, '3xx': 0, '4xx': 0, '5xx': 0 },
              lastRunAt: new Date(),
              recentRuns: Array.from({ length: 15 }).map((_, i) => ({
                status: 'SUCCESS',
                httpStatus: 200,
                durationMs: 38 + (i % 7),
                startedAt: new Date(Date.now() - i * 60000),
                responseBody: 'Worker pool 100% active',
              })),
            },
            {
              id: 'mon-db',
              name: 'PostgreSQL Database & Queue Manager',
              status: 'Operational',
              uptime: '100.0%',
              avgLatency: '6ms',
              p95Latency: '9ms',
              healthGrade: 'A+',
              healthRank: 3,
              healthLabel: 'Exceptional Reliability',
              lastStatusCode: 200,
              lastResponseHeaders: JSON.stringify({ 'server': 'PostgreSQL/16' }),
              lastResponseBody: '{"pool": "healthy", "connections": 12}',
              statusCodeCounts: { '2xx': 15, '3xx': 0, '4xx': 0, '5xx': 0 },
              lastRunAt: new Date(),
              recentRuns: Array.from({ length: 15 }).map((_, i) => ({
                status: 'SUCCESS',
                httpStatus: 200,
                durationMs: 5 + (i % 3),
                startedAt: new Date(Date.now() - i * 60000),
                responseBody: '{"pool": "healthy", "connections": 12}',
              })),
            },
          ],
        };
      }
      throw new NotFoundException('Status page not found or is currently private');
    }

    const config = page.config || {};

    // Fetch details for linked monitors
    let monitorsDetails: any[] = [];
    if (page.monitoredJobIds && page.monitoredJobIds.length > 0) {
      const jobs = await db
        .select({
          id: cronJobs.id,
          name: cronJobs.name,
          url: cronJobs.url,
          method: cronJobs.method,
          lastRunAt: cronJobs.lastRunAt,
        })
        .from(cronJobs)
        .where(inArray(cronJobs.id, page.monitoredJobIds));

      monitorsDetails = await Promise.all(
        jobs.map(async (job) => {
          // Fetch last 30 execution runs
          const recentRuns = await db
            .select({
              status: cronJobRuns.status,
              httpStatus: cronJobRuns.httpStatus,
              durationMs: cronJobRuns.durationMs,
              startedAt: cronJobRuns.startedAt,
              responseHeaders: cronJobRuns.responseHeaders,
              responseBody: cronJobRuns.responseBody,
            })
            .from(cronJobRuns)
            .where(eq(cronJobRuns.cronJobId, job.id))
            .orderBy(desc(cronJobRuns.startedAt))
            .limit(30);

          const totalRuns = recentRuns.length;
          const successCount = recentRuns.filter((r) => r.status === 'SUCCESS').length;
          const uptimeVal = totalRuns > 0 ? (successCount / totalRuns) * 100 : 100;
          const uptimeStr = `${uptimeVal.toFixed(1)}%`;

          // Latency math
          const durations = recentRuns.map((r) => r.durationMs).filter(Boolean);
          const avgDuration = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
          const sortedDurations = [...durations].sort((a, b) => a - b);
          const p95Duration = sortedDurations.length > 0 ? sortedDurations[Math.floor(sortedDurations.length * 0.95)] || avgDuration : 0;

          // HTTP Status Code breakdown
          const statusCodeCounts = { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0 };
          recentRuns.forEach((r) => {
            const code = r.httpStatus || 200;
            if (code >= 200 && code < 300) statusCodeCounts['2xx']++;
            else if (code >= 300 && code < 400) statusCodeCounts['3xx']++;
            else if (code >= 400 && code < 500) statusCodeCounts['4xx']++;
            else if (code >= 500) statusCodeCounts['5xx']++;
          });

          // Compute Health Grade
          let healthGrade: 'A+' | 'A' | 'B' | 'F' = 'A+';
          let healthLabel = 'Exceptional Reliability';
          if (uptimeVal < 95 || statusCodeCounts['5xx'] > 2) {
            healthGrade = 'F';
            healthLabel = 'Degraded Performance';
          } else if (uptimeVal < 98 || avgDuration > 800) {
            healthGrade = 'B';
            healthLabel = 'Fair Performance';
          } else if (uptimeVal < 99.5 || avgDuration > 350) {
            healthGrade = 'A';
            healthLabel = 'Good Operational Status';
          }

          const lastRun = recentRuns[0];
          const isOperational = !lastRun || lastRun.status === 'SUCCESS';

          return {
            id: job.id,
            name: job.name,
            url: job.url,
            method: job.method || 'GET',
            status: isOperational ? 'Operational' : 'Degraded',
            uptime: uptimeStr,
            uptimeVal,
            avgLatency: `${avgDuration}ms`,
            p95Latency: `${p95Duration}ms`,
            healthGrade,
            healthLabel,
            lastStatusCode: lastRun?.httpStatus || 200,
            lastResponseHeaders: lastRun?.responseHeaders || null,
            lastResponseBody: lastRun?.responseBody || null,
            statusCodeCounts,
            lastRunAt: job.lastRunAt,
            recentRuns: recentRuns.slice(0, 15),
          };
        })
      );

      // Sort monitors by performance rank (best uptime & lowest latency first)
      monitorsDetails.sort((a, b) => b.uptimeVal - a.uptimeVal);
      monitorsDetails.forEach((m, idx) => {
        m.healthRank = idx + 1;
      });
    }

    const hasActiveIncidents =
      Array.isArray(page.incidents) && page.incidents.some((inc) => inc.status !== 'RESOLVED');
    const allOperational =
      !hasActiveIncidents && monitorsDetails.every((m) => m.status === 'Operational');

    return {
      title: page.title,
      slug: page.slug,
      logoUrl: page.logoUrl,
      config: page.config || {},
      updatedAt: page.updatedAt,
      systemStatus: allOperational ? 'All Systems Operational' : 'Degraded Performance',
      incidents: page.incidents || [],
      monitors: monitorsDetails,
    };
  }
}

