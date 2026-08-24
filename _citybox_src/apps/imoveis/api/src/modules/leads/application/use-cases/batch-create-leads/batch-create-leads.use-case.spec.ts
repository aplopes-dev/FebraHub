import { InMemoryLeadRepository } from '../../../infrastructure/database/in-memory-lead.repository';
import { InMemoryAppointmentRepository } from '../../../../appointments/infrastructure/database/in-memory-appointment.repository';
import { InMemoryDealRepository } from '../../../../deals/infrastructure/database/in-memory-deal.repository';
import { makeCreateLeadUseCase } from '../shared/lead-use-case-test-fixtures';
import { BatchCreateLeadsUseCase } from './batch-create-leads.use-case';

const STORE = 'store-batch';
const AGENT = 'agent-csv';

describe('BatchCreateLeadsUseCase', () => {
  it('cria leads com store e corretor da sessão e retorna successCount', async () => {
    const repo = new InMemoryLeadRepository();
    const appointments = new InMemoryAppointmentRepository();
    const deals = new InMemoryDealRepository();
    const create = makeCreateLeadUseCase(repo, appointments, deals);
    const useCase = new BatchCreateLeadsUseCase(create);

    const result = await useCase.execute({
      storeId: STORE,
      assignedAgentId: AGENT,
      leads: [
        {
          name: 'Maria Import',
          phone: '(73) 90000-0001',
          email: 'maria@import.test',
          notes: 'CSV linha 1',
        },
        {
          name: 'João Import',
          phone: '(73) 90000-0002',
        },
        { name: '   ' },
      ],
    });

    expect(result.successCount).toBe(2);
    expect(result.skippedCount).toBe(1);

    const listed = await repo.findMany(STORE, {
      page: 1,
      perPage: 20,
    });
    expect(listed.items).toHaveLength(2);
    expect(listed.items.every((l) => l.storeId === STORE)).toBe(true);
    expect(listed.items.every((l) => l.agentId === AGENT)).toBe(true);
    expect(listed.items.every((l) => l.agentIds.includes(AGENT))).toBe(true);
    expect(listed.items.every((l) => l.status === 'new')).toBe(true);
    expect(listed.items.every((l) => l.leadSource === 'walk-in')).toBe(true);

    const maria = listed.items.find((l) => l.name === 'Maria Import');
    expect(maria?.notes).toBe('CSV linha 1');
    expect(maria?.email).toBe('maria@import.test');
  });

  it('rejeita sem assignedAgentId', async () => {
    const useCase = new BatchCreateLeadsUseCase(
      makeCreateLeadUseCase(new InMemoryLeadRepository()),
    );

    await expect(
      useCase.execute({
        storeId: STORE,
        assignedAgentId: '  ',
        leads: [{ name: 'X' }],
      }),
    ).rejects.toMatchObject({
      externalMessage: expect.stringContaining('corretor'),
    });
  });
});
