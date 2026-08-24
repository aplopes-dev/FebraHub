import { PinHasher } from './pin-hasher';

describe('PinHasher', () => {
  it('o hash não contém o PIN e se descreve sozinho', async () => {
    const hash = await PinHasher.hash('1234');

    expect(hash).not.toContain('1234');
    // Prefixo com algoritmo e parâmetros: é o que permite trocar de algoritmo
    // depois sem migration de dados.
    expect(hash.startsWith('scrypt$65536$8$1$')).toBe(true);
  });

  it('confere o PIN correto e recusa o errado', async () => {
    const hash = await PinHasher.hash('1234');

    await expect(PinHasher.verify('1234', hash)).resolves.toBe(true);
    await expect(PinHasher.verify('1235', hash)).resolves.toBe(false);
    await expect(PinHasher.verify('', hash)).resolves.toBe(false);
  });

  it('o mesmo PIN gera hashes diferentes (salt)', async () => {
    const [a, b] = await Promise.all([
      PinHasher.hash('1234'),
      PinHasher.hash('1234'),
    ]);

    expect(a).not.toBe(b);
    // …e ainda assim os dois conferem.
    await expect(PinHasher.verify('1234', a)).resolves.toBe(true);
    await expect(PinHasher.verify('1234', b)).resolves.toBe(true);
  });

  it('hash corrompido devolve false, não explode', async () => {
    for (const corrupted of [
      '',
      'lixo',
      'scrypt$65536$8$1$soh-quatro-partes',
      'argon2$1$2$3$c2FsdA==$aGFzaA==',
      'scrypt$abc$8$1$c2FsdA==$aGFzaA==',
    ]) {
      await expect(PinHasher.verify('1234', corrupted)).resolves.toBe(false);
    }
  });
});
