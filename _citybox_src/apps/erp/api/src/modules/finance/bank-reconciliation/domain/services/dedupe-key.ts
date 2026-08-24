import { createHash } from 'crypto';

/**
 * Função pura (research.md D11). `fitId` é a chave de dedupe natural — mas
 * alguns bancos exportam `FITID` vazio ou instável entre reimportações do
 * mesmo período. Nesse caso, deriva uma chave determinística a partir de
 * `(postedAt, amountCents, memo)` — mesmos três valores sempre produzem a
 * mesma chave, permitindo dedupe mesmo sem `FITID` confiável.
 *
 * `bankCode`/`accountNumber` (sempre presentes no `BANKACCTFROM` do próprio
 * arquivo, independente de a organização ter uma `BankAccount` cadastrada
 * que bata com eles) **namespaceiam** a chave — `007-financeiro-ajustes-ui`
 * FR-007 tornou o dedupe escopado por organização inteira, não mais por
 * `bankAccountId` resolvido; sem esse namespace, um `FITID` cru reutilizado
 * por bancos/contas diferentes (comum — o spec OFX só garante unicidade
 * *dentro* da conta emissora) colidiria na constraint única nova
 * (`organizationId, dedupeKey`) mesmo sendo transações de contas distintas.
 */
export function computeDedupeKey(input: {
  bankCode: string;
  accountNumber: string;
  fitId: string;
  postedAt: Date;
  amountCents: number;
  memo: string;
}): string {
  const namespace = `${input.bankCode.trim()}:${input.accountNumber.trim()}`;
  const trimmedFitId = input.fitId.trim();
  if (trimmedFitId) {
    return `${namespace}:${trimmedFitId}`;
  }

  const raw = [
    namespace,
    input.postedAt.toISOString(),
    input.amountCents,
    input.memo.trim().toLowerCase(),
  ].join('|');

  return createHash('sha1').update(raw).digest('hex');
}
