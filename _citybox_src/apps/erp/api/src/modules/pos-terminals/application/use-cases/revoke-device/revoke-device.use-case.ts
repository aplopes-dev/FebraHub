import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type { PosTerminal } from '../../../domain/entities/pos-terminal.entity';
import { PosTerminalNotFoundError } from '../../../domain/errors/pos-terminal-not-found.error';
import { PosTerminalRepository } from '../../../domain/repositories/pos-terminal.repository.interface';
import type { RevokeDeviceDto } from '../../dtos/pos-terminal.dto';

/**
 * Derruba a credencial do dispositivo pareado — o botão de "tablet sumiu".
 *
 * Idempotente de propósito: revogar um terminal que já não está pareado não é
 * erro. Quem clica nisso está com pressa e não deve receber um 4xx por já ter
 * clicado antes.
 */
@Injectable()
export class RevokeDeviceUseCase implements IUseCase<
  RevokeDeviceDto,
  PosTerminal
> {
  constructor(private readonly posTerminalRepository: PosTerminalRepository) {}

  async execute(input: RevokeDeviceDto): Promise<PosTerminal> {
    const terminal = await this.posTerminalRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!terminal || terminal.deletedAt) {
      throw new PosTerminalNotFoundError(input.id);
    }
    return this.posTerminalRepository.save(terminal.revokeDevice());
  }
}
