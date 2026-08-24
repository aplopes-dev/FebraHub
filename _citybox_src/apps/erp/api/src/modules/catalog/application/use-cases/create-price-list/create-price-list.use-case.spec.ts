import { CreatePriceListUseCase } from './create-price-list.use-case';
import { PriceListNameTakenError } from '../../../domain/errors/price-list-name-taken.error';
import { PriceListInvalidDatesError } from '../../../domain/errors/price-list-invalid-dates.error';
import { InMemoryPriceListRepository } from '../../../tests/in-memory-price-list.repository';
import { STORE_ID } from '../../../tests/catalog-test-factory';
import { PriceList } from '../../../domain/entities/price-list.entity';

describe('CreatePriceListUseCase', () => {
  function setup() {
    const priceListRepository = new InMemoryPriceListRepository();
    const useCase = new CreatePriceListUseCase(priceListRepository);
    return { priceListRepository, useCase };
  }

  it('cria lista com prioridade max+1', async () => {
    const { useCase, priceListRepository } = setup();
    await priceListRepository.save(
      PriceList.create(
        {
          organizationId: STORE_ID,
          name: 'Padrão',
          adjustmentType: 'manual',
          priority: 0,
        },
        'pl-1',
      ),
    );

    const created = await useCase.execute({
      organizationId: STORE_ID,
      name: ' Atacado ',
      adjustmentType: 'percent_discount',
      adjustmentValue: 15,
      channels: ['pdv'],
      startDate: null,
      endDate: null,
      active: true,
    });

    expect(created.name).toBe('Atacado');
    expect(created.priority).toBe(1);
    expect(created.adjustmentValue).toBe(15);
  });

  it('rejeita nome duplicado', async () => {
    const { useCase, priceListRepository } = setup();
    await priceListRepository.save(
      PriceList.create({
        organizationId: STORE_ID,
        name: 'VIP',
        adjustmentType: 'manual',
      }),
    );

    await expect(
      useCase.execute({
        organizationId: STORE_ID,
        name: 'vip',
        adjustmentType: 'manual',
        adjustmentValue: 0,
        channels: [],
        startDate: null,
        endDate: null,
        active: true,
      }),
    ).rejects.toBeInstanceOf(PriceListNameTakenError);
  });

  it('rejeita vigência inválida', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({
        organizationId: STORE_ID,
        name: 'Promo',
        adjustmentType: 'manual',
        adjustmentValue: 0,
        channels: [],
        startDate: new Date('2026-07-31T00:00:00.000Z'),
        endDate: new Date('2026-07-01T00:00:00.000Z'),
        active: true,
      }),
    ).rejects.toBeInstanceOf(PriceListInvalidDatesError);
  });
});
