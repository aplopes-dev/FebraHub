import { describe, expect, it } from 'vitest';
import { inferDemoSeedMember } from './demo-seed-member';

describe('inferDemoSeedMember', () => {
  const storeId = '705fb230-f40f-4f19-8da7-231b14983b80';

  it('confia no flag da API quando true', () => {
    expect(
      inferDemoSeedMember({
        username: 'qualquer',
        storeId,
        isDemoSeedMember: true,
      }),
    ).toBe(true);
  });

  it('identifica demo pelo username e sobrenome Demo', () => {
    expect(
      inferDemoSeedMember({
        username: 'dentista.705fb230',
        lastName: 'Demo',
        storeId,
      }),
    ).toBe(true);
  });

  it('identifica demo pelo e-mail seed mesmo sem sobrenome Demo', () => {
    expect(
      inferDemoSeedMember({
        username: 'dentista.705fb230',
        email: 'dentista.705fb230@seed.citybox.local',
        storeId,
      }),
    ).toBe(true);
  });

  it('não marca usuário real com username parecido', () => {
    expect(
      inferDemoSeedMember({
        username: 'dentista.705fb230',
        lastName: 'Silva',
        email: 'dentista@clinica.com',
        storeId,
      }),
    ).toBe(false);
  });
});
