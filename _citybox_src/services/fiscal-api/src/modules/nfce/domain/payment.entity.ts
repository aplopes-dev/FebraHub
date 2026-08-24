import { InvalidNfcePaymentError } from './errors/invalid-nfce-payment.error';

/// `tPag` de dinheiro. Único código com significado especial neste módulo: é o
/// único em que troco faz sentido.
export const CASH_PAYMENT_CODE = '01';

/// `tPag` "Outros" — exige `xPag` preenchido, senão a SEFAZ rejeita.
const OTHER_PAYMENT_CODE = '99';

/// Formas que exigem o grupo `card` no XML.
///
/// ⚠️ **Confirmado pela SEFAZ, não deduzido.** No E2E de 2026-08-09 o SVRS
/// recusou com `Rejeição 391 — Não informados os dados do cartão de
/// crédito/débito nas Formas de Pagamento`. O XSD marca `card` como
/// `minOccurs=0`, então o schema aceita sem — quem exige é a regra de negócio
/// do órgão, e ela só aparece transmitindo.
const CARD_PAYMENT_CODES: ReadonlySet<string> = new Set(['03', '04']);

/// `tpIntegra`: `1` = pagamento integrado ao sistema (TEF/POS integrado),
/// `2` = não integrado (maquininha à parte). `2` é o caso comum de balcão, e
/// por isso o padrão — exigir do chamador quebraria integrações simples sem
/// ganho fiscal.
const DEFAULT_CARD_INTEGRATION = '2';

/// Tolerância de comparação, em reais.
///
/// ⚠️ Existe por causa de ponto flutuante, não por leniência fiscal:
/// `0.1 + 0.2 !== 0.3` em IEEE 754. Comparação exata recusaria vendas válidas
/// de forma **intermitente** — o pior defeito possível no balcão, porque não
/// reproduz e o operador leva a culpa. Meio centavo é menor que a menor
/// unidade monetária, então nenhuma divergência real cabe aqui dentro.
const AMOUNT_TOLERANCE = 0.005;

export type NfcePaymentInput = {
  /// `tPag`. O XSD só exige `[0-9]{2}`: a lista de códigos válidos vive no
  /// MOC, **não** no schema, então validar o formato é tudo que se pode fazer
  /// localmente sem cravar uma tabela que envelhece.
  method: string;
  amount: number;
  /// `xPag` — obrigatório quando `method` é `99`.
  description?: string;
  /// `tpIntegra` — só para cartão (`03`/`04`). @default '2' (não integrado)
  cardIntegration?: '1' | '2';
};

export type NfcePaymentDetail = {
  method: string;
  amount: number;
  description?: string;
  /// Presente **apenas** em cartão. O XSD recusa `card` em outras formas.
  cardIntegration?: '1' | '2';
};

export type NfcePayments = {
  details: NfcePaymentDetail[];
  /// `vTroco`. ⚠️ **Um valor para a venda inteira**, não um por forma: o XSD o
  /// posiciona em `pag`, irmão de `detPag`. Modelar por forma produziria XML
  /// que o schema recusa.
  changeAmount: number;
};

const TWO_DIGITS = /^\d{2}$/;

function refuse(reason: string, externalReason: string): never {
  throw new InvalidNfcePaymentError(
    'buildNfcePayments',
    reason,
    externalReason,
  );
}

/// FR-005 — monta e **valida** as formas de pagamento de um cupom.
///
/// A validação toda existe porque a SEFAZ não faz nenhuma delas: o schema não
/// confere se a soma dos pagamentos bate com o total da venda. Um cupom
/// incoerente é autorizado normalmente e vira divergência descoberta no
/// fechamento do mês, sem rastro de qual venda a causou.
export function buildNfcePayments(
  payments: readonly NfcePaymentInput[],
  totalAmount: number,
): NfcePayments {
  if (payments.length === 0) {
    refuse(
      'no payment methods provided',
      'Informe ao menos uma forma de pagamento para emitir o cupom fiscal.',
    );
  }

  for (const payment of payments) {
    if (!TWO_DIGITS.test(payment.method)) {
      refuse(
        `invalid tPag "${payment.method}"`,
        `Forma de pagamento "${payment.method}" inválida: use o código de dois dígitos da tabela da SEFAZ.`,
      );
    }
    if (!(payment.amount > 0)) {
      refuse(
        `non-positive amount ${payment.amount}`,
        'Cada forma de pagamento precisa ter valor maior que zero.',
      );
    }
    if (payment.method === OTHER_PAYMENT_CODE && !payment.description?.trim()) {
      refuse(
        'tPag 99 requires xPag',
        'A forma de pagamento "Outros" exige uma descrição.',
      );
    }
  }

  const paid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const change = paid - totalAmount;

  if (change < -AMOUNT_TOLERANCE) {
    refuse(
      `payments (${paid}) are less than the total (${totalAmount})`,
      `A soma das formas de pagamento (R$ ${paid.toFixed(2)}) é menor que o total da venda (R$ ${totalAmount.toFixed(2)}).`,
    );
  }

  const cashPaid = payments
    .filter((payment) => payment.method === CASH_PAYMENT_CODE)
    .reduce((sum, payment) => sum + payment.amount, 0);

  // Troco só sai de dinheiro. Cartão não "paga a mais e devolve" — a operadora
  // debita o valor exato —, então um excedente sem dinheiro na venda é erro de
  // digitação no caixa. Aceitar produziria cupom com dinheiro saindo do caixa
  // sem origem declarada.
  if (change > AMOUNT_TOLERANCE && cashPaid <= 0) {
    refuse(
      `change of ${change} without any cash payment`,
      'Só há troco em pagamento com dinheiro. Confira os valores informados.',
    );
  }

  return {
    details: payments.map((payment) => ({
      method: payment.method,
      amount: payment.amount,
      ...(payment.description?.trim()
        ? { description: payment.description.trim() }
        : {}),
      // Só em cartão: o grupo `card` em outra forma é recusado pelo schema.
      ...(CARD_PAYMENT_CODES.has(payment.method)
        ? {
            cardIntegration:
              payment.cardIntegration ?? DEFAULT_CARD_INTEGRATION,
          }
        : {}),
    })),
    // Arredondado ao centavo: o resíduo de ponto flutuante viraria `vTroco`
    // com casas demais, que o XSD (TDec_1302) recusa.
    changeAmount: Math.max(0, Math.round(change * 100) / 100),
  };
}
