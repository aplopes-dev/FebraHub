import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { DeviceToken } from '../../crypto/device-token';
import { PosTerminalRepository } from '../../../../modules/pos-terminals/domain/repositories/pos-terminal.repository.interface';
import type { PosTerminal } from '../../../../modules/pos-terminals/domain/entities/pos-terminal.entity';
import { PosTerminalDeviceUnauthorizedError } from '../../../../modules/pos-terminals/domain/errors/pos-terminal-device-unauthorized.error';
import { setTenantContext } from '../../tenancy/tenant-context';

export type DeviceRequest = {
  headers: Record<string, string | string[] | undefined>;
  terminal?: PosTerminal;
};

const SCHEME = 'Device ';

/**
 * Autentica o **terminal**, não o usuário.
 *
 * Rotas do PDV não passam pelo `AuthGuard` (Keycloak): quem chama é um
 * dispositivo pareado, com credencial própria emitida pelo `redeem`. Use este
 * guard junto com `@Public()` — o `@Public()` desliga a cadeia global
 * (`AuthGuard` → `TenantContextGuard` → `PermissionGuard`), e este guard é
 * quem passa a segurar a porta.
 *
 * A organização e a unidade saem do **terminal**, nunca de header enviado pelo
 * cliente: o dispositivo não escolhe em nome de que loja está vendendo.
 *
 * Efeito colateral deliberado: cada requisição atualiza `lastSeenAt`. É o que
 * permite ao gerente ver na listagem qual terminal parou de dar sinal — e o
 * custo é uma escrita por chamada, aceitável no volume de um PDV.
 *
 * Também estabelece o `TenantContext` a partir do terminal: rotas `@Public()`
 * nunca passam pelo `TenantContextGuard` (só ele chama `setTenantContext`), e
 * sem isso qualquer repositório que use `prisma.scoped` (ex.: `PosOperator`,
 * `PosPolicy`) falharia com `TenantScopeMissingError` — o contexto ficaria
 * `pending` a requisição inteira.
 */
@Injectable()
export class DeviceAuthGuard implements CanActivate {
  constructor(
    @Inject(PosTerminalRepository)
    private readonly posTerminalRepository: PosTerminalRepository,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<DeviceRequest>();
    const raw = req.headers.authorization ?? req.headers.Authorization;
    const header = Array.isArray(raw) ? raw[0] : raw;

    if (!header?.startsWith(SCHEME)) {
      throw new PosTerminalDeviceUnauthorizedError('missing Device header');
    }

    const token = header.slice(SCHEME.length).trim();
    if (!token) {
      throw new PosTerminalDeviceUnauthorizedError('empty token');
    }

    const terminal = await this.posTerminalRepository.findByDeviceTokenHash(
      DeviceToken.hash(token),
    );

    // Uma mensagem só para "não existe", "revogado" e "terminal desativado":
    // o dispositivo não precisa saber qual dos três, e o operador vê a mesma
    // tela de ativação em todos eles. O que o PDV **usa** é o `code` do
    // envelope, que é igual nos quatro casos — ver a doc do erro.
    if (
      !terminal ||
      !terminal.deviceTokenHash ||
      !DeviceToken.matches(token, terminal.deviceTokenHash) ||
      !terminal.isOperational
    ) {
      throw new PosTerminalDeviceUnauthorizedError(
        'unknown, revoked or deactivated terminal',
      );
    }

    req.terminal = terminal;
    await this.posTerminalRepository.saveUnscoped(terminal.touchLastSeen());

    setTenantContext({
      organizationId: terminal.organizationId,
      membershipId: null,
      role: 'MEMBER',
      branchIds: [terminal.branchId],
      branchId: terminal.branchId,
      viaPlatformAdmin: false,
      permissionProfileId: null,
      permissionIds: [],
    });

    return true;
  }
}
