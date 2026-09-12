import cronParser from 'cron-parser';

export function calculateNextRun(expression: string, timezone = 'UTC'): Date {
  try {
    const interval = cronParser.parseExpression(expression, {
      currentDate: new Date(),
      tz: timezone,
    });
    return interval.next().toDate();
  } catch (err: any) {
    throw new Error(`Invalid cron expression or timezone: ${err.message}`);
  }
}
