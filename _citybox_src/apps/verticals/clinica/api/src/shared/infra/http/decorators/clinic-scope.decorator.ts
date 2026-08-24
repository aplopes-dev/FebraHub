import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  CLINIC_SCOPE_REQUEST_KEY,
  type ClinicScope,
} from '../guards/clinic-scope.guard';

/**
 * Escopo já validado pelo `ClinicScopeGuard`.
 *
 * Preferir isto a `@StoreId()` em código novo: o `StoreId` só lê o header, sem provar
 * que o usuário tem acesso àquela clínica.
 */
export const CurrentClinicScope = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ClinicScope => {
    const req = ctx
      .switchToHttp()
      .getRequest<Record<string, unknown>>();
    const scope = req[CLINIC_SCOPE_REQUEST_KEY] as ClinicScope | undefined;
    if (!scope) {
      throw new Error(
        'ClinicScope ausente — a rota passou pelo ClinicScopeGuard? (header X-Store-Id/X-Clinic-Id obrigatório)',
      );
    }
    return scope;
  },
);
