/// Prazo legal para transmitir à SEFAZ um cupom emitido em contingência
/// offline, em horas contadas a partir da emissão.
///
/// ⚠️ **Precisa de confirmação antes de produção.** 24 horas é o patamar
/// amplamente praticado para contingência offline de NFC-e, mas não é leitura
/// do decreto vigente na Bahia. Confirme junto à SEFAZ-BA e ajuste por
/// `NFCE_CONTINGENCY_DEADLINE_HOURS` — um prazo folgado demais silencia o
/// alarme justamente quando ele importaria.
export const DEFAULT_CONTINGENCY_DEADLINE_HOURS = 24;

const ENV_KEY = 'NFCE_CONTINGENCY_DEADLINE_HOURS';

/// Configurável por ambiente pela mesma razão do limite de valor: é prazo
/// legal, muda sem aviso, e um número cravado no fonte transforma mudança de
/// norma em incidente esperando release.
export function contingencyDeadlineHours(): number {
  const configured = process.env[ENV_KEY];
  if (configured !== undefined) {
    const parsed = Number(configured);
    // Configuração inválida cai no padrão. `NaN` faria toda comparação de
    // prazo ser falsa — ou seja, **nenhum cupom ficaria atrasado**, e o alarme
    // desapareceria em silêncio. Falhar para o lado que alarma é o único lado
    // seguro.
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return DEFAULT_CONTINGENCY_DEADLINE_HOURS;
}

/// Instante a partir do qual um cupom emitido em `emittedAt` está fora do
/// prazo.
export function contingencyDeadlineFor(emittedAt: Date): Date {
  return new Date(
    emittedAt.getTime() + contingencyDeadlineHours() * 60 * 60 * 1000,
  );
}

/// Limite para a busca de atrasados: tudo emitido antes disto já estourou.
export function overdueThreshold(now: Date): Date {
  return new Date(now.getTime() - contingencyDeadlineHours() * 60 * 60 * 1000);
}
