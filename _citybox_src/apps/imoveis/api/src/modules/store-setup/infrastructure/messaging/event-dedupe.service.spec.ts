import { EventDedupeService } from './event-dedupe.service';

describe('EventDedupeService', () => {
  it('claim retorna true na primeira vez e false em P2002', async () => {
    const create = jest
      .fn()
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce({ code: 'P2002' });
    const prisma = {
      processedEvent: { create, delete: jest.fn() },
    } as never;

    const service = new EventDedupeService(prisma);

    await expect(
      service.claim('e1', 'citybox.store.created.v1', 's1'),
    ).resolves.toBe(true);
    await expect(
      service.claim('e1', 'citybox.store.created.v1', 's1'),
    ).resolves.toBe(false);
  });

  it('release remove o claim', async () => {
    const del = jest.fn().mockResolvedValue({});
    const prisma = {
      processedEvent: { create: jest.fn(), delete: del },
    } as never;

    const service = new EventDedupeService(prisma);
    await service.release('e1');

    expect(del).toHaveBeenCalledWith({ where: { eventId: 'e1' } });
  });
});
