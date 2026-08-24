import { create } from 'xmlbuilder2';
import { WrongFiscalModelError } from '../../domain/errors/wrong-fiscal-model.error';

const NFCE_MODEL = '65';

export type NfceItemData = {
  code: string;
  description: string;
  unit: string;
  quantity: string;
  unitValue: string;
  totalValue: string;
};

export type NfcePaymentData = {
  method: string;
  amount: string;
};

export type NfceDocumentData = {
  accessKey: string;
  protocol: string;
  authorizedAt: string;
  series: string;
  number: string;
  emittedAt: string;
  isHomologation: boolean;
  emitter: {
    cnpj: string;
    legalName: string;
    tradeName: string;
    address: string;
  };
  /// Ausente na venda de balcão comum. `null`, e não string vazia, para que o
  /// renderizador possa dizer "CONSUMIDOR NAO IDENTIFICADO" em vez de deixar
  /// um campo em branco que parece dado faltando.
  consumer: { document: string; name: string } | null;
  items: NfceItemData[];
  payments: NfcePaymentData[];
  changeAmount: string;
  totalAmount: string;
  qrCode: string;
  urlChave: string;
};

/// `find`/`attr`/`text` são cópias deliberadas do padrão de
/// `nfse-xml.reader.ts`.
///
/// O xmlbuilder2 devolve `string` para folha e objeto para ramo, então o tipo
/// de retorno é `unknown` e cada uso estreita. Um `any` aqui faria
/// `data.emitter.cnpj` compilar mesmo se o caminho estivesse errado — e o
/// defeito só apareceria como campo em branco no papel.
function find(node: unknown, name: string): unknown {
  if (node === null || typeof node !== 'object') return undefined;

  const record = node as Record<string, unknown>;
  if (name in record) return record[name];

  for (const value of Object.values(record)) {
    const found = find(value, name);
    if (found !== undefined) return found;
  }
  return undefined;
}

function text(node: unknown, name: string, fallback = ''): string {
  const found = find(node, name);
  if (typeof found === 'string') return found;
  if (typeof found === 'number') return String(found);
  return fallback;
}

function asArray(value: unknown): unknown[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function formatAmount(value: string): string {
  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? parsed.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : value;
}

/// Nomes das formas de pagamento (`tPag`).
///
/// Tabela **de exibição apenas** — o código é que vale fiscalmente, e ele
/// aparece no XML. Um código fora da tabela é impresso como está, em vez de
/// virar "OUTROS": esconder um código desconhecido faria o papel divergir do
/// XML sem que ninguém notasse.
const PAYMENT_LABEL: Record<string, string> = {
  '01': 'DINHEIRO',
  '02': 'CHEQUE',
  '03': 'CARTAO DE CREDITO',
  '04': 'CARTAO DE DEBITO',
  '05': 'CREDITO LOJA',
  '10': 'VALE ALIMENTACAO',
  '11': 'VALE REFEICAO',
  '12': 'VALE PRESENTE',
  '13': 'VALE COMBUSTIVEL',
  '15': 'BOLETO BANCARIO',
  '16': 'DEPOSITO BANCARIO',
  '17': 'PIX',
  '18': 'TRANSFERENCIA / CARTEIRA DIGITAL',
  '19': 'PROGRAMA DE FIDELIDADE',
  '90': 'SEM PAGAMENTO',
  '99': 'OUTROS',
};

export function readNfceXml(xml: Buffer): NfceDocumentData {
  const parsed = create(xml.toString('utf-8')).end({ format: 'object' });

  const infNFe = find(parsed, 'infNFe');
  const model = text(find(infNFe, 'ide'), 'mod');
  if (model !== NFCE_MODEL) {
    throw new WrongFiscalModelError('readNfceXml', NFCE_MODEL, model);
  }

  const ide = find(infNFe, 'ide');
  const emit = find(infNFe, 'emit');
  const emitAddress = find(emit, 'enderEmit');
  const dest = find(infNFe, 'dest');
  const total = find(find(infNFe, 'total'), 'ICMSTot');
  const pag = find(infNFe, 'pag');
  const supl = find(parsed, 'infNFeSupl');
  const infProt = find(parsed, 'infProt');

  const items = asArray(find(infNFe, 'det')).map((det) => {
    const prod = find(det, 'prod');
    return {
      code: text(prod, 'cProd'),
      description: text(prod, 'xProd'),
      unit: text(prod, 'uCom'),
      quantity: formatAmount(text(prod, 'qCom')),
      unitValue: formatAmount(text(prod, 'vUnCom')),
      totalValue: formatAmount(text(prod, 'vProd')),
    };
  });

  const payments = asArray(find(pag, 'detPag')).map((detPag) => {
    const code = text(detPag, 'tPag');
    return {
      method: PAYMENT_LABEL[code] ?? code,
      amount: formatAmount(text(detPag, 'vPag')),
    };
  });

  const consumerDocument = text(dest, 'CPF') || text(dest, 'CNPJ');

  return {
    accessKey: text(infProt, 'chNFe'),
    protocol: text(infProt, 'nProt'),
    authorizedAt: text(infProt, 'dhRecbto'),
    series: text(ide, 'serie'),
    number: text(ide, 'nNF'),
    emittedAt: text(ide, 'dhEmi'),
    isHomologation: text(ide, 'tpAmb') !== '1',
    emitter: {
      cnpj: text(emit, 'CNPJ'),
      legalName: text(emit, 'xNome'),
      tradeName: text(emit, 'xFant'),
      address: [
        text(emitAddress, 'xLgr'),
        text(emitAddress, 'nro'),
        text(emitAddress, 'xBairro'),
        `${text(emitAddress, 'xMun')}-${text(emitAddress, 'UF')}`,
      ]
        .filter(Boolean)
        .join(', '),
    },
    consumer: consumerDocument
      ? { document: consumerDocument, name: text(dest, 'xNome') }
      : null,
    items,
    payments,
    changeAmount: formatAmount(text(pag, 'vTroco', '0')),
    totalAmount: formatAmount(text(total, 'vNF')),
    qrCode: text(supl, 'qrCode'),
    urlChave: text(supl, 'urlChave'),
  };
}
