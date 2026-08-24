import { mapCstatToStatus } from '../cstat-mapping';

describe('mapCstatToStatus (FR-002, FR-003)', () => {
  it('107 → OPERATIONAL', () => {
    expect(mapCstatToStatus('107')).toEqual({
      status: 'OPERATIONAL',
      unrecognized: false,
    });
  });

  it('108 (paralisado momentâneo) → DOWN', () => {
    expect(mapCstatToStatus('108')).toEqual({
      status: 'DOWN',
      unrecognized: false,
    });
  });

  it('109 (paralisado sem previsão) → DOWN', () => {
    expect(mapCstatToStatus('109')).toEqual({
      status: 'DOWN',
      unrecognized: false,
    });
  });

  it('cStat desconhecido → DOWN, sinalizado como não reconhecido (nunca OPERATIONAL — FR-003)', () => {
    const result = mapCstatToStatus('999');
    expect(result.status).toBe('DOWN');
    expect(result.unrecognized).toBe(true);
  });

  it('tolera espaços ao redor do código', () => {
    expect(mapCstatToStatus(' 107 ').status).toBe('OPERATIONAL');
  });

  it('FR-003: nenhum cStat de resposta produz UNREACHABLE', () => {
    // A ausência de resposta é tratada antes, fora desta função. Se um código
    // chegou, houve resposta — logo nunca UNREACHABLE aqui.
    for (const code of ['107', '108', '109', '999', '', 'abc']) {
      expect(mapCstatToStatus(code).status).not.toBe('UNREACHABLE');
    }
  });
});
