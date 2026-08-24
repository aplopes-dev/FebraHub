import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { PosTerminalRepository } from '../../../domain/repositories/pos-terminal.repository.interface';
import { PosTerminalNotFoundError } from '../../../domain/errors/pos-terminal-not-found.error';
import type { DeletePosTerminalDto } from '../../dtos/pos-terminal.dto';

@Injectable()
export class DeletePosTerminalUseCase implements IUseCase<
  DeletePosTerminalDto,
  void
> {
  constructor(private readonly posTerminalRepository: PosTerminalRepository) {}

  async execute(input: DeletePosTerminalDto): Promise<void> {
    const terminal = await this.posTerminalRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!terminal || terminal.deletedAt) {
      throw new PosTerminalNotFoundError(input.id);
    }
    await this.posTerminalRepository.save(terminal.softDelete());
  }
}
