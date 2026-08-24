import { CanActivate, ExecutionContext, HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { RedisService } from './redis.service.js';
import type { PaymentRequest } from '../auth/auth.types.js';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly authMaxRequests = Number(process.env.PAYMENTS_RATE_LIMIT_MAX ?? 120);
  private readonly publicMaxRequests = Number(process.env.PAYMENTS_PUBLIC_RATE_LIMIT_MAX ?? 30);
  private readonly windowSec = Number(process.env.PAYMENTS_RATE_LIMIT_WINDOW_SEC ?? 60);

  constructor(@Inject(RedisService) private readonly redis: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & PaymentRequest>();
    const isAuthenticated = Boolean(request.paymentAuth);
    const clientIp =
      request.ip?.trim() ||
      (typeof request.headers['x-forwarded-for'] === 'string'
        ? request.headers['x-forwarded-for'].split(',')[0]?.trim()
        : undefined) ||
      'unknown';

    const key = isAuthenticated
      ? `payments:rl:auth:${request.paymentAuth!.sourceSystem}`
      : `payments:rl:ip:${clientIp}`;
    const maxRequests = isAuthenticated ? this.authMaxRequests : this.publicMaxRequests;

    try {
      const count = await this.redis.client.incr(key);
      if (count === 1) {
        await this.redis.client.expire(key, this.windowSec);
      }
      if (count > maxRequests) {
        throw new HttpException('Rate limit excedido', HttpStatus.TOO_MANY_REQUESTS);
      }
      return true;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      return true;
    }
  }
}
