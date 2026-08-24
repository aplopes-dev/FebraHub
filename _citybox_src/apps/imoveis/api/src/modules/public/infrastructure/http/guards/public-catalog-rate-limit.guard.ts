import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';

type Bucket = { count: number; resetAt: number };

function clientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0]?.trim() ?? 'unknown';
  }
  return req.ip ?? req.socket.remoteAddress ?? 'unknown';
}

/** Limite in-memory por IP nos endpoints públicos do catálogo. */
@Injectable()
export class PublicCatalogRateLimitGuard implements CanActivate {
  private readonly buckets = new Map<string, Bucket>();
  private readonly maxAttempts = Number(
    process.env.PUBLIC_RATE_LIMIT_MAX ?? 60,
  );
  private readonly windowMs = Number(
    process.env.PUBLIC_RATE_LIMIT_WINDOW_MS ?? 60_000,
  );

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const key = `public-catalog:${clientIp(req)}`;
    const now = Date.now();
    const bucket = this.buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + this.windowMs });
      return true;
    }

    if (bucket.count >= this.maxAttempts) {
      throw new HttpException(
        'Muitas requisições. Aguarde um momento e tente novamente.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    bucket.count += 1;
    return true;
  }
}
