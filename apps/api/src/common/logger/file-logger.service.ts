import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';

export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  category: 'HTTP' | 'SYSTEM' | 'CRON_WORKER' | 'AUTH' | 'ADMIN';
  message: string;
  method?: string;
  path?: string;
  statusCode?: number;
  durationMs?: number;
  userId?: string;
  userEmail?: string;
  ip?: string;
  error?: string;
  stack?: string;
  meta?: Record<string, any>;
}

@Injectable()
export class FileLoggerService {
  private readonly logger = new Logger(FileLoggerService.name);
  private readonly logsDir = path.join(process.cwd(), 'logs');
  private readonly apiLogFile = path.join(this.logsDir, 'app-api.log');
  private readonly errorLogFile = path.join(this.logsDir, 'app-error.log');

  constructor() {
    this.ensureLogsDirectory();
  }

  private ensureLogsDirectory(): void {
    try {
      if (!fs.existsSync(this.logsDir)) {
        fs.mkdirSync(this.logsDir, { recursive: true });
      }
    } catch (err: any) {
      this.logger.error(`Failed to create logs directory: ${err?.message}`);
    }
  }

  private appendLog(file: string, entry: LogEntry): void {
    try {
      this.ensureLogsDirectory();
      const line = JSON.stringify(entry) + '\n';
      fs.appendFile(file, line, (err) => {
        if (err) {
          console.error('[FileLoggerService] Write error:', err);
        }
      });
    } catch (err) {
      // Ignore background file logging errors
    }
  }

  logApiRequest(data: {
    method: string;
    path: string;
    statusCode: number;
    durationMs: number;
    userId?: string;
    userEmail?: string;
    ip?: string;
    error?: string;
  }): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: data.statusCode >= 500 ? 'ERROR' : data.statusCode >= 400 ? 'WARN' : 'INFO',
      category: 'HTTP',
      message: `${data.method} ${data.path} -> ${data.statusCode} (${data.durationMs}ms)`,
      ...data,
    };

    this.appendLog(this.apiLogFile, entry);
    if (data.statusCode >= 400 || data.error) {
      this.appendLog(this.errorLogFile, entry);
    }
  }

  logError(message: string, stack?: string, meta?: Record<string, any>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      category: 'SYSTEM',
      message,
      stack,
      meta,
    };
    this.appendLog(this.errorLogFile, entry);
    this.appendLog(this.apiLogFile, entry);
  }

  logInfo(message: string, category: LogEntry['category'] = 'SYSTEM', meta?: Record<string, any>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      category,
      message,
      meta,
    };
    this.appendLog(this.apiLogFile, entry);
  }

  /**
   * Queries and searches file-based log entries.
   */
  async queryLogs(options?: {
    level?: string;
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: LogEntry[]; total: number; limit: number; offset: number }> {
    this.ensureLogsDirectory();

    const targetFile = options?.level === 'ERROR' ? this.errorLogFile : this.apiLogFile;
    if (!fs.existsSync(targetFile)) {
      return { logs: [], total: 0, limit: options?.limit || 100, offset: options?.offset || 0 };
    }

    try {
      const content = await fs.promises.readFile(targetFile, 'utf-8');
      const lines = content.trim().split('\n').filter(Boolean);

      let entries: LogEntry[] = [];
      for (let i = lines.length - 1; i >= 0; i--) {
        try {
          const parsed = JSON.parse(lines[i]);
          entries.push(parsed);
        } catch {
          // Skip invalid lines
        }
      }

      // Filter by level
      if (options?.level && options.level !== 'ALL') {
        entries = entries.filter((e) => e.level === options.level);
      }

      // Filter by category
      if (options?.category && options.category !== 'ALL') {
        entries = entries.filter((e) => e.category === options.category);
      }

      // Filter by search keyword
      if (options?.search) {
        const query = options.search.toLowerCase();
        entries = entries.filter((e) =>
          e.message?.toLowerCase().includes(query) ||
          e.path?.toLowerCase().includes(query) ||
          e.userEmail?.toLowerCase().includes(query) ||
          e.stack?.toLowerCase().includes(query) ||
          e.error?.toLowerCase().includes(query)
        );
      }

      const total = entries.length;
      const limit = options?.limit || 100;
      const offset = options?.offset || 0;
      const paginated = entries.slice(offset, offset + limit);

      return {
        logs: paginated,
        total,
        limit,
        offset,
      };
    } catch (err: any) {
      this.logger.error(`Error reading log file: ${err?.message}`);
      return { logs: [], total: 0, limit: 100, offset: 0 };
    }
  }
}
