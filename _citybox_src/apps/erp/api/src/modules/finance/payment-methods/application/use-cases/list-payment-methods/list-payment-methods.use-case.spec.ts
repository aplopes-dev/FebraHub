import { ListPaymentMethodsUseCase } from './list-payment-methods.use-case';
import {
  PAYMENT_METHOD_ID,
  OTHER_PAYMENT_METHOD_ID,
  makePaymentMethod,
  makePaymentMethodRepositories,
  ORGANIZATION_ID,
  OTHER_ORGANIZATION_ID,
} from '../../../tests/payment-methods-test-factory';

describe('ListPaymentMethodsUseCase', () => {
  async function setup() {
    const repos = makePaymentMethodRepositories();
    const useCase = new ListPaymentMethodsUseCase(
      repos.paymentMethodRepository,
    );

    await repos.paymentMethodRepository.save(
      makePaymentMethod({
        id: PAYMENT_METHOD_ID,
        name: 'Dinheiro',
        systemKey: 'pm-dinheiro',
        isSystem: true,
      }),
    );
    await repos.paymentMethodRepository.save(
      makePaymentMethod({ id: OTHER_PAYMENT_METHOD_ID, name: 'Vale Cultura' }),
    );
    await repos.paymentMethodRepository.softDelete(
      ORGANIZATION_ID,
      OTHER_PAYMENT_METHOD_ID,
      new Date(),
    );

    return { ...repos, useCase };
  }

  it('lista só as ativas por padrão e conta as duas abas', async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({ organizationId: ORGANIZATION_ID });

    expect(result.items.map((item) => item.id)).toEqual([PAYMENT_METHOD_ID]);
    expect(result.total).toBe(1);
    expect(result.tabCounts).toEqual({ active: 1, deleted: 1 });
  });

  it('lista só as excluídas na aba "deleted"', async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      tab: 'deleted',
    });

    expect(result.items.map((item) => item.id)).toEqual([
      OTHER_PAYMENT_METHOD_ID,
    ]);
    expect(result.total).toBe(1);
  });

  it('não devolve forma de pagamento de outra organização', async () => {
    const { useCase } = await setup();

    const result = await useCase.execute({
      organizationId: OTHER_ORGANIZATION_ID,
    });

    expect(result.items).toHaveLength(0);
    expect(result.tabCounts).toEqual({ active: 0, deleted: 0 });
  });
});
