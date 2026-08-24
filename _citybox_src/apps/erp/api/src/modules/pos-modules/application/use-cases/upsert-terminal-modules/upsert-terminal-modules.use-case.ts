import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { PosTerminalNotFoundError } from '../../../../pos-terminals/domain/errors/pos-terminal-not-found.error';
import { PosTerminalRepository } from '../../../../pos-terminals/domain/repositories/pos-terminal.repository.interface';
import { sanitizeModuleStates } from '../../../domain/services/resolve-terminal-modules';
import type {
  TerminalModulesResult,
  UpsertTerminalModulesDto,
} from '../../dtos/pos-module.dto';
import { GetTerminalModulesUseCase } from '../get-terminal-modules/get-terminal-modules.use-case';

/**
 * Define — ou remove — a sobrescrita de módulos de um terminal.
 *
 * `modules: null` volta a herdar, e é o caminho que a tela usa quando o gerente
 * religa "Usar o padrão da loja". Gravar `{}` no lugar deixaria o terminal
 * parado no conjunto atual da loja para sempre, sem acompanhar mudanças —
 * exatamente o que o `null` existe para evitar.
 */
@Injectable()
export class UpsertTerminalModulesUseCase implements IUseCase<
  UpsertTerminalModulesDto,
  TerminalModulesResult
> {
  constructor(
    private readonly posTerminalRepository: PosTerminalRepository,
    private readonly getTerminalModules: GetTerminalModulesUseCase,
  ) {}

  async execute(
    input: UpsertTerminalModulesDto,
  ): Promise<TerminalModulesResult> {
    const terminal = await this.posTerminalRepository.findById(
      input.organizationId,
      input.terminalId,
    );
    if (!terminal || terminal.deletedAt) {
      throw new PosTerminalNotFoundError(input.terminalId);
    }

    await this.posTerminalRepository.save(
      terminal.setModuleOverrides(
        input.modules === null ? null : sanitizeModuleStates(input.modules),
      ),
    );

    return this.getTerminalModules.execute({
      organizationId: input.organizationId,
      terminalId: input.terminalId,
    });
  }
}
