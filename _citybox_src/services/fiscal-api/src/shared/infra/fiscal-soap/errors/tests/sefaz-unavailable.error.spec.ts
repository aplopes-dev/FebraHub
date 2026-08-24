import { SefazUnavailableError } from '../sefaz-unavailable.error';

/// Esta classe existe por causa de uma sessão inteira perdida diagnosticando
/// `[object Object]`: o `node-soap` rejeita com um `Error` cuja `.message` é
/// literalmente isso, e a resposta real do órgão fiscal fica em propriedades
/// **anexadas** (`body`, `response`, `statusCode`).
///
/// Os testes abaixo travam esse comportamento. Sem eles, alguém "simplificando"
/// `describeCause` para `String(cause)` reintroduziria exatamente o problema —
/// e o sintoma só apareceria em produção, na hora de diagnosticar uma falha.
describe('SefazUnavailableError', () => {
  function messageFor(cause: unknown): string {
    return new SefazUnavailableError('teste', 'https://exemplo', cause)
      .internalMessage;
  }

  it('surfaces the HTTP body attached to an Error whose message is useless', () => {
    const cause = Object.assign(new Error('[object Object]'), {
      statusCode: 500,
      body: '<soap:Fault><faultstring>Certificado recusado</faultstring></soap:Fault>',
    });

    const message = messageFor(cause);

    expect(message).toContain('statusCode=500');
    expect(message).toContain('Certificado recusado');
  });

  /// A resposta pode vir aninhada em `response` em vez de na raiz — as duas
  /// formas aparecem conforme o caminho de falha do `node-soap`.
  it('reads status and body nested under response', () => {
    const cause = Object.assign(new Error('falhou'), {
      response: { statusCode: 403, body: 'Forbidden' },
    });

    const message = messageFor(cause);

    expect(message).toContain('statusCode=403');
    expect(message).toContain('Forbidden');
  });

  it('keeps the plain message when there is nothing attached', () => {
    expect(messageFor(new Error('socket hang up'))).toContain('socket hang up');
  });

  /// Rejeição com objeto puro (não `Error`) é o caso que produzia
  /// "[object Object]" sem nenhuma pista.
  it('describes a rejection that is a plain object, not an Error', () => {
    const message = messageFor({
      code: 'ECONNRESET',
      statusCode: 502,
      body: 'Bad Gateway',
    });

    expect(message).toContain('ECONNRESET');
    expect(message).toContain('502');
    expect(message).toContain('Bad Gateway');
    expect(message).not.toContain('[object Object]');
  });

  it('handles a string cause and a primitive cause without throwing', () => {
    expect(messageFor('timeout')).toContain('timeout');
    expect(messageFor(undefined)).toBeTruthy();
  });

  /// Corpo enorme não pode inundar o log — é truncado, mas o começo, que é
  /// onde o órgão põe o código do erro, é preservado.
  it('truncates a huge body while keeping its beginning', () => {
    const cause = Object.assign(new Error('erro'), {
      body: `INICIO-DIAGNOSTICO${'x'.repeat(5000)}`,
    });

    const message = messageFor(cause);

    expect(message).toContain('INICIO-DIAGNOSTICO');
    expect(message.length).toBeLessThan(2000);
  });

  /// Referência circular no corpo não pode derrubar o próprio relato do erro —
  /// falhar ao descrever uma falha esconde as duas.
  it('does not blow up on a circular structure', () => {
    const circular: Record<string, unknown> = { nome: 'ciclo' };
    circular.self = circular;

    expect(() => messageFor({ body: circular })).not.toThrow();
  });
});
