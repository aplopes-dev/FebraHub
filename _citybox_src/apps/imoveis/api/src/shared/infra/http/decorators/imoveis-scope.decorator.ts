import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  IMOVEIS_SCOPE_REQUEST_KEY,
  type ImoveisScope,
} from '../guards/imoveis-scope.guard';

export const CurrentImoveisScope = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ImoveisScope | undefined => {
    const req = ctx.switchToHttp().getRequest<Record<string, unknown>>();
    return req[IMOVEIS_SCOPE_REQUEST_KEY] as ImoveisScope | undefined;
  },
);
