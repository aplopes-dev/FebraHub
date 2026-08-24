import type { Company } from '../../domain/entities/company.entity';
import { CompanyCscNotConfiguredError } from '../../domain/errors/company-csc-not-configured.error';
import { decryptSecret } from '../../../../shared/infra/fiscal-signature/cert-encryption';

export type CompanyCsc = {
  cscId: string;
  cscToken: string;
};

/// Único ponto do serviço que produz o CSC em claro.
///
/// Espelha `certificate-key-loader.ts`, que faz o mesmo com a senha do PKCS#12:
/// função, não classe, para ser trivial de testar sem contexto Nest.
///
/// ⚠️ **O retorno é material sensível.** Ele existe para ser consumido na hora
/// (entra no hash do QR Code e é descartado) — não guarde em campo de
/// entidade, não coloque em DTO de resposta, não registre em log. O CSC é
/// segredo compartilhado com a SEFAZ: com ele, um terceiro forja QR Code que
/// a consulta pública aceita.
///
/// Recusar quando falta é parte do contrato, não conveniência — ver
/// `CompanyCscNotConfiguredError` para o porquê de a alternativa ser pior que
/// um erro.
export function readCompanyCsc(company: Company): CompanyCsc {
  const { cscId, cscTokenEncrypted } = company;

  if (!cscId?.trim() || !cscTokenEncrypted?.trim()) {
    throw new CompanyCscNotConfiguredError('readCompanyCsc', company.id);
  }

  return { cscId, cscToken: decryptSecret(cscTokenEncrypted) };
}
