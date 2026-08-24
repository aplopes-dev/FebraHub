import { extractServiceOrderSaleLines } from './extract-service-order-sale-lines';

describe('extractServiceOrderSaleLines (spec erp/031 D1)', () => {
  it('extrai uma linha de serviço (sem productId) com description', () => {
    const lines = extractServiceOrderSaleLines({
      lines: [
        {
          productId: null,
          description: 'Troca de óleo',
          quantity: '1',
          unitPriceCents: 15000,
        },
      ],
    });

    expect(lines).toHaveLength(1);
    expect(lines[0]).toEqual({
      productId: null,
      description: 'Troca de óleo',
      quantity: '1',
      unitPriceCents: 15000,
    });
  });

  it('extrai uma mistura de linha de produto e de serviço', () => {
    const lines = extractServiceOrderSaleLines({
      lines: [
        { productId: 'prod-1', quantity: '2', unitPriceCents: 5000 },
        {
          productId: null,
          description: 'Mão de obra',
          quantity: '1',
          unitPriceCents: 8000,
        },
      ],
    });

    expect(lines).toHaveLength(2);
    expect(lines[0].productId).toBe('prod-1');
    expect(lines[1].productId).toBeNull();
  });

  it('descarta uma linha sem productId e sem description', () => {
    const lines = extractServiceOrderSaleLines({
      lines: [{ productId: null, quantity: '1', unitPriceCents: 1000 }],
    });

    expect(lines).toHaveLength(0);
  });

  it('descarta uma linha de serviço com description vazia', () => {
    const lines = extractServiceOrderSaleLines({
      lines: [
        {
          productId: null,
          description: '   ',
          quantity: '1',
          unitPriceCents: 1000,
        },
      ],
    });

    expect(lines).toHaveLength(0);
  });

  it('mantém uma linha de serviço com unitPriceCents zero (serviço cortesia)', () => {
    const lines = extractServiceOrderSaleLines({
      lines: [
        {
          productId: null,
          description: 'Cortesia',
          quantity: '1',
          unitPriceCents: 0,
        },
      ],
    });

    expect(lines).toHaveLength(1);
    expect(lines[0].unitPriceCents).toBe(0);
  });

  it('devolve array vazio quando payloadJson.lines está ausente', () => {
    expect(extractServiceOrderSaleLines({})).toEqual([]);
    expect(extractServiceOrderSaleLines(null)).toEqual([]);
    expect(extractServiceOrderSaleLines({ lines: 'not-an-array' })).toEqual([]);
  });
});
