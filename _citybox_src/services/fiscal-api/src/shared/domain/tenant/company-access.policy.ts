import type { AuthenticatedUser } from '../../infra/http/auth/authenticated-user';

/// Decide se o solicitante pode agir em nome de um Emitente (FR-007).
///
/// ⚠️ **Existe porque o `X-Company-Id` sozinho não protege nada.** O header é
/// escolhido pelo chamador, e o JWT desta API não carrega claim de empresa —
/// comparar `document.companyId` contra o header confronta o banco com um valor
/// que o próprio solicitante inventou. Impede engano; não impede acesso
/// deliberado a documento de outro contribuinte.
///
/// Achado de revisão de segurança (2026-08-08, HIGH). Estes dois endpoints são
/// os primeiros do serviço cujo produto é **feito para sair da plataforma** —
/// enviado ao cliente por e-mail e WhatsApp —, o que torna o vazamento
/// permanente e fora do nosso alcance.
///
/// A porta transforma o header de **afirmação confiada** em **afirmação
/// verificada**: o header continua dizendo qual Emitente, mas quem decide se
/// vale é uma consulta no servidor a partir do `sub` autenticado.
export abstract class CompanyAccessPolicy {
  abstract canActFor(
    companyId: string,
    user: AuthenticatedUser,
  ): Promise<boolean>;
}

/// Libera tudo. **Só para teste** — nunca registrar no módulo de produção.
export class AllowAllCompanyAccessPolicy extends CompanyAccessPolicy {
  canActFor(): Promise<boolean> {
    return Promise.resolve(true);
  }
}
