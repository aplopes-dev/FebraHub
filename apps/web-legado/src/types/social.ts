/* Redes sociais (Zernio) — o espelho de apps/api/src/modules/social/social.tipos.ts.

   O front NUNCA fala com o Zernio direto: tudo passa por /api/social, que é
   quem tem a chave e quem traduz o payload. Se estes tipos e os de lá
   divergirem, o erro aparece no build da API primeiro (é ela quem serializa),
   não numa tela em branco. */

export interface ContaSocial {
  id: string;
  rede: string;
  usuario: string | null;
  nome: string | null;
  foto: string | null;
  url: string | null;
  ativa: boolean;
  precisaReconectar: boolean;
  /** Nulo = a assinatura do Zernio não inclui o add-on de analytics. */
  seguidores: number | null;
  deAnuncio: boolean;
}

export interface PontoSerie {
  data: string;
  valor: number;
}

export interface VisaoGeralSocial {
  contas: ContaSocial[];
  totalSeguidores: number | null;
  temAnalytics: boolean;
  serie: PontoSerie[];
  publicadas30d: number;
  agendadas: number;
  conversasAbertas: number;
}

export interface DestinoPostagem {
  rede: string;
  contaId: string | null;
  status: string | null;
  url: string | null;
  publicadaEm: string | null;
  erro: string | null;
}

export interface Postagem {
  id: string;
  titulo: string | null;
  conteudo: string;
  status: string;
  destinos: DestinoPostagem[];
  agendadaPara: string | null;
  criadaEm: string | null;
  midia: { tipo: string; url: string; miniatura: string | null }[];
}

export interface PaginaPostagens {
  postagens: Postagem[];
  total: number;
  pagina: number;
  paginas: number;
}

export interface MetricasPostagem {
  impressoes: number | null;
  alcance: number | null;
  curtidas: number | null;
  comentarios: number | null;
  compartilhamentos: number | null;
  salvos: number | null;
  cliques: number | null;
  visualizacoes: number | null;
  novosSeguidores: number | null;
  taxaEngajamento: number | null;
}

export interface AnalisePostagem {
  postId: string;
  rede: string;
  status: string;
  conteudo: string;
  publicadaEm: string | null;
  url: string | null;
  miniatura: string | null;
  metricas: MetricasPostagem;
  sincronia: string;
}

export interface Conversa {
  id: string;
  rede: string;
  contaId: string;
  contaUsuario: string | null;
  participante: string;
  foto: string | null;
  ultimaMensagem: string;
  atualizadaEm: string | null;
  naoLidas: number;
  url: string | null;
}

export interface Mensagem {
  id: string;
  texto: string;
  sentido: "entrada" | "saida";
  autor: string | null;
  criadaEm: string | null;
  anexos: { tipo: string | null; url: string | null }[];
}

export interface MetricasCampanha {
  gasto: number;
  impressoes: number;
  alcance: number;
  cliques: number;
  ctr: number;
  cpc: number;
  cpm: number;
  engajamento: number;
  conversoes: number;
  custoPorConversao: number;
  valorConvertido: number;
  roas: number;
}

export interface Campanha {
  id: string;
  rede: string;
  nome: string;
  status: string;
  moeda: string | null;
  orcamento: number | null;
  nivelOrcamento: string | null;
  anuncios: number;
  contaAnuncioId: string | null;
  contaAnuncioNome: string | null;
  objetivo: string | null;
  metricas: MetricasCampanha;
}

export interface PainelCampanhas {
  campanhas: Campanha[];
  total: MetricasCampanha;
  moeda: string | null;
  contas: { id: string; nome: string; moeda: string | null; status: string | null }[];
  de: string;
  ate: string;
}

export interface ConfigSocial {
  temChave: boolean;
  /** Os 4 últimos caracteres — confere QUAL chave está gravada sem revelá-la. */
  finalChave: string | null;
  perfilZernio: string | null;
  contaAnuncio: string | null;
  fuso: string;
  atualizadoEm: string;
}

/** As redes onde o Zernio tem caixa de entrada — as demais não oferecem DM
 *  por API, e pedir só devolveria erro do fornecedor. */
export const REDES_COM_INBOX = [
  "instagram",
  "facebook",
  "whatsapp",
  "twitter",
  "telegram",
  "reddit",
  "bluesky",
] as const;
