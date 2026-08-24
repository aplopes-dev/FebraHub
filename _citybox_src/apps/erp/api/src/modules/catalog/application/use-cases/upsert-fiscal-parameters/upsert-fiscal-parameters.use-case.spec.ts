import { UpsertFiscalParametersUseCase } from './upsert-fiscal-parameters.use-case';
import { ProductNotFoundError } from '../../../domain/errors/product-not-found.error';
import { ProductFiscalInvalidValuesError } from '../../../domain/errors/product-fiscal-invalid-values.error';
import { InMemoryProductFiscalRepository } from '../../../tests/in-memory-product-fiscal.repository';
import {
  makeProduct,
  makeRepositories,
  STORE_ID,
} from '../../../tests/catalog-test-factory';
import { BRANCH_ID } from '../../../../tenancy/tests/tenancy-test-factory';
import { BranchNotFoundError } from '../../../../tenancy/domain/errors/branch-not-found.error';
import { InMemoryFiscalGroupRepository } from '../../../../fiscal-defaults/tests/in-memory-fiscal-group.repository';
import { FiscalGroup } from '../../../../fiscal-defaults/domain/entities/fiscal-group.entity';

describe('UpsertFiscalParametersUseCase', () => {
  async function setup() {
    const repos = makeRepositories();
    await repos.seedSupport();
    const productFiscalRepository = new InMemoryProductFiscalRepository();
    const fiscalGroupRepository = new InMemoryFiscalGroupRepository();
    const product = makeProduct({}, 'prod-1');
    await repos.productRepository.save(product);
    productFiscalRepository.seedProduct(product);

    const useCase = new UpsertFiscalParametersUseCase(
      repos.productRepository,
      productFiscalRepository,
      repos.branchRepository,
      fiscalGroupRepository,
    );

    return { useCase, productFiscalRepository, fiscalGroupRepository, repos };
  }

  const baseInput = {
    organizationId: STORE_ID,
    productId: 'prod-1',
    info: {
      ncm: '61091000',
      origin: '0',
      netWeightKg: 0.25,
      grossWeightKg: 0.3,
      cest: '',
      fcpPercent: 2,
      fcpStPercent: 0,
      fcpStRetainedPercent: 0,
      cstIbsCbs: '',
      taxClassification: 'mercadoria_revenda',
    },
    group: {
      icms: { value: '00', applyToAll: true },
      pisCofins: { value: '01', applyToAll: true },
      ipi: { value: '99', applyToAll: true },
      cfop: { value: '5102', applyToAll: false },
      issqn: { value: '', applyToAll: true },
    },
    units: [
      {
        branchId: BRANCH_ID,
        icms: '',
        pisCofins: '',
        ipi: '',
        cfop: '5405',
        issqn: '',
      },
    ],
  };

  it('cria ficha fiscal e limpa overrides quando applyToAll', async () => {
    const { useCase, productFiscalRepository } = await setup();

    const saved = await useCase.execute({
      ...baseInput,
      group: {
        ...baseInput.group,
        cfop: { value: '5102', applyToAll: true },
      },
      units: [
        {
          branchId: BRANCH_ID,
          icms: '10',
          pisCofins: '10',
          ipi: '10',
          cfop: '5405',
          issqn: '',
        },
      ],
    });

    expect(saved.configured).toBe(true);
    expect(saved.branches).toEqual([]);
    const loaded = await productFiscalRepository.findByProductId(
      STORE_ID,
      'prod-1',
    );
    expect(loaded?.ncm).toBe('61091000');
  });

  it('mantém override de branch quando applyToAll=false', async () => {
    const { useCase } = await setup();
    const saved = await useCase.execute(baseInput);
    expect(saved.branches).toEqual([
      {
        branchId: BRANCH_ID,
        icms: '',
        pisCofins: '',
        ipi: '',
        cfop: '5405',
        issqn: '',
      },
    ]);
  });

  it('normaliza e persiste o grupo de ISSQN sem regressão nos outros tributos', async () => {
    const { useCase } = await setup();
    const saved = await useCase.execute({
      ...baseInput,
      group: {
        ...baseInput.group,
        issqn: { value: '  0201  ', applyToAll: false },
      },
      units: [
        {
          branchId: BRANCH_ID,
          icms: '',
          pisCofins: '',
          ipi: '',
          cfop: '5405',
          issqn: '0300',
        },
      ],
    });

    expect(saved.issqn).toEqual({ value: '0201', applyToAll: false });
    expect(saved.cfop.value).toBe('5102');
    expect(saved.branches).toEqual([
      {
        branchId: BRANCH_ID,
        icms: '',
        pisCofins: '',
        ipi: '',
        cfop: '5405',
        issqn: '0300',
      },
    ]);
  });

  it('rejeita produto inexistente', async () => {
    const { useCase } = await setup();
    await expect(
      useCase.execute({ ...baseInput, productId: 'missing' }),
    ).rejects.toBeInstanceOf(ProductNotFoundError);
  });

  it('aceita pisCofinsGroupId de um grupo PIS/COFINS da organização', async () => {
    const { useCase, fiscalGroupRepository } = await setup();
    fiscalGroupRepository.seed(
      FiscalGroup.create({
        organizationId: STORE_ID,
        taxType: 'PIS_COFINS',
        name: 'Grupo válido',
        pisCst: '01',
        pisAliquota: 1.65,
        cofinsCst: '01',
        cofinsAliquota: 7.6,
      }),
    );
    const groupId = (
      await fiscalGroupRepository.listByOrganization(STORE_ID, 'PIS_COFINS')
    )[0].id;

    const saved = await useCase.execute({
      ...baseInput,
      pisCofinsGroupId: groupId,
    });
    expect(saved.pisCofinsGroupId).toBe(groupId);
  });

  it('rejeita pisCofinsGroupId inexistente / de outra organização', async () => {
    const { useCase } = await setup();
    await expect(
      useCase.execute({
        ...baseInput,
        pisCofinsGroupId: 'grupo-de-outra-org',
      }),
    ).rejects.toBeInstanceOf(ProductFiscalInvalidValuesError);
  });

  it('aceita icmsGroupId de um grupo ICMS da organização', async () => {
    const { useCase, fiscalGroupRepository } = await setup();
    fiscalGroupRepository.seed(
      FiscalGroup.createIcms(STORE_ID, {
        name: 'ICMS válido',
        icmsCst: '00',
        icmsCsosn: null,
        ufRates: [],
      }),
    );
    const groupId = (
      await fiscalGroupRepository.listByOrganization(STORE_ID, 'ICMS')
    )[0].id;

    const saved = await useCase.execute({ ...baseInput, icmsGroupId: groupId });
    expect(saved.icmsGroupId).toBe(groupId);
  });

  it('rejeita icmsGroupId inexistente / de outra organização', async () => {
    const { useCase } = await setup();
    await expect(
      useCase.execute({ ...baseInput, icmsGroupId: 'grupo-de-outra-org' }),
    ).rejects.toBeInstanceOf(ProductFiscalInvalidValuesError);
  });

  it('aceita issqnGroupId de um grupo ISSQN da organização (spec erp/018)', async () => {
    const { useCase, fiscalGroupRepository } = await setup();
    fiscalGroupRepository.seed(
      FiscalGroup.createIssqn(STORE_ID, {
        name: 'ISSQN válido',
        issqnServiceCode: '17.02',
        issqnNationalCode: '170200',
        issqnRate: 5,
        issqnTribType: '1',
      }),
    );
    const groupId = (
      await fiscalGroupRepository.listByOrganization(STORE_ID, 'ISSQN')
    )[0].id;

    const saved = await useCase.execute({
      ...baseInput,
      issqnGroupId: groupId,
    });
    expect(saved.issqnGroupId).toBe(groupId);
  });

  it('rejeita issqnGroupId de outro tributo / de outra organização (spec erp/018)', async () => {
    const { useCase, fiscalGroupRepository } = await setup();
    fiscalGroupRepository.seed(
      FiscalGroup.createIcms(STORE_ID, {
        name: 'ICMS no slot de ISSQN',
        icmsCst: '00',
        icmsCsosn: null,
        ufRates: [],
      }),
    );
    const icmsGroupId = (
      await fiscalGroupRepository.listByOrganization(STORE_ID, 'ICMS')
    )[0].id;
    await expect(
      useCase.execute({ ...baseInput, issqnGroupId: icmsGroupId }),
    ).rejects.toBeInstanceOf(ProductFiscalInvalidValuesError);
  });

  it('aceita ipiGroupId de um grupo IPI da organização (spec erp/019)', async () => {
    const { useCase, fiscalGroupRepository } = await setup();
    fiscalGroupRepository.seed(
      FiscalGroup.createIpi(STORE_ID, {
        name: 'IPI válido',
        ipiCst: '50',
        ipiEnquadramento: '999',
        ipiRate: 10,
      }),
    );
    const groupId = (
      await fiscalGroupRepository.listByOrganization(STORE_ID, 'IPI')
    )[0].id;

    const saved = await useCase.execute({ ...baseInput, ipiGroupId: groupId });
    expect(saved.ipiGroupId).toBe(groupId);
  });

  it('rejeita ipiGroupId de outro tributo / de outra organização (spec erp/019)', async () => {
    const { useCase, fiscalGroupRepository } = await setup();
    fiscalGroupRepository.seed(
      FiscalGroup.createIcms(STORE_ID, {
        name: 'ICMS no slot de IPI',
        icmsCst: '00',
        icmsCsosn: null,
        ufRates: [],
      }),
    );
    const icmsGroupId = (
      await fiscalGroupRepository.listByOrganization(STORE_ID, 'ICMS')
    )[0].id;
    await expect(
      useCase.execute({ ...baseInput, ipiGroupId: icmsGroupId }),
    ).rejects.toBeInstanceOf(ProductFiscalInvalidValuesError);
  });

  it('rejeita icmsGroupId que aponta para um grupo de outro tributo (PIS/COFINS)', async () => {
    const { useCase, fiscalGroupRepository } = await setup();
    fiscalGroupRepository.seed(
      FiscalGroup.create({
        organizationId: STORE_ID,
        taxType: 'PIS_COFINS',
        name: 'PIS no slot de ICMS',
        pisCst: '01',
        pisAliquota: 1.65,
        cofinsCst: '01',
        cofinsAliquota: 7.6,
      }),
    );
    const pisGroupId = (
      await fiscalGroupRepository.listByOrganization(STORE_ID, 'PIS_COFINS')
    )[0].id;

    await expect(
      useCase.execute({ ...baseInput, icmsGroupId: pisGroupId }),
    ).rejects.toBeInstanceOf(ProductFiscalInvalidValuesError);
  });

  it('rejeita peso negativo', async () => {
    const { useCase } = await setup();
    await expect(
      useCase.execute({
        ...baseInput,
        info: { ...baseInput.info, netWeightKg: -1 },
      }),
    ).rejects.toBeInstanceOf(ProductFiscalInvalidValuesError);
  });

  it('rejeita branch de outra organização', async () => {
    const { useCase } = await setup();
    await expect(
      useCase.execute({
        ...baseInput,
        units: [
          {
            branchId: '99999999-9999-4999-8999-999999999999',
            icms: '',
            pisCofins: '',
            ipi: '',
            cfop: '5405',
            issqn: '',
          },
        ],
      }),
    ).rejects.toBeInstanceOf(BranchNotFoundError);
  });
});
