/**
 * As fontes que autenticam por OAuth2 e o que cada uma exige.
 *
 * Este arquivo é só descrição — a mecânica (montar URL, trocar código,
 * renovar) mora no serviço. A separação existe para que acrescentar uma fonte
 * nova seja acrescentar uma entrada aqui, e não espalhar `if (fonte === ...)`.
 */

export type Fonte = 'contaazul' | 'meta';

/** Como a fonte se renova sem ninguém no navegador. */
export type ModoRenovacao =
  /** OAuth clássico: guarda-se um refresh_token e ele vira access_token novo. */
  | 'refresh_token'
  /**
   * Meta: não existe refresh_token. Troca-se o token de longa duração ATUAL
   * por outro de longa duração (`grant_type=fb_exchange_token`) — e isso só
   * funciona enquanto o atual AINDA é válido. Daí a renovação proativa: depois
   * que expira, não há o que trocar e alguém tem que reautorizar no navegador.
   */
  | 'fb_exchange_token';

export interface DefinicaoProvedor {
  fonte: Fonte;
  nome: string;
  /**
   * Chave da linha em `integracao_tokens`. Igual à `fonte` hoje, mas explícita
   * porque o ETL do Conta Azul já lê `GET /ingest/token/contaazul` — mudar
   * essa string quebraria a carga.
   */
  chaveToken: string;
  /**
   * Nomes que a fonte usa em `integracao_status`. É uma LISTA porque o Meta
   * aparece com dois: `meta` (registrado pelo sync.sh) e `meta_ads`
   * (registrado pelo próprio meta_sync.py). Vale a sincronização mais recente.
   */
  fontesStatus: readonly string[];
  urlAutorizacao: string;
  urlToken: string;
  escopo: string;
  modoRenovacao: ModoRenovacao;
  /**
   * O que `integracao_tokens.expira_em` significa para esta fonte — é o que
   * decide se dá para usar a data como semáforo:
   *
   *  'access'  → é a validade real da credencial (Meta: ~60 dias). Serve.
   *  'refresh' → a data é do access_token de vida curta (Conta Azul: 1h) e
   *              estar vencida é o estado NORMAL entre uma carga e outra. Aqui
   *              o que importa é existir refresh_token; a data vira informação.
   */
  validadeRelevante: 'access' | 'refresh';
  /** Texto que a tela mostra ao lado da data, para ela não ser lida errado. */
  notaValidade: string;
  /** Nome das variáveis de ambiente, citadas quando faltam. */
  envs: { id: string; segredo: string };
}

export const PROVEDORES: Record<Fonte, DefinicaoProvedor> = {
  contaazul: {
    fonte: 'contaazul',
    nome: 'Conta Azul',
    chaveToken: 'contaazul',
    fontesStatus: ['contaazul'],
    urlAutorizacao: 'https://auth.contaazul.com/oauth2/authorize',
    urlToken: 'https://auth.contaazul.com/oauth2/token',
    // Sobrescrito pelo CONTAAZUL_SCOPE (ver config/configuracao.ts).
    escopo: 'openid profile aws.cognito.signin.user.admin',
    modoRenovacao: 'refresh_token',
    validadeRelevante: 'refresh',
    notaValidade:
      'A data é do access token (≈1h). O que sustenta a integração é o refresh token, ' +
      'que a API rotaciona a cada renovação.',
    envs: { id: 'CONTAAZUL_CLIENT_ID', segredo: 'CONTAAZUL_CLIENT_SECRET' },
  },
  meta: {
    fonte: 'meta',
    nome: 'Meta Ads',
    chaveToken: 'meta',
    fontesStatus: ['meta', 'meta_ads'],
    urlAutorizacao: 'https://www.facebook.com/v25.0/dialog/oauth',
    urlToken: 'https://graph.facebook.com/v25.0/oauth/access_token',
    escopo: 'ads_read,business_management',
    modoRenovacao: 'fb_exchange_token',
    validadeRelevante: 'access',
    notaValidade:
      'Token de longa duração (≈60 dias). A renovação diária o troca por um novo ' +
      'ANTES do vencimento — depois de expirado, só reautorizando no navegador.',
    envs: { id: 'META_APP_ID', segredo: 'META_APP_SECRET' },
  },
};

export const FONTES = Object.keys(PROVEDORES) as Fonte[];

export const ehFonte = (v: string): v is Fonte => v in PROVEDORES;
