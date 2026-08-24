import {
  AlreadySoldError,
  CourierRequiredError,
  InvalidStatusTransitionError,
} from '../../domain/errors/pos-delivery.errors';
import { InMemoryPosDeliveryOrderRepository } from '../../tests/in-memory-pos-delivery-order.repository';
import {
  CreatePosDeliveryOrderUseCase,
  UpdatePosDeliveryOrderStatusUseCase,
} from './pos-delivery.use-cases';

const ORGANIZATION_ID = '11111111-1111-4111-8111-111111111111';
const BRANCH_ID = '22222222-2222-4222-8222-222222222222';

describe('UpdatePosDeliveryOrderStatusUseCase', () => {
  async function setup(fulfillment: 'delivery' | 'pickup' = 'delivery') {
    const repository = new InMemoryPosDeliveryOrderRepository();
    const created = await new CreatePosDeliveryOrderUseCase(repository).execute(
      {
        organizationId: ORGANIZATION_ID,
        branchId: BRANCH_ID,
        fulfillment,
        customerName: 'Cliente',
        addressText: fulfillment === 'delivery' ? 'Rua A, 10' : '',
        feeCents: 500,
        lines: [
          {
            productId: '33333333-3333-4333-8333-333333333333',
            productName: 'Produto',
            quantity: '1',
            unitPriceCents: 1000,
          },
        ],
      },
    );
    return {
      repository,
      created: created.order,
      useCase: new UpdatePosDeliveryOrderStatusUseCase(repository),
    };
  }

  it('enforces the forward status graph', async () => {
    const { useCase, created } = await setup('pickup');

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        branchId: BRANCH_ID,
        id: created.id,
        status: 'delivered',
      }),
    ).rejects.toBeInstanceOf(InvalidStatusTransitionError);
  });

  it('requires a courier to dispatch a delivery order', async () => {
    const { useCase, created } = await setup();
    await useCase.execute({
      organizationId: ORGANIZATION_ID,
      branchId: BRANCH_ID,
      id: created.id,
      status: 'preparing',
    });

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        branchId: BRANCH_ID,
        id: created.id,
        status: 'dispatched',
      }),
    ).rejects.toBeInstanceOf(CourierRequiredError);
  });

  it('blocks cancellation when operational status is delivered', async () => {
    const { repository, useCase, created } = await setup('pickup');
    await repository.save(created.markDelivered());

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        branchId: BRANCH_ID,
        id: created.id,
        status: 'cancelled',
      }),
    ).rejects.toBeInstanceOf(AlreadySoldError);
  });

  it('blocks cancellation when there is an active sale (paid)', async () => {
    const { repository, useCase, created } = await setup('pickup');
    repository.activeSaleByDeliveryId.set(created.id, 'sale-1');

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        branchId: BRANCH_ID,
        id: created.id,
        status: 'cancelled',
      }),
    ).rejects.toBeInstanceOf(AlreadySoldError);
  });

  it('allows advancing to delivered without payment', async () => {
    const { useCase, created } = await setup('pickup');
    await useCase.execute({
      organizationId: ORGANIZATION_ID,
      branchId: BRANCH_ID,
      id: created.id,
      status: 'preparing',
    });
    await useCase.execute({
      organizationId: ORGANIZATION_ID,
      branchId: BRANCH_ID,
      id: created.id,
      status: 'dispatched',
    });
    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      branchId: BRANCH_ID,
      id: created.id,
      status: 'delivered',
    });
    expect(result.order.status).toBe('delivered');
    expect(result.saleOrderId).toBeNull();
  });
});
