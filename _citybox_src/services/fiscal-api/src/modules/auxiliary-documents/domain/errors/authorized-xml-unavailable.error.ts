import { InfrastructureError } from '../../../../shared/core/errors/infrastructure.error';

/// FR-010 — o XML autorizado não pôde ser recuperado.
///
/// ⚠️ O nome da classe **precisa** conter `Unavailable`: o
/// `app-exception.filter.ts` resolve o status HTTP por substring do nome, e é
/// isso que produz 503. Renomear para algo como `MissingAuthorizedXmlError`
/// derrubaria a resposta para 500 sem quebrar compilação nem teste de unidade.
///
/// A alternativa tentadora, quando o XML some, seria montar o PDF com os dados
/// relacionais que já temos em mãos. FR-010 proíbe: produziria um documento que
/// **diverge do que o fisco tem**, e ninguém perceberia — nem quem imprime, nem
/// quem recebe. Falhar alto é o comportamento correto.
export class AuthorizedXmlUnavailableError extends InfrastructureError {
  constructor(context: string, fiscalDocumentId: string, cause?: string) {
    super({
      internalMessage: cause
        ? `Authorized XML for FiscalDocument "${fiscalDocumentId}" is unavailable: ${cause}`
        : `Authorized XML for FiscalDocument "${fiscalDocumentId}" is unavailable`,
      externalMessage:
        'O XML autorizado desta nota não está disponível no momento. Tente novamente; se persistir, acione o suporte.',
      externalCode: 'AUTHORIZED_XML_UNAVAILABLE',
      context,
    });
  }
}
