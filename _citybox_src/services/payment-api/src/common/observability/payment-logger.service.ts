import { Injectable } from '@nestjs/common';
import { getCorrelationId } from './correlation-id.context.js';
import { redactForLogs } from './log-redact.js';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

@Injectable()
export class PaymentLoggerService {
  private readonly service = 'payment-api';

  log(level: LogLevel, message: string, context?: string, meta?: Record<string, unknown>): void {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.service,
      context: context ?? 'payment-api',
      message,
      correlationId: getCorrelationId(),
      ...(meta ? { meta: redactForLogs(meta) as Record<string, unknown> } : {}),
    };
    const line = JSON.stringify(entry);
    if (level === 'error') {
      console.error(line);
      return;
    }
    if (level === 'warn') {
      console.warn(line);
      return;
    }
    console.log(line);
  }

  info(message: string, context?: string, meta?: Record<string, unknown>): void {
    this.log('info', message, context, meta);
  }

  warn(message: string, context?: string, meta?: Record<string, unknown>): void {
    this.log('warn', message, context, meta);
  }

  error(message: string, context?: string, meta?: Record<string, unknown>): void {
    this.log('error', message, context, meta);
  }
}
