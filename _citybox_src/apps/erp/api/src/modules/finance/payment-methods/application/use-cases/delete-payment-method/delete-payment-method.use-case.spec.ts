import { DeletePaymentMethodUseCase } from './delete-payment-method.use-case';
import { PaymentMethodNotFoundError } from '../../../domain/errors/payment-method-not-found.error';
import { PaymentMethodNotRemovableError } from '../../../domain/errors/payment-method-not-removable.error';
import { PaymentMethodInUseError } from '../../../domain/errors/payment-method-in-use.error';
import {
  PAYMENT_METHOD_ID,
  makePaymentMethod,
  makePaymentMethodRepositories,
  ORGANIZATION_ID,
} from '../../../tests/payment-methods-test-factory';

describe('DeletePaymentMethodUseCase', () => {
  function setup() {
    const repos = makePaymentMethodRepositories();
    const useCase = new DeletePaymentMethodUseCase(
      repos.paymentMethodRepository,
    );
    return { ...repos, useCase };
  }

  it('marca a forma de pagamento como excluída sem apagá-la', async () => {
    const { useCase, paymentMethodRepository } = setup();
    await paymentMethodRepository.save(makePaymentMethod());

    await useCase.execute({
      organizationId: ORGANIZATION_ID,
      id: PAYMENT_METHOD_ID,
    });

    const stored = await paymentMethodRepository.findById(
      ORGANIZATION_ID,
      PAYMENT_METHOD_ID,
    );
    expect(stored?.deletedAt).toBeInstanceOf(Date);
    expect(
      await paymentMethodRepository.count(ORGANIZATION_ID, { tab: 'active' }),
    ).toBe(0);
  });

  it('409 ao tentar excluir uma forma de pagamento provisionada pelo sistema', async () => {
    const { useCase, paymentMethodRepository } = setup();
    await paymentMethodRepository.save(
      makePaymentMethod({ systemKey: 'pm-pix', isSystem: true }),
    );

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        id: PAYMENT_METHOD_ID,
      }),
    ).rejects.toBeInstanceOf(PaymentMethodNotRemovableError);

    const stored = await paymentMethodRepository.findById(
      ORGANIZATION_ID,
      PAYMENT_METHOD_ID,
    );
    expect(stored?.deletedAt).toBeNull();
  });

  it('409 ao tentar excluir uma forma de pagamento em uso em lançamentos existentes', async () => {
    const { useCase, paymentMethodRepository } = setup();
    await paymentMethodRepository.save(makePaymentMethod());
    paymentMethodRepository.usageCounts.set(
      `${ORGANIZATION_ID}:${PAYMENT_METHOD_ID}`,
      3,
    );

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        id: PAYMENT_METHOD_ID,
      }),
    ).rejects.toBeInstanceOf(PaymentMethodInUseError);

    const stored = await paymentMethodRepository.findById(
      ORGANIZATION_ID,
      PAYMENT_METHOD_ID,
    );
    expect(stored?.deletedAt).toBeNull();
  });

  it('404 se a forma de pagamento não existe', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        id: PAYMENT_METHOD_ID,
      }),
    ).rejects.toBeInstanceOf(PaymentMethodNotFoundError);
  });
});
