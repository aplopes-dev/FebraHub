import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { runWithTenantScope } from './tenant-context';

/**
 * Abre o `AsyncLocalStorage` da requisição. Precisa ser middleware (e não
 * guard): guards retornam antes do handler rodar, então um `als.run()` lá
 * fecharia o escopo cedo demais. Quem preenche o contexto é o
 * `TenantContextGuard`, que roda dentro deste escopo.
 */
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(_req: Request, _res: Response, next: NextFunction): void {
    runWithTenantScope(() => next());
  }
}
