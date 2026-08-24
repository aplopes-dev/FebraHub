import {Injectable, NestMiddleware, UnauthorizedException} from '@nestjs/common';
import { InjectService } from '../common/inject.js';
import type { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(@InjectService(AuthService) private readonly auth: AuthService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Auth delegada ao PaymentWebhookSignatureService (HMAC X-Payments-Signature no rawBody).
    if (
      req.method === 'POST' &&
      req.path === '/api/v1/internal/payments/webhooks'
    ) {
      return next();
    }
    if (!req.path.startsWith('/api/v1/')) return next();
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Bearer token obrigatório');
    }
    (req as Request & { user?: unknown }).user = await this.auth.verifyBearer(header.slice(7));
    next();
  }
}