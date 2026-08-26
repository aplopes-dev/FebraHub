/**
 * Parser do XML de conciliação Stone (layout 2.2 / 2.4). Estrutura real
 * (validada contra arquivo de produção, StoneCode 813814720):
 *
 *   <Conciliation>
 *     <Header><StoneCode/><ReferenceDate/>...</Header>
 *     <FinancialTransactions>
 *       <Transaction>
 *         <AcquirerTransactionKey/>      NSU único (idempotência)
 *         <InitiatorTransactionKey/>     ex: PB4M...-sunmiSeriesP-...
 *         <AuthorizationDateTime/>       AAAAMMDDHHMMSS
 *         <CaptureLocalDateTime/>
 *         <AccountType/>                 1 credito | 2 debito
 *         <NumberOfInstallments/>
 *         <AuthorizedAmount/> <CapturedAmount/>   decimais com ponto (16.000000)
 *         <IssuerAuthorizationCode/>
 *         <BrandId/>                     1 Visa | 2 Master | ...
 *         <CardNumber/>                  mascarado
 *         <Poi><PoiType/><SerialNumber/></Poi>
 *         <Events><Cancellations/>...</Events>
 *         <Installments><Installment>
 *            <GrossAmount/> <NetAmount/> <PrevisionPaymentDate/>
 *         </Installment>...</Installments>
 *       </Transaction> ...
 *     </FinancialTransactions>
 *     <Trailer>...</Trailer>
 *   </Conciliation>
 *
 * O XML é plano e sem namespaces nos elementos, então um parser por regex é
 * suficiente, robusto e sem dependência nativa.
 */

export interface StoneTransacaoParseada {
  acquirerTransactionKey: string;
  initiatorTransactionKey: string | null;
  authorizationDateTime: Date | null;
  captureDateTime: Date | null;
  accountType: string | null;
  brandId: string | null;
  brandNome: string | null;
  cardNumber: string | null;
  numberOfInstallments: number;
  authorizationCode: string | null;
  poiSerialNumber: string | null;
  grossAmount: number;
  netAmount: number;
  feeAmount: number;
  previsionPaymentDate: Date | null;
  cancelado: boolean;
  bruto: Record<string, unknown>;
}

export interface StoneArquivoParseado {
  stoneCode: string | null;
  referenceDate: string | null; // AAAAMMDD
  transacoes: StoneTransacaoParseada[];
}

// Mapa de bandeiras Stone (BrandId → nome). Fonte: doc "Bandeiras" Stone.
const BANDEIRAS: Record<string, string> = {
  '1': 'Visa',
  '2': 'Mastercard',
  '3': 'Amex',
  '4': 'Elo',
  '5': 'Hipercard',
  '6': 'Diners',
  '7': 'Cabal',
  '8': 'Sorocred',
  '9': 'Banescard',
};

function tag(xml: string, nome: string): string | null {
  const m = new RegExp(`<${nome}>([\\s\\S]*?)</${nome}>`).exec(xml);
  return m ? m[1].trim() : null;
}

function num(v: string | null): number {
  if (!v) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** AAAAMMDD[HHMMSS] → Date (interpretado como horário de Brasília, -03:00). */
function parseData(v: string | null): Date | null {
  if (!v) return null;
  const s = v.trim();
  if (s.length < 8) return null;
  const ano = s.slice(0, 4), mes = s.slice(4, 6), dia = s.slice(6, 8);
  const hh = s.length >= 14 ? s.slice(8, 10) : '00';
  const mm = s.length >= 14 ? s.slice(10, 12) : '00';
  const ss = s.length >= 14 ? s.slice(12, 14) : '00';
  const iso = `${ano}-${mes}-${dia}T${hh}:${mm}:${ss}-03:00`;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

function parseTransacao(bloco: string): StoneTransacaoParseada {
  const gross = num(tag(bloco, 'GrossAmount')) || num(tag(bloco, 'CapturedAmount'));
  const net = num(tag(bloco, 'NetAmount')) || gross;
  const brandId = tag(bloco, 'BrandId');
  const cancellations = num(tag(bloco, 'Cancellations'));

  return {
    acquirerTransactionKey: tag(bloco, 'AcquirerTransactionKey') ?? '',
    initiatorTransactionKey: tag(bloco, 'InitiatorTransactionKey'),
    authorizationDateTime: parseData(tag(bloco, 'AuthorizationDateTime')),
    captureDateTime: parseData(tag(bloco, 'CaptureLocalDateTime')),
    accountType: tag(bloco, 'AccountType'),
    brandId,
    brandNome: brandId ? (BANDEIRAS[brandId] ?? `Bandeira ${brandId}`) : null,
    cardNumber: tag(bloco, 'CardNumber'),
    numberOfInstallments: num(tag(bloco, 'NumberOfInstallments')) || 1,
    authorizationCode: tag(bloco, 'IssuerAuthorizationCode'),
    poiSerialNumber: tag(bloco, 'SerialNumber'),
    grossAmount: round2(gross),
    netAmount: round2(net),
    feeAmount: round2(gross - net),
    previsionPaymentDate: parseData(tag(bloco, 'PrevisionPaymentDate')),
    cancelado: cancellations > 0,
    bruto: {
      acquirerTransactionKey: tag(bloco, 'AcquirerTransactionKey'),
      capturedAmount: tag(bloco, 'CapturedAmount'),
      authorizedAmount: tag(bloco, 'AuthorizedAmount'),
      grossAmount: tag(bloco, 'GrossAmount'),
      netAmount: tag(bloco, 'NetAmount'),
      brandId,
      accountType: tag(bloco, 'AccountType'),
      serialNumber: tag(bloco, 'SerialNumber'),
      previsionPaymentDate: tag(bloco, 'PrevisionPaymentDate'),
    },
  };
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function parseConciliacaoXml(xml: string): StoneArquivoParseado {
  const header = /<Header>([\s\S]*?)<\/Header>/.exec(xml)?.[1] ?? '';
  const stoneCode = tag(header, 'StoneCode');
  const referenceDate = tag(header, 'ReferenceDate');

  const transacoes: StoneTransacaoParseada[] = [];
  const re = /<Transaction>([\s\S]*?)<\/Transaction>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const t = parseTransacao(m[1]);
    if (t.acquirerTransactionKey) transacoes.push(t);
  }
  return { stoneCode, referenceDate, transacoes };
}
