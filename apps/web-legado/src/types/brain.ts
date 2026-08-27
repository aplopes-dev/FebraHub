/* Memória institucional (GBrain) — o front nunca fala com o gbrain direto:
   tudo passa por /api/brain, que é quem tem a credencial da pessoa. */

export interface FontesBrain {
  /** As fontes que a sessão pode LER. */
  leitura: string[];
  /** A fonte onde ela ESCREVE (o setor primário). */
  escrita: string;
}

export interface ResultadoBrain {
  slug: string;
  titulo: string;
  trecho: string;
  fonte: string;
  score: number | null;
}

export interface RespostaBrain {
  resposta: string;
  citacoes: { slug: string; titulo: string; fonte: string }[];
  /** O que o gbrain diz que NÃO encontrou para responder melhor. */
  lacunas?: string[];
}

export interface EstadoBrain {
  disponivel: boolean;
  fontes: { id: string; paginas: number | null }[];
}

/** Motor de resposta. A chave nunca chega ao navegador — só se existe uma. */
export interface ConfigBrain {
  temChave: boolean;
  modelo: string;
  provedor: "openai" | "local";
  atualizadoEm: string;
}

/** Agenda da consolidação diária (dados do sistema → memória). */
export interface ConsolidacaoBrain {
  ativa: boolean;
  hora: string;
  fuso: string;
  cron: string;
  ultimaConsolidacaoEm: string | null;
}

export const MODELOS_SINTESE: { id: string; nome: string; nota: string }[] = [
  { id: "gpt-5.6-luna", nome: "GPT-5.6 Luna", nota: "Padrão — inteligente, rápido e econômico" },
  { id: "gpt-4o-mini", nome: "GPT-4o mini", nota: "Alternativa leve" },
  { id: "gpt-5.2", nome: "GPT-5.2", nota: "Geração anterior, mais cara" },
];
