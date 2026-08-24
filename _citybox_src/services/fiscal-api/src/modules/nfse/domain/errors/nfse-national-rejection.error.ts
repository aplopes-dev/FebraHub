import { DomainError } from '../../../../shared/core/errors/domain.error';
import { describeNationalError } from '../national-error-codes';

/// Rejeição de negócio devolvida pelo Sistema Nacional da NFS-e.
///
/// Mapeia para 422 (é `DomainError`), preservando o **código oficial** em
/// `error.code` da resposta — quem consome a API precisa dele para agir, e o
/// nome da nossa classe não diz nada a quem lê a documentação do governo.
///
/// A mensagem externa junta o texto autoritativo do Anexo I com a orientação
/// da categoria: sem a segunda parte o operador recebe "A localidade de
/// incidência para o ISSQN deve corresponder..." e não sabe se corrige o
/// cadastro, corrige o pedido, ou liga para a prefeitura.
export class NfseNationalRejectionError extends DomainError {
  readonly nationalCode: string;

  constructor(context: string, code: string) {
    const described = describeNationalError(code);

    super({
      internalMessage: `Sistema Nacional NFS-e rejeitou a DPS (${code}): ${described.official ?? 'código não catalogado'}`,
      externalMessage: described.official
        ? `${described.official} ${described.hint}`
        : described.hint,
      context,
      externalCode: code,
    });

    this.nationalCode = code;
  }
}
