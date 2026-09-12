import * as cronParser from 'cron-parser';

export function calculateNextRun(expression: string, timezone = 'UTC'): Date {
  try {
    const parseFn =
      (cronParser as any).parseExpression ||
      (cronParser as any).default?.parseExpression ||
      (cronParser as any);

    const interval = parseFn(expression, {
      currentDate: new Date(),
      tz: timezone || 'UTC',
    });
    return interval.next().toDate();
  } catch (err: any) {
    throw new Error(`Invalid cron expression or timezone: ${err.message}`);
  }
}
