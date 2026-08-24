import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { PosTerminal } from '../../../../modules/pos-terminals/domain/entities/pos-terminal.entity';
import type { DeviceRequest } from '../guards/device-auth.guard';

/**
 * O terminal resolvido pelo `DeviceAuthGuard`.
 *
 * Só use em rota protegida por ele — sem o guard, `req.terminal` é `undefined`
 * e o `!` abaixo estouraria. O `!` está aí de propósito: chegar aqui sem
 * terminal é erro de montagem da rota, não estado válido a tratar.
 */
export const CurrentTerminal = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): PosTerminal => {
    const req = ctx.switchToHttp().getRequest<DeviceRequest>();
    return req.terminal!;
  },
);
