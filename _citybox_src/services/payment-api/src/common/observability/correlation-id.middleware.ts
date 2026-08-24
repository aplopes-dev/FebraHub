import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import {
  paymentRequestContext,
  resolveCorrelationId,
} from './correlation-id.context.js';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const header = req.headers['x-correlation-id'];
    const correlationId = resolveCorrelationId(
      typeof header === 'string' ? header : header?.[0],
    );
    res.setHeader('X-Correlation-Id', correlationId);
    paymentRequestContext.run({ correlationId }, () => next());
  }
}
