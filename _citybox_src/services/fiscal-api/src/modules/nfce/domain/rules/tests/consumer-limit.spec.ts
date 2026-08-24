import {
  consumerIdentificationLimitFor,
  requiresConsumerIdentification,
  DEFAULT_CONSUMER_IDENTIFICATION_LIMIT,
} from '../consumer-limit';

describe('limite de valor sem identificacao do consumidor (FR-004)', () => {
  const ENV_BA = 'NFCE_CONSUMER_LIMIT_BA';

  afterEach(() => {
    delete process.env[ENV_BA];
  });

  it('nao exige identificacao abaixo do limite', () => {
    expect(requiresConsumerIdentification('BA', 85)).toBe(false);
  });

  it('exige identificacao acima do limite', () => {
    expect(
      requiresConsumerIdentification(
        'BA',
        DEFAULT_CONSUMER_IDENTIFICATION_LIMIT + 0.01,
      ),
    ).toBe(true);
  });

  it('o valor EXATAMENTE no limite ainda passa sem identificacao', () => {
    // A regra é "acima de", não "a partir de". Errar a borda aqui recusaria
    // vendas legítimas no valor cheio — e o operador não teria como saber por
    // quê, porque o valor bate com o limite publicado.
    expect(
      requiresConsumerIdentification(
        'BA',
        DEFAULT_CONSUMER_IDENTIFICATION_LIMIT,
      ),
    ).toBe(false);
  });

  it('o limite e configuravel por UF sem deploy', () => {
    // ⚠️ A razão de o limite não ser constante de código: é legislação
    // **estadual** e muda sem aviso. Um valor cravado no fonte transformaria
    // uma mudança de decreto em incidente de produção esperando release.
    process.env[ENV_BA] = '500';

    expect(consumerIdentificationLimitFor('BA')).toBe(500);
    expect(requiresConsumerIdentification('BA', 600)).toBe(true);
    expect(requiresConsumerIdentification('BA', 400)).toBe(false);
  });

  it('ignora configuracao invalida e cai no padrao, em vez de liberar tudo', () => {
    // Um `Number('abc')` viraria NaN, e toda comparação com NaN é falsa — ou
    // seja, o limite deixaria de existir em silêncio e cupons de qualquer valor
    // passariam sem identificação. Cair no padrão é a falha segura.
    process.env[ENV_BA] = 'nao-e-numero';
    expect(consumerIdentificationLimitFor('BA')).toBe(
      DEFAULT_CONSUMER_IDENTIFICATION_LIMIT,
    );

    process.env[ENV_BA] = '-1';
    expect(consumerIdentificationLimitFor('BA')).toBe(
      DEFAULT_CONSUMER_IDENTIFICATION_LIMIT,
    );

    process.env[ENV_BA] = '0';
    expect(consumerIdentificationLimitFor('BA')).toBe(
      DEFAULT_CONSUMER_IDENTIFICATION_LIMIT,
    );
  });

  it('UF desconhecida usa o padrao em vez de falhar', () => {
    expect(consumerIdentificationLimitFor('XX')).toBe(
      DEFAULT_CONSUMER_IDENTIFICATION_LIMIT,
    );
  });

  it('aceita a UF em minusculas', () => {
    process.env[ENV_BA] = '500';
    expect(consumerIdentificationLimitFor('ba')).toBe(500);
  });
});
