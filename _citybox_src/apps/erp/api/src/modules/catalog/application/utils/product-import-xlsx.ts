import ExcelJS from 'exceljs';

export const PRODUCT_IMPORT_COLUMNS = [
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
] as const;

export const PRODUCT_IMPORT_MAX_ROWS = 500;
export const PRODUCT_IMPORT_MAX_BYTES = 5 * 1024 * 1024;

/** Gera o template XLSX (cabeçalho + 1 linha de exemplo). */
export async function buildProductImportTemplateBuffer(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Produtos');
  sheet.addRow([...PRODUCT_IMPORT_COLUMNS]);
  sheet.addRow([
    'CAM-001',
    'Camiseta Básica',
    'Vestuário',
    'simple',
    '59.90',
    'un',
    'sim',
    'sim',
    'sim',
    '',
  ]);
  sheet.getRow(1).font = { bold: true };
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

export type ParsedImportRow = {
  row: number;
  sku: string;
  name: string;
  categoryName: string;
  type: 'simple' | 'collection' | 'supply';
  basePriceCents: number;
  unitAbbreviation: string | null;
  trackStock: boolean;
  availableOnErp: boolean;
  availableOnPdv: boolean;
  description: string;
};

export type ParseImportResult = {
  rows: ParsedImportRow[];
  errors: Array<{ row: number; message: string }>;
};

function cellText(value: ExcelJS.CellValue | undefined): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value).trim();
  }
  if (typeof value === 'boolean') return value ? 'sim' : 'nao';
  if (typeof value === 'object' && 'text' in value && value.text) {
    return String(value.text).trim();
  }
  if (typeof value === 'object' && 'result' in value) {
    return cellText(value.result as ExcelJS.CellValue);
  }
  return String(value).trim();
}

function parseSimNao(
  raw: string,
  field: string,
  row: number,
): { ok: true; value: boolean } | { ok: false; message: string } {
  const normalized = raw.trim().toLowerCase();
  if (!normalized) return { ok: true, value: true };
  if (['sim', 's', 'true', '1', 'yes'].includes(normalized)) {
    return { ok: true, value: true };
  }
  if (['nao', 'não', 'n', 'false', '0', 'no'].includes(normalized)) {
    return { ok: true, value: false };
  }
  return {
    ok: false,
    message: `Linha ${row}: ${field} inválido ("${raw}") — use sim/nao`,
  };
}

function parseType(
  raw: string,
  row: number,
):
  | { ok: true; value: 'simple' | 'collection' | 'supply' }
  | { ok: false; message: string } {
  const normalized = raw.trim().toLowerCase();
  if (
    normalized === 'simple' ||
    normalized === 'collection' ||
    normalized === 'supply'
  ) {
    return { ok: true, value: normalized };
  }
  return {
    ok: false,
    message: `Linha ${row}: tipo inválido ("${raw}") — use simple|collection|supply`,
  };
}

function parsePriceReais(
  raw: string,
  row: number,
): { ok: true; value: number } | { ok: false; message: string } {
  if (!raw.trim()) return { ok: true, value: 0 };
  let normalized = raw.trim();
  if (normalized.includes(',') && normalized.includes('.')) {
    // 1.234,56 → 1234.56
    normalized = normalized.replace(/\./g, '').replace(',', '.');
  } else if (normalized.includes(',')) {
    normalized = normalized.replace(',', '.');
  }
  const asDecimal = Number(normalized);
  if (!Number.isFinite(asDecimal) || asDecimal < 0) {
    return {
      ok: false,
      message: `Linha ${row}: preco_base inválido ("${raw}")`,
    };
  }
  return { ok: true, value: Math.round(asDecimal * 100) };
}

/** Lê linhas do XLSX (pula cabeçalho). Máx. PRODUCT_IMPORT_MAX_ROWS. */
export async function parseProductImportWorkbook(
  buffer: Buffer,
): Promise<ParseImportResult> {
  const workbook = new ExcelJS.Workbook();
  // exceljs tipa load como ArrayBuffer; Buffer é compatível em runtime.
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) {
    return {
      rows: [],
      errors: [{ row: 0, message: 'Planilha vazia ou inválida' }],
    };
  }

  const rows: ParsedImportRow[] = [];
  const errors: Array<{ row: number; message: string }> = [];
  let dataRows = 0;

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    dataRows += 1;
    if (dataRows > PRODUCT_IMPORT_MAX_ROWS) {
      if (dataRows === PRODUCT_IMPORT_MAX_ROWS + 1) {
        errors.push({
          row: rowNumber,
          message: `Máximo de ${PRODUCT_IMPORT_MAX_ROWS} linhas de dados`,
        });
      }
      return;
    }

    const sku = cellText(row.getCell(1).value);
    const name = cellText(row.getCell(2).value);
    const categoryName = cellText(row.getCell(3).value);
    const typeRaw = cellText(row.getCell(4).value);
    const priceRaw = cellText(row.getCell(5).value);
    const unitAbbreviation = cellText(row.getCell(6).value) || null;
    const trackRaw = cellText(row.getCell(7).value);
    const erpRaw = cellText(row.getCell(8).value);
    const pdvRaw = cellText(row.getCell(9).value);
    const description = cellText(row.getCell(10).value);

    if (!sku && !name && !categoryName) return;

    if (!sku) {
      errors.push({ row: rowNumber, message: `Linha ${rowNumber}: sku obrigatório` });
      return;
    }
    if (!name) {
      errors.push({
        row: rowNumber,
        message: `Linha ${rowNumber}: nome obrigatório`,
      });
      return;
    }
    if (!categoryName) {
      errors.push({
        row: rowNumber,
        message: `Linha ${rowNumber}: categoria obrigatória`,
      });
      return;
    }

    const type = parseType(typeRaw || 'simple', rowNumber);
    if (!type.ok) {
      errors.push({ row: rowNumber, message: type.message });
      return;
    }

    const price = parsePriceReais(priceRaw, rowNumber);
    if (!price.ok) {
      errors.push({ row: rowNumber, message: price.message });
      return;
    }

    const trackStock = parseSimNao(trackRaw, 'controla_estoque', rowNumber);
    if (!trackStock.ok) {
      errors.push({ row: rowNumber, message: trackStock.message });
      return;
    }

    const availableOnErp = parseSimNao(erpRaw, 'disponivel_erp', rowNumber);
    if (!availableOnErp.ok) {
      errors.push({ row: rowNumber, message: availableOnErp.message });
      return;
    }

    const availableOnPdv = parseSimNao(pdvRaw, 'disponivel_pdv', rowNumber);
    if (!availableOnPdv.ok) {
      errors.push({ row: rowNumber, message: availableOnPdv.message });
      return;
    }

    rows.push({
      row: rowNumber,
      sku,
      name,
      categoryName,
      type: type.value,
      basePriceCents: price.value,
      unitAbbreviation,
      trackStock: trackStock.value,
      availableOnErp: availableOnErp.value,
      availableOnPdv: availableOnPdv.value,
      description,
    });
  });

  return { rows, errors };
}
