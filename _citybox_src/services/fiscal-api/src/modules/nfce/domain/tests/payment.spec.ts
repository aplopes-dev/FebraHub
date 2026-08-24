import { buildNfcePayments, CASH_PAYMENT_CODE } from '../payment.entity';
import { InvalidNfcePaymentError } from '../errors/invalid-nfce-payment.error';

describe('buildNfcePayments (FR-005)', () => {
  it('aceita varias formas na mesma venda', () => {
    // ⚠️ O caso que faz este módulo existir. Parte em cartão e resto em
    // dinheiro é rotina no varejo — modelar pagamento como valor único
    // quebraria o comum, não o excepcional.
    const result = buildNfcePayments(
      [
        { method: '03', amount: 50 },
        { method: CASH_PAYMENT_CODE, amount: 35 },
      ],
      85,
    );

    expect(result.details).toHaveLength(2);
    expect(result.changeAmount).toBe(0);
  });

  it('calcula o troco quando o dinheiro entregue excede o total', () => {
    const result = buildNfcePayments(
      [{ method: CASH_PAYMENT_CODE, amount: 100 }],
      85,
    );

    expect(result.changeAmount).toBe(15);
  });

  it('o troco e UM valor da venda, nao um por forma de pagamento', () => {
    // O XSD põe `vTroco` em `pag`, irmão de `detPag` — um valor para a venda
    // inteira. Modelar troco por forma produziria XML que o schema recusa.
    const result = buildNfcePayments(
      [
        { method: '03', amount: 50 },
        { method: CASH_PAYMENT_CODE, amount: 50 },
      ],
      85,
    );

    expect(result.changeAmount).toBe(15);
    expect(result).not.toHaveProperty('details.0.changeAmount');
  });

  it('recusa troco quando nao houve pagamento em dinheiro', () => {
    // Cartão que "paga a mais e devolve" não existe: a operadora debita o
    // valor exato. Um troco aqui é erro de digitação no caixa, e aceitar
    // produziria cupom com dinheiro saindo do caixa sem origem.
    expect(() =>
      buildNfcePayments([{ method: '03', amount: 100 }], 85),
    ).toThrow(InvalidNfcePaymentError);
  });

  it('recusa venda sem nenhuma forma de pagamento', () => {
    expect(() => buildNfcePayments([], 85)).toThrow(InvalidNfcePaymentError);
  });

  it('recusa quando a soma dos pagamentos e MENOR que o total', () => {
    expect(() => buildNfcePayments([{ method: '03', amount: 50 }], 85)).toThrow(
      InvalidNfcePaymentError,
    );
  });

  it('recusa valor de pagamento zerado ou negativo', () => {
    expect(() =>
      buildNfcePayments([{ method: CASH_PAYMENT_CODE, amount: 0 }], 0),
    ).toThrow(InvalidNfcePaymentError);

    expect(() =>
      buildNfcePayments(
        [
          { method: CASH_PAYMENT_CODE, amount: 100 },
          { method: '03', amount: -15 },
        ],
        85,
      ),
    ).toThrow(InvalidNfcePaymentError);
  });

  it('tolera a imprecisao de ponto flutuante ao conferir a soma', () => {
    // ⚠️ `0.1 + 0.2 !== 0.3`. Uma comparação exata recusaria vendas
    // perfeitamente válidas de forma intermitente — o pior tipo de defeito no
    // balcão, porque não reproduz.
    expect(() =>
      buildNfcePayments(
        [
          { method: '03', amount: 0.1 },
          { method: '03', amount: 0.2 },
        ],
        0.3,
      ),
    ).not.toThrow();
  });

  it('recusa forma de pagamento fora do formato de dois digitos', () => {
    expect(() => buildNfcePayments([{ method: '3', amount: 85 }], 85)).toThrow(
      InvalidNfcePaymentError,
    );
  });

  it('exige descricao quando a forma e "Outros"', () => {
    // `tPag=99` sem `xPag` é rejeitado pela SEFAZ. Recusar aqui dá mensagem
    // legível em vez de um código de rejeição do órgão.
    expect(() => buildNfcePayments([{ method: '99', amount: 85 }], 85)).toThrow(
      InvalidNfcePaymentError,
    );

    expect(() =>
      buildNfcePayments(
        [{ method: '99', amount: 85, description: 'PERMUTA' }],
        85,
      ),
    ).not.toThrow();
  });
});
