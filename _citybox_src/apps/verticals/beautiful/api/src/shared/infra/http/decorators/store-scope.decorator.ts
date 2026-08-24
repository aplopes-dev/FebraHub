import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  STORE_SCOPE_REQUEST_KEY,
  type StoreScope,
} from '../guards/store-scope.guard';

/** Escopo da loja preenchido pelo StoreScopeGuard (`X-Store-Id`). */
export const CurrentStoreScope = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): StoreScope | undefined => {
    const request = ctx.switchToHttp().getRequest<Record<string, unknown>>();
    return request[STORE_SCOPE_REQUEST_KEY] as StoreScope | undefined;
  },
);
