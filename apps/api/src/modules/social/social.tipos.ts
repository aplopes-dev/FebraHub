/**
 * O QUE A TELA RECEBE — e por que não é o payload do Zernio.
 *
 * O Zernio devolve o denominador comum de 16 redes: um post traz 20 campos,
 * metade deles específicos de TikTok ou do Google Meu Negócio. Repassar isso
 * cru faria a tela reimplementar, em TypeScript de navegador, o entendimento
 * do contrato de um fornecedor — e mudança de contrato viraria bug de
 * renderização em vez de erro de compilação aqui.
 *
 * Então a fronteira é este arquivo: nomes em português, só o que a tela usa, e
 * `null` explícito onde o dado pode faltar (métrica de engajamento, por
 * exemplo, depende do add-on de analytics do Zernio — inventar zero seria
 * mentir sobre alcance).
 */

/** Redes com nome próprio na tela. Fora daqui, o rótulo é o id capitalizado. */
export type Rede = string;

export interface ContaSocial {
  id: string;
  rede: Rede;
  usuario: string | null;
  nome: string | null;
  foto: string | null;
  url: string | null;
  ativa: boolean;
  /** O token morreu: publicar vai falhar até alguém reconectar no Zernio. */
  precisaReconectar: boolean;
  /** Nulo quando a assinatura do Zernio não inclui o add-on de analytics. */
  seguidores: number | null;
  /** Conta de ANÚNCIOS (metaads, googleads…), não de publicação. */
  deAnuncio: boolean;
}

export interface PontoSerie {
  data: string;
  valor: number;
}

export interface VisaoGeral {
  contas: ContaSocial[];
  totalSeguidores: number | null;
  /** O Zernio entrega contagem de seguidores? Decide o que a tela mostra. */
  temAnalytics: boolean;
  /** Audiência somada, dia a dia. Vazia quando não há histórico. */
  serie: PontoSerie[];
  publicadas30d: number;
  agendadas: number;
  conversasAbertas: number;
}

export interface DestinoPostagem {
  rede: Rede;
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
  status: 'rascunho' | 'agendada' | 'publicando' | 'publicada' | 'falhou' | 'parcial' | string;
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
  rede: Rede;
  status: string;
  conteudo: string;
  publicadaEm: string | null;
  url: string | null;
  miniatura: string | null;
  metricas: MetricasPostagem;
  /** 'synced' | 'pending' | 'partial' | 'unavailable' — a tela avisa quando os
   *  números ainda não chegaram, em vez de mostrar zeros. */
  sincronia: string;
}

export interface Conversa {
  id: string;
  rede: Rede;
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
  /** 'entrada' = veio do público; 'saida' = respondemos. */
  sentido: 'entrada' | 'saida';
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
  rede: Rede;
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
  /** Soma das campanhas do período — o cabeçalho do painel. */
  total: MetricasCampanha;
  moeda: string | null;
  contas: { id: string; nome: string; moeda: string | null; status: string | null }[];
  de: string;
  ate: string;
}
