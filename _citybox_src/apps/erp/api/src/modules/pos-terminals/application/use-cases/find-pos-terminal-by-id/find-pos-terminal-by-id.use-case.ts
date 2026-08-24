import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type { PosTerminal } from '../../../domain/entities/pos-terminal.entity';
import { PosTerminalRepository } from '../../../domain/repositories/pos-terminal.repository.interface';
import { PosTerminalNotFoundError } from '../../../domain/errors/pos-terminal-not-found.error';
import type { FindPosTerminalByIdDto } from '../../dtos/pos-terminal.dto';

@Injectable()
export class FindPosTerminalByIdUseCase implements IUseCase<
  FindPosTerminalByIdDto,
  PosTerminal
> {
  constructor(private readonly posTerminalRepository: PosTerminalRepository) {}

  async execute(input: FindPosTerminalByIdDto): Promise<PosTerminal> {
    const terminal = await this.posTerminalRepository.findById(
      input.organizationId,
      input.id,
    );
    // Sem restore nesta fatia — um terminal excluído não existe para quem
    // consulta (diferente de `Customer`, que expõe soft-deleted p/ restaurar).
    if (!terminal || terminal.deletedAt) {
      throw new PosTerminalNotFoundError(input.id);
    }
    return terminal;
  }
}
