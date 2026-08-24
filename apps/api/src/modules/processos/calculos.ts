export const PESOS_PILARES = { sistema: 0.6, automacao: 0.25, agentes_ia: 0.15 } as const;

export interface EntregaCalculo { pilar: keyof typeof PESOS_PILARES; peso: number; situacao: string; percentualAceito: number }

export function calcularProgresso(entregas: EntregaCalculo[]) {
  const pilares = Object.fromEntries(Object.keys(PESOS_PILARES).map((pilar) => {
    const itens = entregas.filter((e) => e.pilar === pilar && e.situacao !== 'cancelado');
    const total = itens.reduce((s, e) => s + e.peso, 0);
    const feito = itens.reduce((s, e) => s + e.peso * (e.situacao === 'concluido' ? 100 : e.percentualAceito), 0);
    return [pilar, total ? feito / total : 0];
  })) as Record<keyof typeof PESOS_PILARES, number>;
  const geral = Object.entries(PESOS_PILARES).reduce((s, [p, peso]) => s + pilares[p as keyof typeof pilares] * peso, 0);
  return { geral: arredondar(geral), pilares: { sistema: arredondar(pilares.sistema), automacao: arredondar(pilares.automacao), agentesIa: arredondar(pilares.agentes_ia) } };
}

const arredondar = (n: number) => Math.round(n * 100) / 100;
