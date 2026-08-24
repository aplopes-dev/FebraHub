import { DomainError } from '../../../../shared/core/errors/domain.error';

/**
 * O evento da plataforma não trouxe um campo que o cadastro do ERP exige.
 *
 * Na `Store` quase tudo é opcional; em `Organization`/`Branch` documento, razão
 * social, e-mail e responsável não são. Falhar aqui é deliberado: inventar
 * placeholder ("000000000000") produziria uma empresa que não emite nota e um
 * erro que só apareceria semanas depois, longe da causa. A mensagem externa vai
 * inteira para o callback `provisioning.failed` e é o que o operador lê no
 * admin — por isso ela nomeia os campos, não só o problema.
 */
export class StorePayloadIncompleteError extends DomainError {
  constructor(storeId: string, missingFields: readonly string[]) {
    const fields = missingFields.join(', ');
    super({
      internalMessage: `Store ${storeId} event is missing required fields: ${fields}`,
      externalMessage: `A loja não pode ser provisionada no ERP: faltam os campos ${fields}. Preencha-os no cadastro da loja e reprocesse o provisionamento.`,
      context: StorePayloadIncompleteError.name,
    });
  }
}
