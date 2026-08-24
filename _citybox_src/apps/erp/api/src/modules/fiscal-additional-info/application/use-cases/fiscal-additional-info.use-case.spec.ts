import { CreateFiscalAdditionalInfoUseCase } from './create-fiscal-additional-info/create-fiscal-additional-info.use-case';
import { UpdateFiscalAdditionalInfoUseCase } from './update-fiscal-additional-info/update-fiscal-additional-info.use-case';
import { GetFiscalAdditionalInfoUseCase } from './get-fiscal-additional-info/get-fiscal-additional-info.use-case';
import { ListFiscalAdditionalInfosUseCase } from './list-fiscal-additional-infos/list-fiscal-additional-infos.use-case';
import { CountFiscalAdditionalInfosUseCase } from './count-fiscal-additional-infos/count-fiscal-additional-infos.use-case';
import { DeleteFiscalAdditionalInfoUseCase } from './delete-fiscal-additional-info/delete-fiscal-additional-info.use-case';
import { ResolveDocumentAdditionalInfoUseCase } from './resolve-document-additional-info/resolve-document-additional-info.use-case';
import { InMemoryFiscalAdditionalInfoRepository } from '../../tests/in-memory-fiscal-additional-info.repository';
import { FiscalAdditionalInfo } from '../../domain/entities/fiscal-additional-info.entity';
import { FiscalAdditionalInfoNotFoundError } from '../../domain/errors/fiscal-additional-info-not-found.error';
import { AdditionalInfoOverflowError } from '../../domain/errors/additional-info-overflow.error';

const ORG = 'org-1';

describe('Informações adicionais da nota fiscal — use-cases (spec erp/017)', () => {
  let repo: InMemoryFiscalAdditionalInfoRepository;
  let create: CreateFiscalAdditionalInfoUseCase;
  let update: UpdateFiscalAdditionalInfoUseCase;
  let get: GetFiscalAdditionalInfoUseCase;
  let list: ListFiscalAdditionalInfosUseCase;
  let count: CountFiscalAdditionalInfosUseCase;
  let remove: DeleteFiscalAdditionalInfoUseCase;
  let resolve: ResolveDocumentAdditionalInfoUseCase;

  beforeEach(() => {
    repo = new InMemoryFiscalAdditionalInfoRepository();
    create = new CreateFiscalAdditionalInfoUseCase(repo);
    update = new UpdateFiscalAdditionalInfoUseCase(repo);
    get = new GetFiscalAdditionalInfoUseCase(repo);
    list = new ListFiscalAdditionalInfosUseCase(repo);
    count = new CountFiscalAdditionalInfosUseCase(repo);
    remove = new DeleteFiscalAdditionalInfoUseCase(repo);
    resolve = new ResolveDocumentAdditionalInfoUseCase(repo);
  });

  it('conta por tipo de documento (spec erp/023, N7)', async () => {
    await create.execute({
      organizationId: ORG,
      name: 'A',
      text: 'Texto A',
      documentType: 'NFE',
      target: 'INF_CPL',
    });
    await create.execute({
      organizationId: ORG,
      name: 'B',
      text: 'Texto B',
      documentType: 'NFE',
      target: 'INF_CPL',
    });
    await create.execute({
      organizationId: ORG,
      name: 'C',
      text: 'Texto C',
      documentType: 'NFSE',
      target: 'INF_CPL',
    });
    // Outra organização não deve entrar na contagem.
    await create.execute({
      organizationId: 'org-2',
      name: 'D',
      text: 'Texto D',
      documentType: 'NFE',
      target: 'INF_CPL',
    });

    const counts = await count.execute({ organizationId: ORG });
    expect(counts).toEqual({ NFE: 2, NFCE: 0, NFSE: 1, total: 3 });
  });

  it('cria e persiste uma informação de NF-e no campo do contribuinte', async () => {
    const saved = await create.execute({
      organizationId: ORG,
      name: 'Aviso de garantia',
      text: 'Produto com garantia de 12 meses.',
      documentType: 'NFE',
      target: 'INF_CPL',
    });
    expect(saved.documentType).toBe('NFE');
    expect(saved.target).toBe('INF_CPL');

    const reloaded = await get.execute({ organizationId: ORG, id: saved.id });
    expect(reloaded.text).toBe('Produto com garantia de 12 meses.');
  });

  it('lista somente as informações do tipo pedido', async () => {
    await create.execute({
      organizationId: ORG,
      name: 'NFe A',
      text: 'texto nfe',
      documentType: 'NFE',
      target: 'INF_CPL',
    });
    await create.execute({
      organizationId: ORG,
      name: 'NFSe A',
      text: 'texto nfse',
      documentType: 'NFSE',
      target: 'INF_CPL',
    });

    const nfe = await list.execute({
      organizationId: ORG,
      documentType: 'NFE',
    });
    expect(nfe).toHaveLength(1);
    expect(nfe[0]?.name).toBe('NFe A');
  });

  it('rejeita target INF_AD_FISCO para NFSE (plan D10)', async () => {
    await expect(
      create.execute({
        organizationId: ORG,
        name: 'Obs fisco',
        text: 'texto do fisco',
        documentType: 'NFSE',
        target: 'INF_AD_FISCO',
      }),
    ).rejects.toThrow(/fisco/i);
  });

  it('edita nome/texto/destino mantendo o documentType', async () => {
    const saved = await create.execute({
      organizationId: ORG,
      name: 'Original',
      text: 'texto original',
      documentType: 'NFE',
      target: 'INF_CPL',
    });
    const updated = await update.execute({
      organizationId: ORG,
      id: saved.id,
      name: 'Editado',
      text: 'texto editado',
      target: 'INF_AD_FISCO',
    });
    expect(updated.name).toBe('Editado');
    expect(updated.target).toBe('INF_AD_FISCO');
    expect(updated.documentType).toBe('NFE');
  });

  it('exclui e some da listagem', async () => {
    const saved = await create.execute({
      organizationId: ORG,
      name: 'Descartável',
      text: 'texto',
      documentType: 'NFCE',
      target: 'INF_CPL',
    });
    await remove.execute({ organizationId: ORG, id: saved.id });
    const all = await list.execute({ organizationId: ORG });
    expect(all).toHaveLength(0);
  });

  it('excluir inexistente lança NotFound (→404)', async () => {
    await expect(
      remove.execute({ organizationId: ORG, id: 'nope' }),
    ).rejects.toBeInstanceOf(FiscalAdditionalInfoNotFoundError);
  });

  it('não enxerga informação de outra organização (isolamento de tenant)', async () => {
    const saved = await create.execute({
      organizationId: 'org-A',
      name: 'de A',
      text: 'texto',
      documentType: 'NFE',
      target: 'INF_CPL',
    });
    await expect(
      get.execute({ organizationId: 'org-B', id: saved.id }),
    ).rejects.toBeInstanceOf(FiscalAdditionalInfoNotFoundError);
  });

  describe('ResolveDocumentAdditionalInfo (concatenação por destino)', () => {
    it('concatena na ordem de criação e separa por destino', async () => {
      await create.execute({
        organizationId: ORG,
        name: 'primeira',
        text: 'AAA',
        documentType: 'NFE',
        target: 'INF_CPL',
      });
      await create.execute({
        organizationId: ORG,
        name: 'do fisco',
        text: 'FISCO',
        documentType: 'NFE',
        target: 'INF_AD_FISCO',
      });
      await create.execute({
        organizationId: ORG,
        name: 'segunda',
        text: 'BBB',
        documentType: 'NFE',
        target: 'INF_CPL',
      });

      const resolved = await resolve.execute({
        organizationId: ORG,
        documentType: 'NFE',
      });
      expect(resolved.infCpl).toBe('AAA BBB');
      expect(resolved.infAdFisco).toBe('FISCO');
    });

    it('NFS-e nunca devolve infAdFisco (só infCpl → xInfComp)', async () => {
      await create.execute({
        organizationId: ORG,
        name: 'nfse cpl',
        text: 'servico prestado conforme contrato',
        documentType: 'NFSE',
        target: 'INF_CPL',
      });
      const resolved = await resolve.execute({
        organizationId: ORG,
        documentType: 'NFSE',
      });
      expect(resolved.infCpl).toBe('servico prestado conforme contrato');
      expect(resolved.infAdFisco).toBeUndefined();
    });

    it('sem informações devolve objeto vazio (não emite infAdic)', async () => {
      const resolved = await resolve.execute({
        organizationId: ORG,
        documentType: 'NFCE',
      });
      expect(resolved).toEqual({});
    });

    it('estoura quando a soma passa do teto do XSD (impede, não trunca)', async () => {
      // infAdFisco (NF-e) = máx. 2000. Dois textos de 1200 somam 2401 (com separador).
      const bloco = 'x'.repeat(1200);
      await create.execute({
        organizationId: ORG,
        name: 'bloco 1',
        text: bloco,
        documentType: 'NFE',
        target: 'INF_AD_FISCO',
      });
      await create.execute({
        organizationId: ORG,
        name: 'bloco 2',
        text: bloco,
        documentType: 'NFE',
        target: 'INF_AD_FISCO',
      });
      await expect(
        resolve.execute({ organizationId: ORG, documentType: 'NFE' }),
      ).rejects.toBeInstanceOf(AdditionalInfoOverflowError);
    });
  });

  describe('Entidade — validações de teto por campo', () => {
    it('recusa texto único acima do teto do campo (infAdFisco NF-e = 2000)', () => {
      expect(() =>
        FiscalAdditionalInfo.create({
          organizationId: ORG,
          name: 'grande',
          text: 'y'.repeat(2001),
          documentType: 'NFE',
          target: 'INF_AD_FISCO',
        }),
      ).toThrow();
    });

    it('aceita infCpl de NF-e até 5000 (teto maior que o do fisco)', () => {
      const info = FiscalAdditionalInfo.create({
        organizationId: ORG,
        name: 'longo',
        text: 'z'.repeat(5000),
        documentType: 'NFE',
        target: 'INF_CPL',
      });
      expect(info.text).toHaveLength(5000);
    });

    it('recusa xInfComp de NFS-e acima de 2000', () => {
      expect(() =>
        FiscalAdditionalInfo.create({
          organizationId: ORG,
          name: 'nfse longo',
          text: 'z'.repeat(2001),
          documentType: 'NFSE',
          target: 'INF_CPL',
        }),
      ).toThrow();
    });

    it('recusa texto com caractere de controle ilegal em XML 1.0', () => {
      // U+0007 (bell) sobrevive a colar de PDF/Word e deixaria o XML mal-formado.
      expect(() =>
        FiscalAdditionalInfo.create({
          organizationId: ORG,
          name: 'com controle',
          text: `antes${String.fromCharCode(7)}depois`,
          documentType: 'NFE',
          target: 'INF_CPL',
        }),
      ).toThrow(/controle/i);
    });

    it('aceita TAB, LF e CR no texto (permitidos em XML 1.0)', () => {
      const info = FiscalAdditionalInfo.create({
        organizationId: ORG,
        name: 'com quebras',
        text: 'linha1\tcol\nlinha2\r\nlinha3',
        documentType: 'NFE',
        target: 'INF_CPL',
      });
      expect(info.text).toContain('linha2');
    });
  });
});
