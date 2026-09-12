import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { db, users } from '@cron-saas/database';
import { eq } from 'drizzle-orm';

@Injectable()
export class AdminGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const userId = req.userId;

    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }

    const [user] = await db
      .select({ id: users.id, email: users.email, role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Auto-promote kachakaran6@gmail.com if not already admin
    if (user.email.toLowerCase() === 'kachakaran6@gmail.com' && user.role !== 'admin') {
      await db.update(users).set({ role: 'admin' }).where(eq(users.id, user.id));
      user.role = 'admin';
    }

    if (user.role !== 'admin') {
      throw new ForbiddenException('Access denied: Developer Admin privileges required');
    }

    req.userRole = user.role;
    return true;
  }
}
