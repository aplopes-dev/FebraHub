import { CreatePaymentMethodUseCase } from './create-payment-method.use-case';
import { PaymentMethodNameTakenError } from '../../../domain/errors/payment-method-name-taken.error';
import {
  makePaymentMethod,
  makePaymentMethodRepositories,
  ORGANIZATION_ID,
} from '../../../tests/payment-methods-test-factory';

describe('CreatePaymentMethodUseCase', () => {
  function setup() {
    const repos = makePaymentMethodRepositories();
    const useCase = new CreatePaymentMethodUseCase(
      repos.paymentMethodRepository,
    );
    return { ...repos, useCase };
  }

  it('cria a forma de pagamento com o nome aparado', async () => {
    const { useCase } = setup();

    const paymentMethod = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      name: '  Vale Cultura  ',
      fiscalCode: '99',
      installmentPermission: null,
    });

    expect(paymentMethod.name).toBe('Vale Cultura');
    expect(paymentMethod.isSystem).toBe(false);
    expect(paymentMethod.deletedAt).toBeNull();
  });

  it('rejeita nome já usado na organização', async () => {
    const { useCase, paymentMethodRepository } = setup();
    await paymentMethodRepository.save(makePaymentMethod({ name: 'PIX' }));

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        name: 'pix',
        fiscalCode: null,
        installmentPermission: null,
      }),
    ).rejects.toBeInstanceOf(PaymentMethodNameTakenError);
  });
});
