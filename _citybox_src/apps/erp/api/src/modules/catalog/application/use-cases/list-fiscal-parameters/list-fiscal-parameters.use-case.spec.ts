import { ListFiscalParametersUseCase } from './list-fiscal-parameters.use-case';
import { InMemoryProductFiscalRepository } from '../../../tests/in-memory-product-fiscal.repository';
import {
  makeCategory,
  makeProduct,
  STORE_ID,
} from '../../../tests/catalog-test-factory';
import { ProductFiscal } from '../../../domain/entities/product-fiscal.entity';

describe('ListFiscalParametersUseCase', () => {
  function setup() {
    const productFiscalRepository = new InMemoryProductFiscalRepository();
    const useCase = new ListFiscalParametersUseCase(productFiscalRepository);
    const category = makeCategory();
    return { productFiscalRepository, useCase, category };
  }

  it('lista produtos com configured derivado e tabCounts', async () => {
    const { productFiscalRepository, useCase, category } = setup();
    const configured = makeProduct({ name: 'Camiseta', sku: 'A1' }, 'p1');
    const pending = makeProduct({ name: 'Calça', sku: 'B2' }, 'p2');
    productFiscalRepository.seedProduct(configured, category);
    productFiscalRepository.seedProduct(pending, category);
    await productFiscalRepository.upsert(
      ProductFiscal.create({
        organizationId: STORE_ID,
        productId: 'p1',
        ncm: '61091000',
        origin: '0',
        netWeightKg: 0.2,
        grossWeightKg: 0.3,
        cest: '',
        fcpPercent: 0,
        fcpStPercent: 0,
        fcpStRetainedPercent: 0,
        cstIbsCbs: '',
        taxClassification: '',
        icms: { value: '00', applyToAll: true },
        pisCofins: { value: '01', applyToAll: true },
        ipi: { value: '', applyToAll: true },
        cfop: { value: '5102', applyToAll: true },
        branches: [],
      }),
    );

    const result = await useCase.execute({
      organizationId: STORE_ID,
      page: 1,
      perPage: 10,
      tab: 'all',
    });

    expect(result.total).toBe(2);
    expect(result.tabCounts).toEqual({ all: 2, pending: 1 });
    expect(
      result.items.find((item) => item.productId === 'p1')?.configured,
    ).toBe(true);
    expect(
      result.items.find((item) => item.productId === 'p2')?.configured,
    ).toBe(false);
  });

  it('filtra tab pending', async () => {
    const { productFiscalRepository, useCase, category } = setup();
    productFiscalRepository.seedProduct(
      makeProduct({ name: 'Ok', sku: 'OK' }, 'p1'),
      category,
    );
    productFiscalRepository.seedProduct(
      makeProduct({ name: 'Pendente', sku: 'PEND' }, 'p2'),
      category,
    );
    await productFiscalRepository.upsert(
      ProductFiscal.create({
        organizationId: STORE_ID,
        productId: 'p1',
        ncm: '61091000',
        origin: '0',
        netWeightKg: 0,
        grossWeightKg: 0,
        cest: '',
        fcpPercent: 0,
        fcpStPercent: 0,
        fcpStRetainedPercent: 0,
        cstIbsCbs: '',
        taxClassification: '',
        icms: { value: '', applyToAll: true },
        pisCofins: { value: '', applyToAll: true },
        ipi: { value: '', applyToAll: true },
        cfop: { value: '', applyToAll: true },
      }),
    );

    const result = await useCase.execute({
      organizationId: STORE_ID,
      tab: 'pending',
    });

    expect(result.total).toBe(1);
    expect(result.items[0]?.productId).toBe('p2');
  });
});
