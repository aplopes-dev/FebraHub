/* Fronteira entre o organograma do FebraHub e o bloco /brain vendorado do
   os-aplopes (components/organograma/os — cópia literal). Os componentes
   esperam os schemas do Founder OS (Agent/Department/Person/SopTask); aqui
   os OrgMembro viram esse formato, no mesmo espírito do http-client.ts do
   porte do CRM: os arquivos copiados ficam intactos, quem traduz é a borda.

   Mapa: setor → Department (com a cor da casa) · função → SopTask (uma por
   MEMBRO, porque o grafo da origem é monógamo: cada task tem exatamente um
   executor — duas consultoras viram duas tasks "Consultora de Vendas") ·
   membro → Agent (agente de IA) ou Person (funcionário). Sem tools. */

import { buildKnowledgeGraph, type KnowledgeGraph } from "@/lib/knowledge-graph";
import type { Agent, Department, Person, SopTask } from "@/lib/schemas";
import { HUBS } from "@/lib/hubs";
import { SETORES_ORGANOGRAMA, type OrgMembro, type SetorOrganograma } from "@/types/organograma";

/* Mesma paleta de setor usada antes do porte — meio-tom que segura contraste
   nos dois skins do OS (papel claro e terminal fósforo). */
export const COR_SETOR: Record<SetorOrganograma, string> = {
  comercial: "#C98A2D",
  financeiro: "#3E9B6C",
  marketing: "#C4618C",
  pedagogico: "#4E88C7",
  eventos: "#8E6BC1",
  loja: "#C0703E",
  estoque: "#5C93A6",
};

export interface DadosGrafoOrganograma {
  graph: KnowledgeGraph;
  agents: Agent[];
  departments: Department[];
  people: Person[];
  tasks: SopTask[];
}

export function adaptarOrganograma(membros: OrgMembro[]): DadosGrafoOrganograma {
  const nomeDoSetor = (chave: string) => HUBS.find((h) => h.key === chave)?.nome ?? chave;

  const departments: Department[] = SETORES_ORGANOGRAMA.map((chave, i) => ({
    id: chave,
    name: nomeDoSetor(chave),
    slug: chave,
    tagline: HUBS.find((h) => h.key === chave)?.desc ?? "",
    color: COR_SETOR[chave],
    order: i,
  }));

  const agents: Agent[] = membros
    .filter((m) => m.tipo === "agente")
    .map((m) => ({
      id: m.id,
      departmentId: m.setor,
      name: m.nome,
      role: m.funcao,
      status: "active" as const,
      tier: "worker" as const,
      description: `${m.funcao} — agente de IA do setor ${nomeDoSetor(m.setor)}.`,
      model: "—",
      tools: [],
      parentId: null,
      instance: "builtin",
    }));

  const people: Person[] = membros
    .filter((m) => m.tipo === "funcionario")
    .map((m) => ({
      id: m.id,
      departmentId: m.setor,
      name: m.nome,
      role: m.funcao,
      tools: [],
    }));

  const tasks: SopTask[] = membros.map((m) => ({
    id: `fn-${m.id}`,
    departmentId: m.setor,
    title: m.funcao,
    summary: `${m.funcao} no setor ${nomeDoSetor(m.setor)} — ${m.tipo === "agente" ? "agente de IA" : "funcionário"}: ${m.nome}.`,
    steps: [`Responsável: ${m.nome}`, `Setor: ${nomeDoSetor(m.setor)}`, `Função: ${m.funcao}`],
    assigneeKind: m.tipo === "agente" ? ("agent" as const) : ("person" as const),
    assigneeId: m.id,
  }));

  const graph = buildKnowledgeGraph(agents, departments, people, tasks);

  /* buildKnowledgeGraph tinge os pilares pelo life-map da origem, que não
     conhece nossos setores — recolore com a paleta da casa. O rótulo do
     núcleo também: lá é o operador (Alex), aqui é a Dulce. */
  for (const n of graph.nodes) {
    if (n.kind === "team") {
      const chave = n.id.replace("team:", "") as SetorOrganograma;
      n.color = COR_SETOR[chave] ?? n.color;
    }
    if (n.kind === "self") n.label = "Dulce";
  }

  return { graph, agents, departments, people, tasks };
}
