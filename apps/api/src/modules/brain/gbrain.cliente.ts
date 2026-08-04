import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * O ÚNICO ponto do FebraHub que fala com o GBrain.
 *
 * Três superfícies do servidor do gbrain, e nenhuma delas chega ao navegador:
 *
 *   POST /admin/login          -> troca o token de bootstrap por um cookie de
 *                                 sessão (em memória do lado dele: morre no
 *                                 restart, então reautenticamos no 401).
 *   POST /admin/api/*          -> registrar, reescopar e revogar clientes.
 *   POST /token                -> client_credentials de UMA pessoa.
 *   POST /mcp                  -> JSON-RPC das operações, com Bearer.
 *
 * Por que JSON-RPC na unha em vez do SDK de MCP: são três chamadas com corpo
 * fixo. Trazer o SDK para dentro da API significaria mais uma dependência de
 * runtime só para montar um envelope de dez linhas.
 */
@Injectable()
export class GbrainCliente {
  private readonly logger = new Logger(GbrainCliente.name);
  private readonly base: string;
  private readonly tokenAdmin: string;
  /** Cookie de sessão do /admin. Renovado sob demanda. */
  private sessaoAdmin: string | null = null;
  /** Tokens de cliente em cache até pouco antes de vencerem. */
  private readonly tokens = new Map<string, { valor: string; expiraEm: number }>();

  constructor(config: ConfigService) {
    this.base = (config.get<string>('BRAIN_URL') ?? 'http://brain:3131').replace(/\/$/, '');
    this.tokenAdmin = config.get<string>('BRAIN_ADMIN_TOKEN') ?? '';
  }

  get configurado(): boolean {
    return !!this.tokenAdmin;
  }

  async saudavel(): Promise<boolean> {
    try {
      const r = await this.buscar('/health', { method: 'GET' });
      return r.ok;
    } catch {
      return false;
    }
  }

  /* ----------------------------- administração ----------------------------- */

  async registrarCliente(nome: string): Promise<{ clientId: string; clientSecret: string }> {
    const r = await this.admin<{ clientId: string; clientSecret: string }>('/admin/api/register-client', {
      name: nome,
      // `read write`: ler a memória e registrar página. Nada de `admin` — um
      // cliente de pessoa não gerencia outros clientes.
      scopes: 'read write',
      grantTypes: ['client_credentials'],
    });
    return r;
  }

  /**
   * Define o recorte: `sourceId` é onde a pessoa ESCREVE, `federatedRead` é o
   * que ela LÊ. É esta chamada que faz a permissão do FebraHub valer dentro
   * do gbrain — depois dela, o filtro acontece no SQL dele, e nem a resposta
   * sintetizada consegue atravessar para um setor que a pessoa não alcança.
   */
  async reescoparCliente(clientId: string, fonteEscrita: string, fontesLeitura: string[]): Promise<void> {
    await this.admin('/admin/api/rescope-client', {
      clientId,
      sourceId: fonteEscrita,
      federatedRead: fontesLeitura,
    });
  }

  async revogarCliente(clientId: string): Promise<void> {
    await this.admin('/admin/api/revoke-client', { clientId }).catch(() => undefined);
  }

  async fontes(): Promise<{ id: string; pages?: number }[]> {
    const r = await this.admin<{ sources?: { id: string; pages?: number }[] } | { id: string }[]>(
      '/admin/api/sources',
      undefined,
      'GET',
    );
    if (Array.isArray(r)) return r as { id: string }[];
    return r.sources ?? [];
  }

  /* -------------------------------- operações ------------------------------- */

  /** Chama uma operação do gbrain com a credencial DA PESSOA. */
  async operacao<T = unknown>(
    credencial: { clientId: string; segredo: string },
    ferramenta: string,
    argumentos: Record<string, unknown>,
  ): Promise<T> {
    const token = await this.tokenDe(credencial);
    const corpo = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: { name: ferramenta, arguments: argumentos },
    };
    const r = await this.buscar('/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // O transporte HTTP do MCP responde SSE quando o cliente aceita; sem
        // declarar os dois, o servidor recusa com 406.
        Accept: 'application/json, text/event-stream',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(corpo),
    });

    if (r.status === 401) {
      // Token revogado ou servidor reiniciado: derruba o cache e tenta uma vez.
      this.tokens.delete(credencial.clientId);
      const novo = await this.tokenDe(credencial);
      const r2 = await this.buscar('/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
          Authorization: `Bearer ${novo}`,
        },
        body: JSON.stringify(corpo),
      });
      return this.lerResposta<T>(r2);
    }
    return this.lerResposta<T>(r);
  }

  /* -------------------------------- privados -------------------------------- */

  private async tokenDe(credencial: { clientId: string; segredo: string }): Promise<string> {
    const guardado = this.tokens.get(credencial.clientId);
    if (guardado && guardado.expiraEm > Date.now()) return guardado.valor;

    const corpo = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: credencial.clientId,
      client_secret: credencial.segredo,
      scope: 'read write',
    });
    const r = await this.buscar('/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: corpo.toString(),
    });
    if (!r.ok) {
      throw new ServiceUnavailableException({
        codigo: 'BRAIN_TOKEN',
        message: 'Não foi possível autenticar na memória institucional.',
      });
    }
    const dados = (await r.json()) as { access_token: string; expires_in?: number };
    const vida = (dados.expires_in ?? 3600) * 1000;
    this.tokens.set(credencial.clientId, {
      valor: dados.access_token,
      // 60s de folga: token que vence no meio do voo vira 401 evitável.
      expiraEm: Date.now() + Math.max(30_000, vida - 60_000),
    });
    return dados.access_token;
  }

  private async admin<T>(caminho: string, corpo?: unknown, metodo: 'GET' | 'POST' = 'POST'): Promise<T> {
    if (!this.configurado) {
      throw new ServiceUnavailableException({
        codigo: 'BRAIN_SEM_TOKEN',
        message: 'A memória institucional não está configurada nesta instalação.',
      });
    }
    const enviar = async () =>
      this.buscar(caminho, {
        method: metodo,
        headers: {
          ...(corpo ? { 'Content-Type': 'application/json' } : {}),
          ...(this.sessaoAdmin ? { Cookie: `gbrain_admin=${this.sessaoAdmin}` } : {}),
        },
        body: corpo ? JSON.stringify(corpo) : undefined,
      });

    let r = await enviar();
    if (r.status === 401) {
      // A sessão do /admin vive na memória do gbrain: todo restart dele
      // invalida a nossa. Reautenticar no 401 é o caminho normal, não o de
      // exceção.
      await this.entrarComoAdmin();
      r = await enviar();
    }
    if (!r.ok) {
      const texto = await r.text().catch(() => '');
      this.logger.warn(`gbrain ${caminho} respondeu ${r.status}: ${texto.slice(0, 200)}`);
      throw new ServiceUnavailableException({
        codigo: 'BRAIN_ADMIN',
        message: 'A memória institucional recusou a operação administrativa.',
      });
    }
    return (await r.json()) as T;
  }

  private async entrarComoAdmin(): Promise<void> {
    const r = await this.buscar('/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: this.tokenAdmin }),
    });
    if (!r.ok) {
      throw new ServiceUnavailableException({
        codigo: 'BRAIN_ADMIN_LOGIN',
        message: 'Token de administração da memória institucional inválido.',
      });
    }
    const cookie = r.headers.get('set-cookie') ?? '';
    const achado = /gbrain_admin=([^;]+)/.exec(cookie);
    if (!achado) {
      throw new ServiceUnavailableException({
        codigo: 'BRAIN_ADMIN_LOGIN',
        message: 'A memória institucional não devolveu sessão de administração.',
      });
    }
    this.sessaoAdmin = achado[1];
  }

  /**
   * O transporte HTTP do MCP pode responder `text/event-stream` mesmo para
   * uma chamada única. Lemos os dois formatos e devolvemos sempre o
   * `result` do JSON-RPC.
   */
  private async lerResposta<T>(r: Response): Promise<T> {
    const texto = await r.text();
    if (!r.ok) {
      this.logger.warn(`gbrain /mcp respondeu ${r.status}: ${texto.slice(0, 200)}`);
      throw new ServiceUnavailableException({
        codigo: 'BRAIN_INDISPONIVEL',
        message: 'A memória institucional não respondeu.',
      });
    }
    const json = texto.includes('event:') ? extrairDoSse(texto) : seguroJson(texto);
    const envelope = json as { result?: unknown; error?: { message?: string } };
    if (envelope?.error) {
      throw new ServiceUnavailableException({
        codigo: 'BRAIN_ERRO',
        message: envelope.error.message ?? 'A memória institucional recusou a consulta.',
      });
    }
    return envelope?.result as T;
  }

  private buscar(caminho: string, init: RequestInit): Promise<Response> {
    // Timeout explícito: o `think` sintetiza com LLM e pode demorar; sem teto
    // uma requisição pendurada seguraria uma conexão da API para sempre.
    const controlador = new AbortController();
    const relogio = setTimeout(() => controlador.abort(), 120_000);
    return fetch(`${this.base}${caminho}`, { ...init, signal: controlador.signal }).finally(() =>
      clearTimeout(relogio),
    );
  }
}

function seguroJson(texto: string): unknown {
  try {
    return JSON.parse(texto);
  } catch {
    return null;
  }
}

/** Pega o último `data:` de um corpo SSE — é onde vem o resultado final. */
function extrairDoSse(texto: string): unknown {
  const dados = [...texto.matchAll(/^data:\s*(.+)$/gm)].map((m) => m[1]);
  for (let i = dados.length - 1; i >= 0; i--) {
    const json = seguroJson(dados[i]);
    if (json && typeof json === 'object') return json;
  }
  return null;
}
