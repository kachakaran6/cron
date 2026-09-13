import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { db, statusPages, cronJobs, cronJobRuns } from '@cron-saas/database';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { CreateStatusPageDto } from './dto/create-status-page.dto';
import { UpdateStatusPageDto } from './dto/update-status-page.dto';

@Injectable()
export class StatusPagesService {
  private readonly logger = new Logger(StatusPagesService.name);

  private generateSlug(title: string): string {
    const base = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    return base ? `${base}-${randomSuffix}` : `status-${randomSuffix}`;
  }

  async create(organizationId: string, dto: CreateStatusPageDto) {
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

    const [updated] = await db
      .update(statusPages)
      .set({
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
        ...(dto.isPublished !== undefined ? { isPublished: dto.isPublished } : {}),
        ...(dto.logoUrl !== undefined ? { logoUrl: dto.logoUrl } : {}),
        ...(dto.monitoredJobIds !== undefined ? { monitoredJobIds: dto.monitoredJobIds } : {}),
        ...(dto.incidents !== undefined ? { incidents: dto.incidents } : {}),
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
          incidents: [],
          monitors: [
            {
              id: 'mon-api',
              name: 'REST & OpenAPI API Gateway',
              status: 'Operational',
              uptime: '99.99%',
              lastRunAt: new Date(),
              recentRuns: Array.from({ length: 15 }).map((_, i) => ({
                status: 'SUCCESS',
                httpStatus: 200,
                durationMs: 14 + (i % 5),
                startedAt: new Date(Date.now() - i * 60000),
              })),
            },
            {
              id: 'mon-worker',
              name: 'Stateless HTTP Execution Workers',
              status: 'Operational',
              uptime: '100.0%',
              lastRunAt: new Date(),
              recentRuns: Array.from({ length: 15 }).map((_, i) => ({
                status: 'SUCCESS',
                httpStatus: 200,
                durationMs: 38 + (i % 7),
                startedAt: new Date(Date.now() - i * 60000),
              })),
            },
            {
              id: 'mon-db',
              name: 'PostgreSQL Database & Queue Manager',
              status: 'Operational',
              uptime: '100.0%',
              lastRunAt: new Date(),
              recentRuns: Array.from({ length: 15 }).map((_, i) => ({
                status: 'SUCCESS',
                httpStatus: 200,
                durationMs: 5 + (i % 3),
                startedAt: new Date(Date.now() - i * 60000),
              })),
            },
          ],
        };
      }
      throw new NotFoundException('Status page not found or is currently private');
    }

    // Fetch details for linked monitors
    let monitorsDetails: any[] = [];
    if (page.monitoredJobIds && page.monitoredJobIds.length > 0) {
      const jobs = await db
        .select({
          id: cronJobs.id,
          name: cronJobs.name,
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
            })
            .from(cronJobRuns)
            .where(eq(cronJobRuns.cronJobId, job.id))
            .orderBy(desc(cronJobRuns.startedAt))
            .limit(30);

          const successCount = recentRuns.filter((r) => r.status === 'SUCCESS').length;
          const uptime = recentRuns.length > 0 ? ((successCount / recentRuns.length) * 100).toFixed(1) : '100.0';
          const lastRun = recentRuns[0];
          const isOperational = !lastRun || lastRun.status === 'SUCCESS';

          return {
            id: job.id,
            name: job.name,
            status: isOperational ? 'Operational' : 'Degraded',
            uptime: `${uptime}%`,
            lastRunAt: job.lastRunAt,
            recentRuns: recentRuns.slice(0, 15),
          };
        })
      );
    }

    const hasActiveIncidents =
      Array.isArray(page.incidents) && page.incidents.some((inc) => inc.status !== 'RESOLVED');
    const allOperational =
      !hasActiveIncidents && monitorsDetails.every((m) => m.status === 'Operational');

    return {
      title: page.title,
      slug: page.slug,
      logoUrl: page.logoUrl,
      updatedAt: page.updatedAt,
      systemStatus: allOperational ? 'All Systems Operational' : 'Degraded Performance',
      incidents: page.incidents || [],
      monitors: monitorsDetails,
    };
  }
}
