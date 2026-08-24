import { ImportProductsUseCase } from './import-products.use-case';
import {
  makeProduct,
  makeRepositories,
  STORE_ID,
} from '../../../tests/catalog-test-factory';
import { buildProductImportTemplateBuffer } from '../../utils/product-import-xlsx';
import ExcelJS from 'exceljs';
import { BRANCH_ID } from '../../../../tenancy/tests/tenancy-test-factory';

async function workbookFromRows(
  rows: Array<Array<string | number>>,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Produtos');
  sheet.addRow([
    'sku',
    'nome',
    'categoria',
    'tipo',
    'preco_base',
    'unidade',
    'controla_estoque',
    'disponivel_erp',
    'disponivel_pdv',
    'descricao',
  ]);
  for (const row of rows) sheet.addRow(row);
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

describe('ImportProductsUseCase', () => {
  async function setup() {
    const repos = makeRepositories();
    await repos.seedSupport();
    const useCase = new ImportProductsUseCase(
      repos.productRepository,
      repos.categoryRepository,
      repos.unitRepository,
    );
    return { ...repos, useCase };
  }

  it('cria produtos válidos e reporta erros de categoria inexistente', async () => {
    const { useCase, productRepository } = await setup();
    const buffer = await workbookFromRows([
      [
        'SKU-OK',
        'Produto Ok',
        'Vestuário',
        'simple',
        '10.50',
        'un',
        'sim',
        'sim',
        'nao',
        'desc',
      ],
      [
        'SKU-BAD',
        'Sem Cat',
        'Inexistente',
        'simple',
        '1',
        '',
        'nao',
        'sim',
        'sim',
        '',
      ],
    ]);

    const result = await useCase.execute({
      organizationId: STORE_ID,
      branchId: BRANCH_ID,
      buffer,
    });

    expect(result.created).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.errors[0]?.message).toContain('categoria');

    const created = await productRepository.findBySku(STORE_ID, 'SKU-OK');
    expect(created).not.toBeNull();
    expect(created?.basePriceCents).toBe(1050);
    expect(created?.availableOnPdv).toBe(false);
    expect(created?.branchIds).toEqual([BRANCH_ID]);
    expect(created?.unitOfMeasureId).toBeTruthy();
  });

  it('falha linha quando SKU já existe', async () => {
    const { useCase, productRepository } = await setup();
    await productRepository.save(makeProduct({ sku: 'DUP-1' }));

    const buffer = await workbookFromRows([
      ['DUP-1', 'Dup', 'Vestuário', 'simple', '1', '', 'nao', 'sim', 'sim', ''],
    ]);

    const result = await useCase.execute({
      organizationId: STORE_ID,
      buffer,
    });

    expect(result.created).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.errors[0]?.message).toContain('já existe');
  });

  it('template XLSX é gerável', async () => {
    const buffer = await buildProductImportTemplateBuffer();
    expect(buffer.byteLength).toBeGreaterThan(100);
  });
});
