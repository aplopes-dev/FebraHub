import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ApiKeyService } from './api-key.service.js';
import { IS_PUBLIC_KEY, REQUIRES_ADMIN_KEY, type PaymentRequest } from './auth.types.js';

function extractApiKey(request: Request): string | undefined {
  const header = request.header('x-api-key')?.trim();
  if (header) return header;
  const auth = request.header('authorization')?.trim();
  if (auth?.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim();
  }
  return undefined;
}

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(ApiKeyService) private readonly apiKeys: ApiKeyService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request & PaymentRequest>();
    const apiKey = extractApiKey(request);
    if (!apiKey) {
      throw new UnauthorizedException('API Key obrigatória (X-Api-Key ou Authorization Bearer)');
    }

    const client = this.apiKeys.resolve(apiKey);
    request.paymentAuth = {
      sourceSystem: client.sourceSystem,
      tenantId: client.tenantId,
      isAdmin: client.isAdmin,
    };

    const requiresAdmin = this.reflector.getAllAndOverride<boolean>(REQUIRES_ADMIN_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (requiresAdmin && !client.isAdmin) {
      throw new ForbiddenException('Operação restrita a administradores');
    }

    return true;
  }
}
