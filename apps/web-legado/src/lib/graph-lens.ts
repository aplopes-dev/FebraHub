/**
 * Lentes sobre o grafo do organograma — adaptação de domínio do graph-lens
 * do os-aplopes (a mecânica é a mesma: escolher uma lente acende os nós que
 * casam e esmaece o resto; matchers puros, o componente fornece a lista de
 * nós e o resolvedor de setor).
 *
 * A origem fatiava o grafo do Founder OS (ventures, ações de marketing,
 * ferramentas); aqui as lentes falam a língua do organograma da Febracis:
 * ENTIDADE (tipo de nó) e ÁREA (grupos de setores). O grupo de AÇÕES da
 * origem não tem equivalente nos dados — ficou de fora em vez de virar um
 * dropdown morto.
 */

export type LensGroup = 'entity' | 'function' | 'action';

export type Lens = { id: string; group: LensGroup; label: string };

export type LensNode = { id: string; kind: string };

export type LensContext = {
  nodes: LensNode[];
  /** resolve qualquer nó para o id do nó do setor (`team:<setor>`), ou null */
  teamOf: (nodeId: string) => string | null;
};

export const ENTITY_LENSES: Lens[] = [
  { id: 'ent-people', group: 'entity', label: 'Funcionários' },
  { id: 'ent-agents', group: 'entity', label: 'Agentes de IA' },
  { id: 'ent-sops', group: 'entity', label: 'Funções' },
  { id: 'ent-departments', group: 'entity', label: 'Setores' },
];

/** Grupos de setores — quem traz receita, quem entrega o produto, quem sustenta. */
export const FUNCTION_LENSES: Lens[] = [
  { id: 'fn-receita', group: 'function', label: 'Receita' },
  { id: 'fn-entrega', group: 'function', label: 'Entrega' },
  { id: 'fn-suporte', group: 'function', label: 'Suporte' },
];

/** Sem equivalente nos dados do organograma (a origem mapeava agentes seed). */
export const ACTION_LENSES: Lens[] = [];

export const ALL_LENSES: Lens[] = [...ENTITY_LENSES, ...FUNCTION_LENSES, ...ACTION_LENSES];

const SETORES_POR_LENTE: Record<string, Set<string>> = {
  'fn-receita': new Set(['team:comercial', 'team:marketing', 'team:loja', 'team:eventos']),
  'fn-entrega': new Set(['team:pedagogico']),
  'fn-suporte': new Set(['team:financeiro', 'team:estoque']),
};

/** Os ids de nó que uma lente acende. Lente desconhecida → conjunto vazio. */
export function lensNodeSet(lensId: string, ctx: LensContext): Set<string> {
  const out = new Set<string>();
  const byKind = (kind: string) => {
    for (const n of ctx.nodes) if (n.kind === kind) out.add(n.id);
  };
  switch (lensId) {
    case 'ent-people':
      byKind('person');
      break;
    case 'ent-agents':
      byKind('employee');
      break;
    case 'ent-sops':
      byKind('task');
      break;
    case 'ent-departments':
      byKind('team');
      break;
    default: {
      const setores = SETORES_POR_LENTE[lensId];
      if (!setores) break;
      for (const n of ctx.nodes) {
        const team = n.kind === 'team' ? n.id : ctx.teamOf(n.id);
        if (team && setores.has(team)) out.add(n.id);
      }
    }
  }
  return out;
}
