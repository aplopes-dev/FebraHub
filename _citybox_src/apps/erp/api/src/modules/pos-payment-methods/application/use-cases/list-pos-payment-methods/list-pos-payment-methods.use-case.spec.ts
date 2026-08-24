import { PaymentMethod } from '../../../../finance/payment-methods/domain/entities/payment-method.entity';
import { PaymentMethodRepository } from '../../../../finance/payment-methods/domain/repositories/payment-method.repository.interface';
import { ListPosPaymentMethodsUseCase } from './list-pos-payment-methods.use-case';

const ORG = '11111111-1111-4111-8111-111111111111';

class FakePaymentMethodRepository extends PaymentMethodRepository {
  constructor(private readonly items: PaymentMethod[]) {
    super();
  }

  async findById(): Promise<PaymentMethod | null> {
    return null;
  }
  async findByIds(): Promise<PaymentMethod[]> {
    return [];
  }
  async findByName(): Promise<PaymentMethod | null> {
    return null;
  }
  async findAll(
    organizationId: string,
    criteria?: { tab?: string },
  ): Promise<PaymentMethod[]> {
    expect(organizationId).toBe(ORG);
    expect(criteria?.tab).toBe('active');
    return this.items;
  }
  async count(): Promise<number> {
    return this.items.length;
  }
  async countByTabs() {
    return { active: this.items.length, deleted: 0 };
  }
  async countUsage(): Promise<number> {
    return 0;
  }
  async save(method: PaymentMethod): Promise<PaymentMethod> {
    return method;
  }
  async softDelete(): Promise<void> {}
  async clearDeletedAt(): Promise<void> {}
}

describe('ListPosPaymentMethodsUseCase', () => {
  it('lista só ativos da organização do terminal', async () => {
    const pix = PaymentMethod.create(
      { organizationId: ORG, name: 'PIX', systemKey: 'pm-pix' },
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    );
    const useCase = new ListPosPaymentMethodsUseCase(
      new FakePaymentMethodRepository([pix]),
    );

    const result = await useCase.execute({ organizationId: ORG });

    expect(result).toHaveLength(1);
    expect(result[0].systemKey).toBe('pm-pix');
  });
});
