import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ListSaleOrdersQueryDto } from './sale-order.dto';

describe('ListSaleOrdersQueryDto', () => {
  it('aceita statuses como valor único na query string', async () => {
    const dto = plainToInstance(ListSaleOrdersQueryDto, {
      statuses: 'closed',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.statuses).toEqual(['closed']);
  });

  it('aceita statuses como array (múltiplos valores)', async () => {
    const dto = plainToInstance(ListSaleOrdersQueryDto, {
      statuses: ['closed', 'open'],
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.statuses).toEqual(['closed', 'open']);
  });

  it('rejeita statuses inválido', async () => {
    const dto = plainToInstance(ListSaleOrdersQueryDto, {
      statuses: 'nope',
    });

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });

  it('aceita dateFrom/dateTo ISO (presets resolvidos no cliente)', async () => {
    const dto = plainToInstance(ListSaleOrdersQueryDto, {
      dateFrom: '2026-07-15T03:00:00.000Z',
      dateTo: '2026-08-13T02:59:59.999Z',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.dateFrom).toBe('2026-07-15T03:00:00.000Z');
    expect(dto.dateTo).toBe('2026-08-13T02:59:59.999Z');
  });
});
