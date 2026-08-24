import { AddressRequiredError } from '../../domain/errors/pos-delivery.errors';
import { InMemoryPosDeliveryOrderRepository } from '../../tests/in-memory-pos-delivery-order.repository';
import { CreatePosDeliveryOrderUseCase } from './pos-delivery.use-cases';

const ORGANIZATION_ID = '11111111-1111-4111-8111-111111111111';
const BRANCH_A = '22222222-2222-4222-8222-222222222222';
const BRANCH_B = '33333333-3333-4333-8333-333333333333';
const PRODUCT_ID = '44444444-4444-4444-8444-444444444444';

const baseInput = {
  organizationId: ORGANIZATION_ID,
  branchId: BRANCH_A,
  posTerminalId: '55555555-5555-4555-8555-555555555555',
  operatorUserId: '66666666-6666-4666-8666-666666666666',
  fulfillment: 'pickup' as const,
  customerName: 'Bruno',
  feeCents: 0,
  lines: [
    {
      productId: PRODUCT_ID,
      productName: 'Pizza',
      quantity: '1',
      unitPriceCents: 4500,
      notes: '',
    },
  ],
};

describe('CreatePosDeliveryOrderUseCase', () => {
  it('numbers orders independently per branch', async () => {
    const repository = new InMemoryPosDeliveryOrderRepository();
    const useCase = new CreatePosDeliveryOrderUseCase(repository);

    const first = await useCase.execute(baseInput);
    const second = await useCase.execute(baseInput);
    const otherBranch = await useCase.execute({
      ...baseInput,
      branchId: BRANCH_B,
    });

    expect([
      first.order.number,
      second.order.number,
      otherBranch.order.number,
    ]).toEqual([1, 2, 1]);
    expect(first.saleOrderId).toBeNull();
  });

  it('requires an address for delivery fulfillment', async () => {
    const useCase = new CreatePosDeliveryOrderUseCase(
      new InMemoryPosDeliveryOrderRepository(),
    );

    await expect(
      useCase.execute({
        ...baseInput,
        fulfillment: 'delivery',
        addressText: ' ',
      }),
    ).rejects.toBeInstanceOf(AddressRequiredError);
  });
});
