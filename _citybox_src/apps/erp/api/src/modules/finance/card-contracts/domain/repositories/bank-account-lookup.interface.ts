/**
 * Porta mínima para conferir a conta bancária de destino do repasse.
 *
 * Deliberadamente **não** é o repositório do módulo `bank-accounts`: o contrato
 * de cartão só precisa saber se a conta existe na organização, e depender do
 * módulo inteiro por essa única pergunta acoplaria os dois cadastros (e
 * quebraria enquanto `bank-accounts` não existir).
 */
export abstract class BankAccountLookup {
  abstract exists(organizationId: string, id: string): Promise<boolean>;
}
