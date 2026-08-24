import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { DeviceToken } from '../../../../../shared/infra/crypto/device-token';
import { runWithoutTenantScope } from '../../../../../shared/infra/tenancy/tenant-context';
import { OrganizationRepository } from '../../../../tenancy/domain/repositories/organization.repository.interface';
import { BranchRepository } from '../../../../tenancy/domain/repositories/branch.repository.interface';
import { PosTerminalPairingCodeInvalidError } from '../../../domain/errors/pos-terminal-pairing-code-invalid.error';
import { PosTerminalRepository } from '../../../domain/repositories/pos-terminal.repository.interface';
import type {
  RedeemPairingCodeDto,
  RedeemPairingCodeResult,
} from '../../dtos/pos-terminal.dto';

/**
 * Troca o código de pareamento por uma credencial de dispositivo.
 *
 * É o único caminho pelo qual um PDV recém-instalado deixa de ser um app
 * genérico e vira "o Caixa 2 da Loja Centro". Roda **sem autenticação** — o
 * dispositivo ainda não tem credencial nenhuma —, então três coisas seguram a
 * porta: o código é opaco e de 8 caracteres, vale 15 minutos, e é consumido no
 * primeiro uso.
 *
 * Todas as falhas devolvem o **mesmo erro**. Distinguir "código não existe" de
 * "código expirou" contaria a quem está adivinhando quais tentativas chegaram
 * perto.
 */
@Injectable()
export class RedeemPairingCodeUseCase implements IUseCase<
  RedeemPairingCodeDto,
  RedeemPairingCodeResult
> {
  constructor(
    private readonly posTerminalRepository: PosTerminalRepository,
    private readonly organizationRepository: OrganizationRepository,
    private readonly branchRepository: BranchRepository,
  ) {}

  async execute(input: RedeemPairingCodeDto): Promise<RedeemPairingCodeResult> {
    const code = input.code.trim().toUpperCase();
    if (!code) throw new PosTerminalPairingCodeInvalidError('not_found');

    const terminal = await this.posTerminalRepository.findByPairingCode(code);
    if (!terminal) throw new PosTerminalPairingCodeInvalidError('not_found');

    if (!terminal.isPairingCodeValid(code)) {
      throw new PosTerminalPairingCodeInvalidError('expired');
    }

    // Terminal inativo não parea: desligá-lo no ERP tem que impedir também um
    // pareamento novo, não só derrubar o que já existe.
    if (!terminal.isOperational) {
      throw new PosTerminalPairingCodeInvalidError('mismatch');
    }

    // Branding (org/unidade) **antes** de consumir o código: a rota é
    // `@Public()` e não passa pelo `TenantContextGuard`. `Branch` é
    // tenant-scoped — sem `runWithoutTenantScope` a extensão lança
    // `TenantScopeMissingError` *depois* de `pairDevice` ter apagado o
    // código, e a segunda tentativa do PDV vira `not_found`.
    const [organization, branch] = await runWithoutTenantScope(() =>
      Promise.all([
        this.organizationRepository.findById(terminal.organizationId),
        this.branchRepository.findById(
          terminal.organizationId,
          terminal.branchId,
        ),
      ]),
    );

    const deviceToken = DeviceToken.generate();
    const paired = await this.posTerminalRepository.saveUnscoped(
      terminal.pairDevice(
        DeviceToken.hash(deviceToken),
        input.deviceLabel ?? null,
      ),
    );

    return {
      deviceToken,
      terminal: paired,
      organizationName: organization?.displayName ?? null,
      branchName: branch?.displayName ?? null,
    };
  }
}
