/// FR-004 — acima de certo valor, a venda a consumidor **não identificado**
/// deixa de caber em cupom fiscal e exige NF-e.
///
/// ⚠️ **Por que isto não é uma constante.** O limite é legislação **estadual** e
/// muda sem aviso: um valor cravado no fonte transforma mudança de decreto em
/// incidente de produção esperando janela de release. A precedência é
/// ambiente → tabela por UF → padrão, de modo que a operação corrija por
/// configuração no dia em que o decreto sair.
///
/// ⚠️ **O valor padrão precisa de confirmação.** Ele reflete o patamar
/// nacionalmente mais citado, não uma leitura do decreto vigente na Bahia.
/// Antes de produção, confirme o limite atual junto à SEFAZ-BA e fixe-o por
/// `NFCE_CONSUMER_LIMIT_BA` — um limite alto demais deixa passar venda que
/// exigia NF-e, e um baixo demais recusa venda legítima no balcão.
export const DEFAULT_CONSUMER_IDENTIFICATION_LIMIT = 10_000;

/// Limites conhecidos por UF. Vazia hoje de propósito: preencher com um valor
/// não confirmado daria aparência de autoridade a um palpite. O caminho para
/// operar é a variável de ambiente.
const LIMIT_BY_UF: Partial<Record<string, number>> = {};

function envKeyFor(uf: string): string {
  return `NFCE_CONSUMER_LIMIT_${uf.trim().toUpperCase()}`;
}

/// Limite vigente para a UF, em reais.
export function consumerIdentificationLimitFor(uf: string): number {
  const configured = process.env[envKeyFor(uf)];

  if (configured !== undefined) {
    const parsed = Number(configured);
    // ⚠️ Configuração inválida cai no padrão, **nunca** vira `NaN`. Toda
    // comparação com `NaN` é falsa, então um `NFCE_CONSUMER_LIMIT_BA=abc`
    // faria o limite deixar de existir em silêncio e liberaria cupom de
    // qualquer valor sem identificação. Falhar para o lado restritivo é o
    // único lado seguro aqui.
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }

  return (
    LIMIT_BY_UF[uf.trim().toUpperCase()] ??
    DEFAULT_CONSUMER_IDENTIFICATION_LIMIT
  );
}

/// `true` quando a venda **exige** consumidor identificado.
///
/// Estritamente "acima de", não "a partir de": o valor exatamente no limite
/// ainda passa. Errar essa borda recusaria a venda no valor cheio, e o operador
/// não teria como entender por quê — o valor bate com o limite publicado.
export function requiresConsumerIdentification(
  uf: string,
  totalAmount: number,
): boolean {
  return totalAmount > consumerIdentificationLimitFor(uf);
}
