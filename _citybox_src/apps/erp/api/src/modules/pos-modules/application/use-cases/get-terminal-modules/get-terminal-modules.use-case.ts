import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { PosTerminalNotFoundError } from '../../../../pos-terminals/domain/errors/pos-terminal-not-found.error';
import { PosTerminalRepository } from '../../../../pos-terminals/domain/repositories/pos-terminal.repository.interface';
import {
  resolveTerminalModules,
  sanitizeModuleStates,
} from '../../../domain/services/resolve-terminal-modules';
import type {
  GetTerminalModulesDto,
  TerminalModulesResult,
} from '../../dtos/pos-module.dto';
import { GetPosModuleDefaultsUseCase } from '../get-pos-module-defaults/get-pos-module-defaults.use-case';

/**
 * O conjunto de módulos **resolvido** de um terminal.
 *
 * Devolve o resultado, nunca as duas camadas separadas: se o consumidor
 * recebesse padrão e sobrescrita, teria de reimplementar a mesclagem, e uma
 * divergência produziria um terminal mostrando mesa que o ERP diz estar
 * desligada. `inheritsDefaults` sai junto porque a tela precisa saber se
 * "Usar o padrão da loja" está ligado — e derivar isso comparando mapas seria
 * adivinhação.
 */
@Injectable()
export class GetTerminalModulesUseCase implements IUseCase<
  GetTerminalModulesDto,
  TerminalModulesResult
> {
  constructor(
    private readonly posTerminalRepository: PosTerminalRepository,
    private readonly getDefaults: GetPosModuleDefaultsUseCase,
  ) {}

  async execute(input: GetTerminalModulesDto): Promise<TerminalModulesResult> {
    const terminal = await this.posTerminalRepository.findById(
      input.organizationId,
      input.terminalId,
    );
    if (!terminal || terminal.deletedAt) {
      throw new PosTerminalNotFoundError(input.terminalId);
    }

    const defaults = await this.getDefaults.execute({
      organizationId: input.organizationId,
    });

    return {
      terminalId: terminal.id,
      // Higieniza a sobrescrita **na leitura**: a coluna é `Json` e o banco não
      // valida nada. Uma linha editada à mão não pode virar estado — o mesmo
      // cuidado que o repositório do padrão já toma.
      resolved: resolveTerminalModules(
        defaults.modules,
        terminal.moduleOverrides === null
          ? null
          : sanitizeModuleStates(terminal.moduleOverrides),
      ),
      inheritsDefaults: terminal.moduleOverrides === null,
    };
  }
}
