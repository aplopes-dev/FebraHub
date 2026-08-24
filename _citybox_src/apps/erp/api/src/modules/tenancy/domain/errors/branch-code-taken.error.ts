import { DomainError } from '../../../../shared/core/errors/domain.error';

export class BranchCodeTakenError extends DomainError {
  /**
   * `deactivated` distingue os dois conflitos: o unique do banco alcança as
   * unidades desativadas, então sem essa distinção o usuário veria "código já
   * usado" sem enxergar nenhuma unidade com ele na lista.
   */
  constructor(code: string, deactivated = false) {
    super({
      internalMessage: `Branch code ${code} already used in this organization${deactivated ? ' (deactivated branch)' : ''}`,
      externalMessage: deactivated
        ? `Existe uma unidade desativada com o código "${code}". Reative-a ou use outro código.`
        : `Já existe uma unidade com o código "${code}"`,
      context: BranchCodeTakenError.name,
    });
  }
}
