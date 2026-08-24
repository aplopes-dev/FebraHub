import { UpdatePaymentMethodUseCase } from './update-payment-method.use-case';
import { PaymentMethodNotFoundError } from '../../../domain/errors/payment-method-not-found.error';
import { PaymentMethodNameTakenError } from '../../../domain/errors/payment-method-name-taken.error';
import { PaymentMethodNotEditableError } from '../../../domain/errors/payment-method-not-editable.error';
import {
  OTHER_PAYMENT_METHOD_ID,
  PAYMENT_METHOD_ID,
  makePaymentMethod,
  makePaymentMethodRepositories,
  ORGANIZATION_ID,
} from '../../../tests/payment-methods-test-factory';

describe('UpdatePaymentMethodUseCase', () => {
  function setup() {
    const repos = makePaymentMethodRepositories();
    const useCase = new UpdatePaymentMethodUseCase(
      repos.paymentMethodRepository,
    );
    return { ...repos, useCase };
  }

  it('atualiza nome e códigos de uma forma própria', async () => {
    const { useCase, paymentMethodRepository } = setup();
    await paymentMethodRepository.save(makePaymentMethod({ name: 'Antiga' }));

    const updated = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: PAYMENT_METHOD_ID,
      name: 'Nova',
      fiscalCode: '99',
      installmentPermission: 'allowed',
    });

    expect(updated.name).toBe('Nova');
    expect(updated.fiscalCode).toBe('99');
    expect(updated.installmentPermission).toBe('allowed');
  });

  it('404 se a forma de pagamento não existe', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        id: PAYMENT_METHOD_ID,
        name: 'Nova',
        fiscalCode: null,
        installmentPermission: null,
      }),
    ).rejects.toBeInstanceOf(PaymentMethodNotFoundError);
  });

  it('409 ao tentar editar uma forma de pagamento provisionada pelo sistema', async () => {
    const { useCase, paymentMethodRepository } = setup();
    await paymentMethodRepository.save(
      makePaymentMethod({ systemKey: 'pm-pix', isSystem: true }),
    );

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        id: PAYMENT_METHOD_ID,
        name: 'PIX renomeado',
        fiscalCode: null,
        installmentPermission: null,
      }),
    ).rejects.toBeInstanceOf(PaymentMethodNotEditableError);
  });

  it('rejeita nome já usado por outra forma de pagamento', async () => {
    const { useCase, paymentMethodRepository } = setup();
    await paymentMethodRepository.save(makePaymentMethod({ name: 'Dinheiro' }));
    await paymentMethodRepository.save(
      makePaymentMethod({ id: OTHER_PAYMENT_METHOD_ID, name: 'Boleto' }),
    );

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        id: PAYMENT_METHOD_ID,
        name: 'boleto',
        fiscalCode: null,
        installmentPermission: null,
      }),
    ).rejects.toBeInstanceOf(PaymentMethodNameTakenError);
  });
});
