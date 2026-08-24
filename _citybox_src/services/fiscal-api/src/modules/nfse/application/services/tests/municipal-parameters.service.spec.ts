import { MunicipalParametersService } from '../municipal-parameters.service';
import { InMemoryMunicipalParametersRepository } from '../../../tests/in-memory-municipal-parameters.repository';
import { MunicipalParameters } from '../../../domain/entities/municipal-parameters.entity';
import { callSefin } from '../../../../../shared/infra/fiscal-http/sefin-http-client';

jest.mock('../../../../../shared/infra/fiscal-http/sefin-http-client', () => ({
  callSefin: jest.fn(),
}));

const callSefinMock = callSefin as jest.MockedFunction<typeof callSefin>;

const CITY = '2913606';
const KEY_MATERIAL = {
  privateKeyPem: '-----BEGIN PRIVATE KEY-----\nfake\n-----END PRIVATE KEY-----',
  certificatePem:
    '-----BEGIN CERTIFICATE-----\nfake\n-----END CERTIFICATE-----',
};

function buildService() {
  const repository = new InMemoryMunicipalParametersRepository();
  return { repository, service: new MunicipalParametersService(repository) };
}

/// A parametrização decide **prazos fiscais** (cancelamento direto vs. análise
/// fiscal, exigência de tomador). O comportamento em falha não é detalhe de
/// infraestrutura — é decisão de negócio, e por isso é testado.
describe('MunicipalParametersService', () => {
  beforeEach(() => callSefinMock.mockReset());

  it('serves the cache without calling the tax authority while it is fresh', async () => {
    const { repository, service } = buildService();
    await repository.save(
      MunicipalParameters.create({
        cityCodeIbge: CITY,
        parameters: { prazoCancelamento: 5 },
        fetchedAt: new Date(),
      }),
    );

    const resolved = await service.resolve({
      cityCodeIbge: CITY,
      environment: 'HOMOLOGATION',
      ...KEY_MATERIAL,
    });

    expect(resolved?.cancelDeadlineDays).toBe(5);
    expect(callSefinMock).not.toHaveBeenCalled();
  });

  it('refreshes from the tax authority when the cache is stale', async () => {
    const { repository, service } = buildService();
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    await repository.save(
      MunicipalParameters.create({
        cityCodeIbge: CITY,
        parameters: { prazoCancelamento: 5 },
        fetchedAt: twoDaysAgo,
      }),
    );
    callSefinMock.mockResolvedValue({
      statusCode: 200,
      rawBody: '{}',
      json: { prazoCancelamento: 15 },
    });

    const resolved = await service.resolve({
      cityCodeIbge: CITY,
      environment: 'HOMOLOGATION',
      ...KEY_MATERIAL,
    });

    expect(callSefinMock).toHaveBeenCalledTimes(1);
    expect(resolved?.cancelDeadlineDays).toBe(15);
  });

  /// A decisão que mais importa aqui: derrubar uma emissão porque o serviço de
  /// parametrização está fora do ar seria pior do que operar com o prazo de
  /// ontem, que quase certamente ainda vale.
  it('falls back to the stale cache when the tax authority is unreachable', async () => {
    const { repository, service } = buildService();
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    await repository.save(
      MunicipalParameters.create({
        cityCodeIbge: CITY,
        parameters: { prazoCancelamento: 7 },
        fetchedAt: twoDaysAgo,
      }),
    );
    callSefinMock.mockRejectedValue(new Error('conexão recusada'));

    const resolved = await service.resolve({
      cityCodeIbge: CITY,
      environment: 'HOMOLOGATION',
      ...KEY_MATERIAL,
    });

    expect(resolved?.cancelDeadlineDays).toBe(7);
  });

  /// Sem cache nenhum devolve `null` em vez de inventar valores: quem chama
  /// decide, e a decisão conservadora é dele — `resolveCancelPath` encaminha
  /// para análise fiscal, `resolveSubstitutionBlocker` recusa.
  it('returns null when unreachable and there is nothing cached', async () => {
    const { service } = buildService();
    callSefinMock.mockRejectedValue(new Error('conexão recusada'));

    const resolved = await service.resolve({
      cityCodeIbge: CITY,
      environment: 'HOMOLOGATION',
      ...KEY_MATERIAL,
    });

    expect(resolved).toBeNull();
  });

  /// Resposta que não é objeto vira parametrização vazia, não exceção: o órgão
  /// devolvendo algo inesperado não pode derrubar quem só queria saber o prazo.
  it('treats a non-object response as empty parameters rather than throwing', async () => {
    const { service } = buildService();
    callSefinMock.mockResolvedValue({
      statusCode: 200,
      rawBody: 'texto',
      json: 'texto',
    });

    const resolved = await service.resolve({
      cityCodeIbge: CITY,
      environment: 'HOMOLOGATION',
      ...KEY_MATERIAL,
    });

    expect(resolved).not.toBeNull();
    expect(resolved?.cancelDeadlineDays).toBeNull();
  });
});
