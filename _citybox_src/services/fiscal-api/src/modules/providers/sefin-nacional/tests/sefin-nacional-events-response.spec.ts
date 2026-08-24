import { parseSefinEventsResponse } from '../infrastructure/sefin-nacional-events-response';

/// T035 — leitura de `GET /nfse/{chave}/eventos`.
///
/// Tolerante por necessidade (o formato não pôde ser confirmado no OpenAPI),
/// mas estrita no que decide se algo é ou não um evento.
describe('parseSefinEventsResponse', () => {
  it('reads a bare array of events', () => {
    const events = parseSefinEventsResponse([
      {
        tipoEvento: 'e101101',
        ambGer: 2,
        dhEvento: '2026-08-05T10:00:00-03:00',
      },
    ]);

    expect(events).toHaveLength(1);
    expect(events[0].nationalEventCode).toBe('e101101');
    expect(events[0].generatorEnvironment).toBe(2);
  });

  it('reads events wrapped under the envelope keys the docs use', () => {
    for (const key of ['eventos', 'Eventos', 'listaEventos']) {
      const events = parseSefinEventsResponse({
        [key]: [{ tipoEvento: 'e105102' }],
      });
      expect(events).toHaveLength(1);
    }
  });

  /// O código pode vir como **nome** do elemento que carrega o corpo,
  /// espelhando o XML — não só como valor de um campo.
  it('recognises the event code when it is the property name', () => {
    const events = parseSefinEventsResponse([
      { e101103: { xDesc: 'Solicitação de Análise Fiscal' }, ambGer: 1 },
    ]);

    expect(events[0].nationalEventCode).toBe('e101103');
  });

  it('accepts a six-digit code without the "e" prefix', () => {
    const events = parseSefinEventsResponse([{ tipoEvento: '105104' }]);
    expect(events[0].nationalEventCode).toBe('e105104');
  });

  /// Um evento sem código não é um evento: virar linha vazia na trilha do
  /// contribuinte é pior que não aparecer. Descartar é a escolha.
  it('drops entries with no recognisable event code', () => {
    const events = parseSefinEventsResponse([
      { descricao: 'algo', ambGer: 2 },
      { tipoEvento: 'nao-e-um-codigo' },
      { tipoEvento: 'e101101' },
    ]);

    expect(events).toHaveLength(1);
    expect(events[0].nationalEventCode).toBe('e101101');
  });

  /// Filtra por **forma** (`e` + 6 dígitos), não por lista fechada: um código
  /// novo que o órgão passe a emitir deve aparecer como desconhecido na linha
  /// do tempo, não sumir dela.
  it('keeps an event code it has never seen before', () => {
    const events = parseSefinEventsResponse([{ tipoEvento: 'e999999' }]);
    expect(events[0].nationalEventCode).toBe('e999999');
  });

  /// `Invalid Date` propagado quebraria a ordenação da linha do tempo em
  /// silêncio — vira `null`, que é ordenável de forma previsível.
  it('turns an unparseable date into null rather than an Invalid Date', () => {
    const events = parseSefinEventsResponse([
      { tipoEvento: 'e101101', dhEvento: 'nao-e-data' },
    ]);

    expect(events[0].occurredAt).toBeNull();
  });

  it('returns an empty list for shapes it does not recognise', () => {
    expect(parseSefinEventsResponse(null)).toEqual([]);
    expect(parseSefinEventsResponse({ inesperado: true })).toEqual([]);
    expect(parseSefinEventsResponse('texto')).toEqual([]);
  });
});
