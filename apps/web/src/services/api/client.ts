/* ============================================================
   CLIENTE HTTP — o único caminho do front até a API.

   O que mudou em relação ao Supabase: não existe mais SDK, nem anon key no
   bundle, nem token em localStorage. A sessão vive num cookie httpOnly que
   o browser manda sozinho (`credentials: "include"`), e por isso XSS não
   consegue ler a credencial. Quem protege o dado continua sendo o servidor:
   a API aplica o mesmo recorte por setor/papel que a RLS aplicava.
   ============================================================ */

/** Erro padronizado da API. Tudo que sai daqui é um ErroApi — o `message` é
 *  texto de usuário, e é ele que os cards de erro mostram. */
export class ErroApi extends Error {
  readonly status: number;
  readonly codigo: string;

  constructor(status: number, codigo: string, mensagem: string) {
    super(mensagem);
    this.name = "ErroApi";
    this.status = status;
    this.codigo = codigo;
  }

  /** Falha de rede/timeout: status 0. Útil pra decidir retry. */
  get ehRede(): boolean {
    return this.status === 0;
  }

  get mensagem(): string {
    return this.message;
  }
}

export const EVENTO_LOGOUT = "febrahub:sessao-expirada";
/** Chave de localStorage que sincroniza o logout entre abas (evento storage). */
export const CHAVE_DESLOGADO = "febrahub:deslogado-em";
const CHAVE_ULTIMO_REFRESH = "febrahub:ultimo-refresh-em";
const CHAVE_TTL_ACESSO = "febrahub:acesso-ttl-s";
const TRAVA_REFRESH = "febrahub:refresh";

/** Dispara o logout global. O provider ouve, limpa o cache e o app volta ao
 *  login — sem `window.location.href`, que perderia o estado do React. */
function avisarLogout(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EVENTO_LOGOUT));
}

/* ---- relógio compartilhado da sessão (localStorage = visível a toda aba) ---- */

export function marcarSessaoRenovada(): void {
  try { localStorage.setItem(CHAVE_ULTIMO_REFRESH, String(Date.now())); } catch { /* modo privado */ }
}

function ultimaRenovacao(): number {
  try { return Number(localStorage.getItem(CHAVE_ULTIMO_REFRESH)) || 0; } catch { return 0; }
}

/** O backend informa o TTL do acesso no login/eu/refresh; fica guardado para
 *  a renovação proativa saber a hora certa sem chutar. */
export function guardarTtlAcesso(segundos: number | undefined): void {
  if (!segundos || !Number.isFinite(segundos)) return;
  try { localStorage.setItem(CHAVE_TTL_ACESSO, String(Math.floor(segundos))); } catch { /* idem */ }
}

function ttlAcessoSegundos(): number {
  try {
    const s = Number(localStorage.getItem(CHAVE_TTL_ACESSO));
    return Number.isFinite(s) && s > 60 ? s : 900;
  } catch { return 900; }
}

/** O acesso está perto de expirar? (margem de 20% do TTL, piso de 2 min) */
export function sessaoPertoDeExpirar(): boolean {
  const ttlMs = ttlAcessoSegundos() * 1000;
  const margem = Math.max(120_000, ttlMs * 0.2);
  return Date.now() - ultimaRenovacao() >= ttlMs - margem;
}

const BASE = (process.env.NEXT_PUBLIC_API_URL ?? "/api").replace(/\/$/, "");
const TIMEOUT_PADRAO = 30_000;
const MAX_TENTATIVAS = 2; // além da primeira; só GET, só rede/5xx

export type Metodo = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface OpcoesRequisicao {
  metodo?: Metodo;
  corpo?: unknown;
  /** FormData vai cru: o browser precisa montar o boundary do multipart. */
  formulario?: FormData;
  parametros?: Record<string, string | number | boolean | null | undefined>;
  timeout?: number;
  cabecalhos?: Record<string, string>;
  /** Desliga o fluxo de refresh (usado pelo próprio /auth/refresh). */
  semRefresh?: boolean;
}

function montarUrl(caminho: string, parametros?: OpcoesRequisicao["parametros"]): string {
  const base = `${BASE}${caminho.startsWith("/") ? caminho : `/${caminho}`}`;
  if (!parametros) return base;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(parametros)) {
    if (v === null || v === undefined) continue;
    qs.append(k, String(v));
  }
  const s = qs.toString();
  return s ? `${base}?${s}` : base;
}

/** Extrai a mensagem do corpo de erro sem confiar no formato. A API manda
 *  `{ mensagem }` ou `{ message }`; se vier HTML (proxy no caminho), o texto
 *  cru não vai pra tela — vira uma frase honesta. */
async function lerErro(res: Response): Promise<ErroApi> {
  const tipo = res.headers.get("content-type") ?? "";
  let codigo = "erro_http";
  let mensagem = `Falha na requisição (${res.status}).`;
  if (tipo.includes("application/json")) {
    try {
      const corpo: unknown = await res.json();
      if (corpo && typeof corpo === "object") {
        const o = corpo as Record<string, unknown>;
        const m = o.mensagem ?? o.message;
        if (typeof m === "string" && m.trim()) mensagem = m;
        if (typeof o.codigo === "string") codigo = o.codigo;
        else if (typeof o.code === "string") codigo = o.code;
      }
    } catch {
      /* corpo ilegível: fica a mensagem padrão */
    }
  }
  return new ErroApi(res.status, codigo, mensagem);
}

async function executar(caminho: string, opcoes: OpcoesRequisicao): Promise<Response> {
  const { metodo = "GET", corpo, formulario, parametros, timeout = TIMEOUT_PADRAO, cabecalhos } = opcoes;

  const controlador = new AbortController();
  const relogio = setTimeout(() => controlador.abort(), timeout);
  try {
    return await fetch(montarUrl(caminho, parametros), {
      method: metodo,
      // A sessão é cookie httpOnly: sem isto, toda requisição sai anônima.
      credentials: "include",
      signal: controlador.signal,
      headers: {
        Accept: "application/json",
        ...(formulario ? {} : corpo !== undefined ? { "Content-Type": "application/json" } : {}),
        ...cabecalhos,
      },
      body: formulario ?? (corpo !== undefined ? JSON.stringify(corpo) : undefined),
    });
  } catch (e) {
    // AbortError (timeout) e falha de DNS/rede caem aqui, ambas com status 0.
    const abortou = e instanceof DOMException && e.name === "AbortError";
    throw new ErroApi(
      0,
      abortou ? "timeout" : "rede",
      abortou
        ? "A requisição demorou demais e foi cancelada."
        : "Não foi possível falar com o servidor. Verifique a conexão."
    );
  } finally {
    clearTimeout(relogio);
  }
}

const espera = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/* Uma renovação por vez — NA ABA e ENTRE ABAS.

   Na aba: a promise compartilhada (`refrescando`) faz dez views expirando
   juntas dispararem UM único POST /auth/refresh.

   Entre abas: o Web Locks API (`navigator.locks`) serializa as renovações de
   todas as abas do mesmo perfil. Sem isso, duas abas com polling disparavam
   refresh simultâneo com o MESMO cookie — a segunda caía na detecção de
   reuso do backend e a sessão inteira morria "do nada". O backend agora
   tolera a corrida (CAS), mas não provocá-la continua sendo o correto.

   Dentro da trava ainda há a guarda "acabou de renovar": quem esperou a vez
   e descobre que outra aba renovou há segundos só reaproveita o cookie novo,
   que o browser compartilha sozinho. */
let refrescando: Promise<boolean> | null = null;

async function comTravaEntreAbas<T>(fn: () => Promise<T>): Promise<T> {
  if (typeof navigator !== "undefined" && "locks" in navigator && navigator.locks) {
    return navigator.locks.request(TRAVA_REFRESH, fn);
  }
  return fn();
}

async function renovarSessao(): Promise<boolean> {
  refrescando ??= comTravaEntreAbas(async () => {
    if (Date.now() - ultimaRenovacao() < 15_000) return true;
    try {
      const res = await executar("/auth/refresh", { metodo: "POST", semRefresh: true, timeout: 10_000 });
      if (res.ok) marcarSessaoRenovada();
      return res.ok;
    } catch {
      return false;
    }
  }).finally(() => {
    // Solta a trava no próximo tick: quem chegou durante a renovação já
    // pegou ESTA promise; quem chegar depois começa uma nova, se precisar.
    setTimeout(() => {
      refrescando = null;
    }, 0);
  });
  return refrescando;
}

/** Renovação proativa (hooks/sessao-viva): passa pelo MESMO caminho único de
 *  renovação — trava, guarda e marcação — para nunca competir com o fluxo
 *  reativo de 401. */
export async function renovarSessaoProativa(): Promise<boolean> {
  if (!sessaoPertoDeExpirar()) return true;
  return renovarSessao();
}

/** Requisição crua. Devolve a Response — só o `api.*` decodifica. */
async function requisitar(caminho: string, opcoes: OpcoesRequisicao = {}): Promise<Response> {
  const metodo = opcoes.metodo ?? "GET";
  const podeRepetir = metodo === "GET";

  // Acesso perto de expirar? Renova ANTES de chamar: o 401 "esperado" era
  // tratado, mas o navegador loga toda resposta 4xx no console — parecia
  // erro. A trava única de renovarSessao segura a concorrência.
  if (!opcoes.semRefresh && sessaoPertoDeExpirar()) await renovarSessao();

  let tentativa = 0;
  for (;;) {
    let res: Response;
    try {
      res = await executar(caminho, opcoes);
    } catch (e) {
      // Erro de rede: repete só GET (repetir POST duplicaria escrita).
      if (podeRepetir && tentativa < MAX_TENTATIVAS) {
        tentativa += 1;
        await espera(300 * 2 ** (tentativa - 1));
        continue;
      }
      throw e;
    }

    if (res.status === 401 && !opcoes.semRefresh) {
      const renovou = await renovarSessao();
      if (renovou) {
        // UMA repetição após o refresh. Se ela também voltar 401, o problema
        // não é o token expirado — é permissão — e insistir viraria loop.
        const segunda = await executar(caminho, { ...opcoes, semRefresh: true });
        if (segunda.status === 401) {
          avisarLogout();
          throw await lerErro(segunda);
        }
        return segunda;
      }
      avisarLogout();
      throw new ErroApi(401, "sessao_expirada", "Sua sessão expirou. Entre novamente.");
    }

    // 5xx costuma ser reinício de container ou timeout de statement no
    // Postgres: a segunda tentativa pega o plano já quente.
    if (res.status >= 500 && podeRepetir && tentativa < MAX_TENTATIVAS) {
      tentativa += 1;
      await espera(300 * 2 ** (tentativa - 1));
      continue;
    }

    if (!res.ok) throw await lerErro(res);
    return res;
  }
}

async function decodificar<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  const tipo = res.headers.get("content-type") ?? "";
  if (!tipo.includes("application/json")) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  async get<T>(caminho: string, opcoes: Omit<OpcoesRequisicao, "metodo" | "corpo"> = {}): Promise<T> {
    return decodificar<T>(await requisitar(caminho, { ...opcoes, metodo: "GET" }));
  },
  async post<T>(caminho: string, corpo?: unknown, opcoes: Omit<OpcoesRequisicao, "metodo"> = {}): Promise<T> {
    return decodificar<T>(await requisitar(caminho, { ...opcoes, metodo: "POST", corpo }));
  },
  async put<T>(caminho: string, corpo?: unknown, opcoes: Omit<OpcoesRequisicao, "metodo"> = {}): Promise<T> {
    return decodificar<T>(await requisitar(caminho, { ...opcoes, metodo: "PUT", corpo }));
  },
  async patch<T>(caminho: string, corpo?: unknown, opcoes: Omit<OpcoesRequisicao, "metodo"> = {}): Promise<T> {
    return decodificar<T>(await requisitar(caminho, { ...opcoes, metodo: "PATCH", corpo }));
  },
  async delete<T>(caminho: string, opcoes: Omit<OpcoesRequisicao, "metodo"> = {}): Promise<T> {
    return decodificar<T>(await requisitar(caminho, { ...opcoes, metodo: "DELETE" }));
  },
  /** Upload multipart. Timeout maior: arquivo grande em rede ruim. */
  async enviarArquivo<T>(caminho: string, formulario: FormData, timeout = 120_000): Promise<T> {
    return decodificar<T>(await requisitar(caminho, { metodo: "POST", formulario, timeout }));
  },
};
