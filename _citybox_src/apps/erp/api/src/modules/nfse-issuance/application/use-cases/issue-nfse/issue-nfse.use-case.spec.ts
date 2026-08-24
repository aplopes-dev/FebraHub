import { IssueNfseUseCase } from './issue-nfse.use-case';
import { ResolveServiceIssqnUseCase } from '../../../../fiscal-defaults/application/use-cases/resolve-service-issqn/resolve-service-issqn.use-case';
import { InMemoryFiscalGroupRepository } from '../../../../fiscal-defaults/tests/in-memory-fiscal-group.repository';
import { FiscalGroup } from '../../../../fiscal-defaults/domain/entities/fiscal-group.entity';
import { OrganizationRepository } from '../../../../tenancy/domain/repositories/organization.repository.interface';
import type { Organization } from '../../../../tenancy/domain/entities/organization.entity';
import {
  makeOrganization,
  ORGANIZATION_DOCUMENT,
  ORGANIZATION_ID,
} from '../../../../tenancy/tests/tenancy-test-factory';
import { InMemoryNfseIssuanceRepository } from '../../../tests/in-memory-nfse-issuance.repository';
import { FakeFiscalApiClient } from '../../../tests/fake-fiscal-api-client';
import { FiscalApiEmissionError } from '../../../domain/errors/fiscal-api-emission.error';
import type { IssueNfseInput } from '../../dtos/issue-nfse.dto';

const ORG = ORGANIZATION_ID;
const COMPANY_ID = 'company-1';

/** Stub mínimo: só `findById` importa para o caso de uso. */
class StubOrganizationRepository extends OrganizationRepository {
  constructor(private readonly org: Organization | null) {
    super();
  }
  findById(): Promise<Organization | null> {
    return Promise.resolve(this.org);
  }
  findByDocument(): Promise<Organization | null> {
    return Promise.resolve(this.org);
  }
  findByPlatformStoreId(): Promise<Organization | null> {
    throw new Error('not used');
  }
  createWithOwner(): Promise<never> {
    throw new Error('not used');
  }
  save(): Promise<Organization> {
    throw new Error('not used');
  }
  findAllByUser(): Promise<never> {
    throw new Error('not used');
  }
}

function baseInput(overrides: Partial<IssueNfseInput> = {}): IssueNfseInput {
  return {
    organizationId: ORG,
    issqnGroupId: 'group-1',
    externalReference: 'op-0001',
    customer: {
      documentType: 'CPF',
      document: '12345678900',
      name: 'Cliente Teste',
    },
    serviceDescription: 'Consultoria em TI',
    totalValue: 1000,
    issWithheld: false,
    ...overrides,
  };
}

describe('IssueNfseUseCase (spec erp/018)', () => {
  let groupRepo: InMemoryFiscalGroupRepository;
  let issuanceRepo: InMemoryNfseIssuanceRepository;
  let client: FakeFiscalApiClient;
  let useCase: IssueNfseUseCase;

  beforeEach(() => {
    groupRepo = new InMemoryFiscalGroupRepository();
    issuanceRepo = new InMemoryNfseIssuanceRepository();
    client = new FakeFiscalApiClient();
    // Emitente resolvido pelo CNPJ da organização (não vem do cliente).
    client.companyIdByCnpj.set(
      ORGANIZATION_DOCUMENT.replace(/\D/g, ''),
      COMPANY_ID,
    );
    const orgRepo = new StubOrganizationRepository(
      makeOrganization({ id: ORG }),
    );
    useCase = new IssueNfseUseCase(
      issuanceRepo,
      orgRepo,
      new ResolveServiceIssqnUseCase(groupRepo),
      client,
    );
    groupRepo.seed(
      FiscalGroup.createIssqn(
        ORG,
        {
          name: 'TI',
          issqnServiceCode: '01.07',
          issqnNationalCode: '010700',
          issqnRate: 5,
          issqnTribType: '2',
        },
        'group-1',
      ),
    );
  });

  it('resolve o Emitente pelo CNPJ da org, emite e registra o vínculo em HOMOLOGAÇÃO', async () => {
    const saved = await useCase.execute(baseInput());

    expect(saved.status).toBe('AUTHORIZED');
    expect(saved.companyId).toBe(COMPANY_ID);
    expect(saved.environment).toBe('HOMOLOGATION');
    expect(saved.fiscalDocumentId).toBe('fiscal-document-1');

    expect(client.requests).toHaveLength(1);
    const req = client.requests[0];
    // O companyId enviado é o resolvido do CNPJ, não um id do cliente.
    expect(req.companyId).toBe(COMPANY_ID);
    expect(req.environment).toBe('HOMOLOGATION');
    expect(req.nfse.municipalServiceCode).toBe('01.07');
    expect(req.nfse.tribISSQN).toBe('2');
    expect(req.items[0].totalValue).toBe(1000);
  });

  it('propaga errorCode/errorMessage do órgão até a entidade salva quando REJECTED (spec erp/028)', async () => {
    client.result = {
      status: 'REJECTED',
      accessKey: null,
      protocol: null,
      errorCode: 'E0116',
      errorMessage:
        'A IM deve ser informada para o emitente prestador do serviço na DPS.',
      documentId: 'fiscal-document-1',
    };

    const saved = await useCase.execute(baseInput());

    expect(saved.status).toBe('REJECTED');
    expect(saved.errorCode).toBe('E0116');
    expect(saved.errorMessage).toBe(
      'A IM deve ser informada para o emitente prestador do serviço na DPS.',
    );
  });

  it('é idempotente: a mesma operação não emite uma segunda nota', async () => {
    const first = await useCase.execute(baseInput());
    const second = await useCase.execute(baseInput());

    expect(second.id).toBe(first.id);
    expect(client.requests).toHaveLength(1);
  });

  it('propaga a exigibilidade do grupo (tribISSQN) — não fixa em 1', async () => {
    await useCase.execute(baseInput());
    expect(client.requests[0].nfse.tribISSQN).toBe('2');
  });

  it('com retenção envia a alíquota do grupo e issWithheld=true', async () => {
    await useCase.execute(baseInput({ issWithheld: true }));
    const req = client.requests[0];
    expect(req.nfse.issWithheld).toBe(true);
    expect(req.nfse.issRate).toBe(5);
  });

  it('recusa emissão quando o grupo não existe', async () => {
    await expect(
      useCase.execute(baseInput({ issqnGroupId: 'inexistente' })),
    ).rejects.toBeInstanceOf(FiscalApiEmissionError);
    expect(client.requests).toHaveLength(0);
  });

  it('recusa quando não há Emitente para o CNPJ da organização', async () => {
    client.companyIdByCnpj.clear();
    await expect(useCase.execute(baseInput())).rejects.toBeInstanceOf(
      FiscalApiEmissionError,
    );
    expect(client.requests).toHaveLength(0);
  });

  it('propaga o erro traduzido do órgão (ex.: E0116)', async () => {
    client.error = new FiscalApiEmissionError(
      'A Inscrição Municipal da empresa não está registrada no CNC.',
      'E0116',
    );
    await expect(useCase.execute(baseInput())).rejects.toThrow(/CNC/i);
    expect(await issuanceRepo.listByOrganization(ORG)).toHaveLength(0);
  });

  // spec erp/025 (P2) — ambiente vem de Company.defaultEnvironment, não fixo.
  describe('ambiente de emissão (spec erp/025, P2)', () => {
    it('recusa emitir quando o Emitente está em PRODUCTION — plataforma só sustenta homologação hoje', async () => {
      client.defaultEnvironmentByCnpj.set(
        ORGANIZATION_DOCUMENT.replace(/\D/g, ''),
        'PRODUCTION',
      );

      await expect(useCase.execute(baseInput())).rejects.toThrow(
        /produção|homologação/i,
      );
    });

    it('a recusa por PRODUCTION acontece ANTES de reservar idempotencyKey ou gravar NfseIssuance', async () => {
      client.defaultEnvironmentByCnpj.set(
        ORGANIZATION_DOCUMENT.replace(/\D/g, ''),
        'PRODUCTION',
      );

      await expect(useCase.execute(baseInput())).rejects.toThrow();

      expect(client.requests).toHaveLength(0);
      expect(await issuanceRepo.listByOrganization(ORG)).toHaveLength(0);
    });
  });
});
