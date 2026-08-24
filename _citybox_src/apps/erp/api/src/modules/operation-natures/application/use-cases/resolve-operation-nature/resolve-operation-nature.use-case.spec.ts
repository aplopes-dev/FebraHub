import { ResolveOperationNatureUseCase } from './resolve-operation-nature.use-case';
import { OperationNature } from '../../../domain/entities/operation-nature.entity';
import type {
  OperationNatureCfopRule,
  OperationNatureGroupRule,
} from '../../../domain/entities/operation-nature.entity';
import { InMemoryOperationNatureRepository } from '../../../tests/in-memory-operation-nature.repository';

const ORG = 'org-1';

function makeNature(
  cfopRules: OperationNatureCfopRule[],
  groupRules: OperationNatureGroupRule[] = [],
  id = 'nat-1',
): OperationNature {
  return OperationNature.create(
    {
      organizationId: ORG,
      name: 'Devolução para Fornecedor',
      description: null,
      cfopRules,
      groupRules,
    },
    id,
  );
}

describe('ResolveOperationNatureUseCase (spec erp/020)', () => {
  let repo: InMemoryOperationNatureRepository;
  let useCase: ResolveOperationNatureUseCase;

  beforeEach(() => {
    repo = new InMemoryOperationNatureRepository();
    useCase = new ResolveOperationNatureUseCase(repo);
  });

  it('casa uma linha → CFOP de saída mapeado (SC-002)', async () => {
    repo.seed(
      makeNature([{ fromCfop: '1102', toCfop: '5202', icmsLivre: 'AMBOS' }]),
    );
    const resolved = await useCase.execute({
      organizationId: ORG,
      operationNatureId: 'nat-1',
      fromCfop: '1102',
      itemIcmsLivre: false,
    });
    expect(resolved).toEqual({
      toCfop: '5202',
      toIcmsGroupId: null,
      toPisCofinsGroupId: null,
    });
  });

  it('geral (Ambos) + exceção (Sim): item ICMS-livre resolve pela EXCEÇÃO (SC-003)', async () => {
    repo.seed(
      makeNature([
        { fromCfop: '1102', toCfop: '5202', icmsLivre: 'AMBOS' },
        { fromCfop: '1102', toCfop: '5201', icmsLivre: 'SIM' },
      ]),
    );
    const resolved = await useCase.execute({
      organizationId: ORG,
      operationNatureId: 'nat-1',
      fromCfop: '1102',
      itemIcmsLivre: true,
    });
    expect(resolved?.toCfop).toBe('5201'); // exceção (SIM), não a geral (AMBOS)
  });

  it('geral (Ambos) + exceção (Sim): item NÃO livre cai na geral', async () => {
    repo.seed(
      makeNature([
        { fromCfop: '1102', toCfop: '5202', icmsLivre: 'AMBOS' },
        { fromCfop: '1102', toCfop: '5201', icmsLivre: 'SIM' },
      ]),
    );
    const resolved = await useCase.execute({
      organizationId: ORG,
      operationNatureId: 'nat-1',
      fromCfop: '1102',
      itemIcmsLivre: false,
    });
    expect(resolved?.toCfop).toBe('5202'); // AMBOS (a SIM não se aplica)
  });

  it('exceção Não prevalece sobre Ambos para item não-livre', async () => {
    repo.seed(
      makeNature([
        { fromCfop: '1102', toCfop: '5202', icmsLivre: 'AMBOS' },
        { fromCfop: '1102', toCfop: '5411', icmsLivre: 'NAO' },
      ]),
    );
    const resolved = await useCase.execute({
      organizationId: ORG,
      operationNatureId: 'nat-1',
      fromCfop: '1102',
      itemIcmsLivre: false,
    });
    expect(resolved?.toCfop).toBe('5411'); // NAO específica vence AMBOS
  });

  it('nenhuma linha casa o CFOP → null (mantém original, não bloqueia — SC-004)', async () => {
    repo.seed(
      makeNature([{ fromCfop: '1102', toCfop: '5202', icmsLivre: 'AMBOS' }]),
    );
    const resolved = await useCase.execute({
      organizationId: ORG,
      operationNatureId: 'nat-1',
      fromCfop: '1101', // não há linha para 1101
      itemIcmsLivre: false,
    });
    expect(resolved).toBeNull();
  });

  it('só existe linha SIM e o item não é livre → null (nenhuma aplicável)', async () => {
    repo.seed(
      makeNature([{ fromCfop: '1102', toCfop: '5201', icmsLivre: 'SIM' }]),
    );
    const resolved = await useCase.execute({
      organizationId: ORG,
      operationNatureId: 'nat-1',
      fromCfop: '1102',
      itemIcmsLivre: false,
    });
    expect(resolved).toBeNull();
  });

  it('mapeia os grupos do item pelo de-para (ICMS e PIS/COFINS)', async () => {
    repo.seed(
      makeNature(
        [{ fromCfop: '1102', toCfop: '5202', icmsLivre: 'AMBOS' }],
        [
          { taxType: 'ICMS', fromGroupId: 'icms-in', toGroupId: 'icms-out' },
          { taxType: 'PIS_COFINS', fromGroupId: 'pc-in', toGroupId: 'pc-out' },
        ],
      ),
    );
    const resolved = await useCase.execute({
      organizationId: ORG,
      operationNatureId: 'nat-1',
      fromCfop: '1102',
      itemIcmsLivre: false,
      itemIcmsGroupId: 'icms-in',
      itemPisCofinsGroupId: 'pc-in',
    });
    expect(resolved).toEqual({
      toCfop: '5202',
      toIcmsGroupId: 'icms-out',
      toPisCofinsGroupId: 'pc-out',
    });
  });

  it('grupo do item sem regra de de-para → mantém o grupo original', async () => {
    repo.seed(
      makeNature(
        [{ fromCfop: '1102', toCfop: '5202', icmsLivre: 'AMBOS' }],
        [{ taxType: 'ICMS', fromGroupId: 'outro', toGroupId: 'icms-out' }],
      ),
    );
    const resolved = await useCase.execute({
      organizationId: ORG,
      operationNatureId: 'nat-1',
      fromCfop: '1102',
      itemIcmsLivre: false,
      itemIcmsGroupId: 'icms-in',
    });
    expect(resolved?.toIcmsGroupId).toBe('icms-in'); // mantém (não casou)
  });

  it('natureza inexistente → null', async () => {
    const resolved = await useCase.execute({
      organizationId: ORG,
      operationNatureId: 'inexistente',
      fromCfop: '1102',
      itemIcmsLivre: false,
    });
    expect(resolved).toBeNull();
  });

  it('não resolve natureza de outra organização', async () => {
    repo.seed(
      makeNature([{ fromCfop: '1102', toCfop: '5202', icmsLivre: 'AMBOS' }]),
    );
    const resolved = await useCase.execute({
      organizationId: 'org-2',
      operationNatureId: 'nat-1',
      fromCfop: '1102',
      itemIcmsLivre: false,
    });
    expect(resolved).toBeNull();
  });
});
