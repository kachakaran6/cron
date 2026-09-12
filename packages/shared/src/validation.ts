import { z } from 'zod';

export const createCronJobSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  url: z.string().url('Must be a valid HTTP/HTTPS URL'),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']).default('GET'),
  schedule: z.string().min(1, 'Schedule expression is required'),
  timezone: z.string().default('UTC'),
  headers: z.record(z.string()).optional(),
  body: z.string().optional(),
  timeoutMs: z.number().int().min(1000).max(60000).default(10000),
});

export type CreateCronJobInput = z.infer<typeof createCronJobSchema>;
