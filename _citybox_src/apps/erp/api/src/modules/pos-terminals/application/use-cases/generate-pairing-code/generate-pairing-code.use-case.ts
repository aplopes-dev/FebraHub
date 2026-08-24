import { randomInt } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { PosTerminalRepository } from '../../../domain/repositories/pos-terminal.repository.interface';
import { PosTerminalNotFoundError } from '../../../domain/errors/pos-terminal-not-found.error';
import type {
  GeneratePairingCodeDto,
  GeneratePairingCodeResult,
} from '../../dtos/pos-terminal.dto';

const PAIRING_CODE_LENGTH = 8;
const PAIRING_CODE_TTL_MINUTES = 15;
/** Sem caracteres ambíguos (`I`, `O`, `0`, `1`): o código costuma ser digitado à mão no PDV. */
const PAIRING_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generatePairingCode(): string {
  let result = '';
  for (let i = 0; i < PAIRING_CODE_LENGTH; i += 1) {
    result += PAIRING_CODE_CHARS[randomInt(PAIRING_CODE_CHARS.length)];
  }
  return result;
}

/**
 * Gera (ou regenera, sobrescrevendo o anterior) o código de pareamento de um
 * terminal. A troca do código por credencial de longa duração é fatia futura
 * — aqui só nasce o código opaco com validade curta.
 */
@Injectable()
export class GeneratePairingCodeUseCase implements IUseCase<
  GeneratePairingCodeDto,
  GeneratePairingCodeResult
> {
  constructor(private readonly posTerminalRepository: PosTerminalRepository) {}

  async execute(
    input: GeneratePairingCodeDto,
  ): Promise<GeneratePairingCodeResult> {
    const terminal = await this.posTerminalRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!terminal || terminal.deletedAt) {
      throw new PosTerminalNotFoundError(input.id);
    }

    const code = generatePairingCode();
    const expiresAt = new Date(Date.now() + PAIRING_CODE_TTL_MINUTES * 60_000);

    const saved = await this.posTerminalRepository.save(
      terminal.setPairingCode(code, expiresAt),
    );

    return { id: saved.id, code, expiresAt };
  }
}
