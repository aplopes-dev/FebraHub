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
