import {
  decideContingency,
  type TransmissionOutcome,
} from '../contingency-decision';

describe('decideContingency (FR-010)', () => {
  it('SEFAZ inalcancavel: emite em contingencia', () => {
    // O único caso seguro: a SEFAZ não viu nada, então não existe documento do
    // lado dela e uma chave nova não colide com coisa alguma.
    expect(decideContingency({ kind: 'UNREACHABLE' })).toEqual({
      action: 'CONTINGENCY',
    });
  });

  it('⚠️ REJEITADO nao vira contingencia', () => {
    // Rejeição é resposta do órgão, não indisponibilidade. Virar contingência
    // aqui entregaria ao consumidor um papel que a SEFAZ já recusou.
    expect(decideContingency({ kind: 'ANSWERED', status: 'REJECTED' })).toEqual(
      { action: 'ACCEPT' },
    );
  });

  it('AUTORIZADO e desfecho final', () => {
    expect(
      decideContingency({ kind: 'ANSWERED', status: 'AUTHORIZED' }),
    ).toEqual({ action: 'ACCEPT' });
  });

  it('⚠️⚠️ DESCONHECIDO manda CONSULTAR, nunca emitir em contingencia', () => {
    // O caso que mais convida ao erro. Se a requisição chegou e foi
    // autorizada, uma emissão em contingência criaria DOIS documentos fiscais
    // para a mesma venda — com chaves diferentes, porque `tpEmis` ocupa o
    // dígito 35 da chave. Os dois válidos, um impossível de justificar.
    const decision = decideContingency({ kind: 'UNKNOWN' });

    expect(decision.action).toBe('CONSULT');
    expect(decision.action).not.toBe('CONTINGENCY');
  });

  it('a razao do CONSULT explica o risco, nao so o estado', () => {
    const decision = decideContingency({ kind: 'UNKNOWN' });

    // Quem lê o alarme às 3 da manhã precisa entender por que não pode
    // simplesmente reemitir.
    if (decision.action !== 'CONSULT') throw new Error('esperava CONSULT');
    expect(decision.reason).toContain('segundo documento fiscal');
  });

  it('cobre todos os desfechos possiveis', () => {
    // `switch` exaustivo sobre união discriminada: um desfecho novo sem
    // tratamento vira erro de compilação, não `undefined` em runtime.
    const todos: TransmissionOutcome[] = [
      { kind: 'ANSWERED', status: 'AUTHORIZED' },
      { kind: 'ANSWERED', status: 'REJECTED' },
      { kind: 'UNKNOWN' },
      { kind: 'UNREACHABLE' },
    ];

    for (const outcome of todos) {
      expect(decideContingency(outcome).action).toBeDefined();
    }
  });
});
