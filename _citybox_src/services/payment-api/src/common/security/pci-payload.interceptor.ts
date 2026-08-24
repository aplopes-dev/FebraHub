import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import { findPanViolations } from './pci-payload.js';

const SKIP_PATH_PREFIXES = ['/api/webhooks/providers/'];

@Injectable()
export class PciPayloadInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    if (!['POST', 'PUT', 'PATCH'].includes(request.method)) {
      return next.handle();
    }
    if (SKIP_PATH_PREFIXES.some((prefix) => request.path.startsWith(prefix))) {
      return next.handle();
    }

    const body = request.body;
    if (body !== null && body !== undefined && typeof body === 'object') {
      const violations = findPanViolations(body);
      if (violations.length > 0) {
        throw new BadRequestException({
          message: 'Dados sensíveis de cartão (PCI) não são aceitos — use checkout hospedado ou token PSP',
          violationCount: violations.length,
        });
      }
    }

    return next.handle();
  }
}
