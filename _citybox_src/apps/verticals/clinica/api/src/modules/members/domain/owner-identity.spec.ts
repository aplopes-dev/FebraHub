import {
  buildDedicatedOwnerKeycloakEmail,
  buildOwnerUsernameBase,
  normalizeUsername,
  resolveAvailableUsername,
  splitResponsibleName,
} from './owner-identity';

const STORE_ID = 'a1b2c3d4-1111-4111-8111-111111111111';

describe('splitResponsibleName', () => {
  it('divide nome completo em primeiro nome e o restante', () => {
    expect(splitResponsibleName('Ana Maria da Silva')).toEqual({
      firstName: 'Ana',
      lastName: 'Maria da Silva',
    });
  });

  it('deixa o sobrenome vazio quando vem só um nome (não inventa sobrenome)', () => {
    expect(splitResponsibleName('Madonna')).toEqual({
      firstName: 'Madonna',
      lastName: '',
    });
  });

  it('ignora espaços extras', () => {
    expect(splitResponsibleName('  Maria   Silva  ')).toEqual({
      firstName: 'Maria',
      lastName: 'Silva',
    });
  });

  it('retorna null quando não há nome utilizável', () => {
    expect(splitResponsibleName(null)).toBeNull();
    expect(splitResponsibleName(undefined)).toBeNull();
    expect(splitResponsibleName('   ')).toBeNull();
  });
});

describe('normalizeUsername', () => {
  it('remove acentos e normaliza para minúsculas', () => {
    expect(normalizeUsername('José Antônio')).toBe('jose.antonio');
  });

  it('colapsa separadores repetidos e apara as pontas', () => {
    expect(normalizeUsername('  --maria___silva!!  ')).toBe('maria.silva');
  });

  it('preserva ponto, hífen e underscore isolados', () => {
    expect(normalizeUsername('maria-silva_2')).toBe('maria-silva_2');
  });
});

describe('buildOwnerUsernameBase', () => {
  const name = { firstName: 'Maria', lastName: 'Silva' };

  it('prefere a parte antes do @ do e-mail de cobrança', () => {
    expect(
      buildOwnerUsernameBase({
        email: 'Maria.Silva@clinica.com.br',
        name,
        storeId: STORE_ID,
      }),
    ).toBe('maria.silva');
  });

  it('cai para o nome quando não há e-mail', () => {
    expect(
      buildOwnerUsernameBase({ email: null, name, storeId: STORE_ID }),
    ).toBe('maria.silva');
  });

  it('cai para o nome quando o e-mail não sobrevive à normalização', () => {
    expect(
      buildOwnerUsernameBase({
        email: '??@clinica.com',
        name,
        storeId: STORE_ID,
      }),
    ).toBe('maria.silva');
  });

  it('usa fallback determinístico pelo storeId quando nem nome nem e-mail servem', () => {
    const base = buildOwnerUsernameBase({
      email: null,
      name: { firstName: '李', lastName: '' },
      storeId: STORE_ID,
    });
    expect(base).toBe('responsavel.a1b2c3d4');
  });
});

describe('resolveAvailableUsername', () => {
  it('devolve a própria base quando está livre', async () => {
    const resolved = await resolveAvailableUsername(
      'maria.silva',
      async () => false,
    );
    expect(resolved).toBe('maria.silva');
  });

  it('desempata com sufixo numérico sequencial e determinístico', async () => {
    const taken = new Set(['maria.silva', 'maria.silva2']);
    const probed: string[] = [];

    const resolved = await resolveAvailableUsername(
      'maria.silva',
      async (c) => {
        probed.push(c);
        return taken.has(c);
      },
    );

    expect(resolved).toBe('maria.silva3');
    expect(probed).toEqual(['maria.silva', 'maria.silva2', 'maria.silva3']);
  });

  it('falha em vez de girar para sempre quando o probe diz que tudo está ocupado', async () => {
    await expect(
      resolveAvailableUsername('maria.silva', async () => true),
    ).rejects.toThrow(/username livre/);
  });
});

describe('buildDedicatedOwnerKeycloakEmail', () => {
  it('usa plus-addressing com sufixo da store no e-mail real', () => {
    expect(
      buildDedicatedOwnerKeycloakEmail('Maria.Silva@Clinica.com.br', STORE_ID),
    ).toBe('maria.silva+clinica1b2c3d4@clinica.com.br');
  });

  it('cai em domínio local quando não há e-mail', () => {
    expect(buildDedicatedOwnerKeycloakEmail(null, STORE_ID)).toBe(
      'owner.a1b2c3d4@clinic.citybox.local',
    );
  });
});
