import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { cifrar, decifrar } from '../agentes/agentes.service';

/**
 * Integração Instagram via sidecar aiograpi-rest (API PRIVADA do Instagram).
 *
 * Portado do projeto `team` (alook/shared/integrations/instagram.ts) para a
 * stack do FebraHub: NestJS + Prisma + a cifra AES-256-GCM dos agentes, em vez
 * do D1/workspace_config do original.
 *
 * A diretoria conecta a conta (usuário/senha + 2FA/desafio, ou importando um
 * SESSIONID pronto); o app faz login no sidecar, guarda o estado inteiro
 * cifrado em `instagram_config` e passa X-Session-ID em cada chamada. O resto
 * do sistema só toca no proxy `igApiRequest` — a sessão/senha nunca saem daqui.
 *
 * ATENÇÃO: aiograpi usa a API privada do Instagram — viola os ToS e a conta
 * conectada pode ser bloqueada/desafiada. Risco assumido pela diretoria.
 */

export interface InstagramConfig {
  username: string;
  /** cifrada junto do resto; usada p/ relogin best-effort quando a sessão morre. */
  password?: string;
  /** SESSIONID (settings serializado) devolvido pelo /auth/login. */
  sessionId?: string;
  userPk?: string;
  status?: 'connected' | 'needs_challenge' | 'disconnected';
  /** contexto do desafio (last_json) p/ resolver com o código. */
  pendingChallenge?: unknown;
}

export interface InstagramLoginInput {
  username: string;
  password: string;
  /** código 2FA/TOTP; reenviado no /auth/login (a forma correta p/ TwoFactorRequired). */
  verificationCode?: string;
}

export interface InstagramLoginResult {
  ok: boolean;
  status: 'connected' | 'needs_challenge' | 'error';
  error?: string;
}

export interface IgProxyRequest {
  method?: string;
  /** caminho no sidecar aiograpi-rest, começando com "/". */
  path: string;
  query?: Record<string, string>;
  /** corpo (POST/PATCH/PUT). aiograpi-rest usa form-urlencoded. */
  body?: Record<string, unknown>;
}

export interface IgProxyResult {
  ok: boolean;
  status?: number;
  body?: string;
  error?: string;
}

const IG_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

function form(obj: Record<string, string | undefined>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) if (v != null && v !== '') p.set(k, v);
  return p.toString();
}

/**
 * Sessão do aiograpi-rest: o /auth/login devolve `cl.sessionid` como STRING JSON
 * crua no sucesso (ex.: "1234:abcdef..."). Também toleramos objeto {sessionid}.
 */
function extractSession(data: unknown): string | undefined {
  if (typeof data === 'string' && data.length > 8) return data;
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    for (const k of ['sessionid', 'session_id', 'sessionId']) {
      if (typeof d[k] === 'string' && (d[k] as string).length > 0) return d[k] as string;
    }
  }
  return undefined;
}

@Injectable()
export class InstagramService {
  private readonly log = new Logger(InstagramService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /** URL interna do sidecar aiograpi-rest. Sem barra final. Null = indisponível. */
  private aiograpiBase(): string | null {
    const raw = this.config.get<string>('ALOOK_AIOGRAPI_URL') || '';
    return raw ? raw.replace(/\/+$/, '') : null;
  }

  // ── persistência (linha única, cifrada) ───────────────────────────────────

  private async carregar(): Promise<InstagramConfig | null> {
    const linha = await this.prisma.instagramConfig.findUnique({ where: { id: 'instagram' } });
    if (!linha?.dados) return null;
    try {
      return JSON.parse(decifrar(this.config, linha.dados)) as InstagramConfig;
    } catch {
      return null;
    }
  }

  private async gravar(cfg: InstagramConfig, autorId?: string): Promise<void> {
    const dados = cifrar(this.config, JSON.stringify(cfg));
    await this.prisma.instagramConfig.upsert({
      where: { id: 'instagram' },
      create: { id: 'instagram', dados, atualizadoPor: autorId ?? null },
      update: { dados, ...(autorId ? { atualizadoPor: autorId } : {}) },
    });
  }

  private async apagar(): Promise<void> {
    await this.prisma.instagramConfig
      .update({ where: { id: 'instagram' }, data: { dados: null } })
      .catch(() => undefined);
  }

  // ── estado p/ a tela (nunca devolve senha/sessão) ─────────────────────────

  async status() {
    const cfg = await this.carregar();
    return {
      disponivel: !!this.aiograpiBase(),
      configurado: !!cfg?.username,
      conectado: cfg?.status === 'connected' && !!cfg?.sessionId,
      precisaDesafio: cfg?.status === 'needs_challenge',
      usuario: cfg?.username ?? null,
    };
  }

  // ── login por usuário/senha ───────────────────────────────────────────────

  /**
   * Contrato real do aiograpi-rest (routers/auth.py + handler em main.py):
   *   200 → corpo é a STRING sessionid (sucesso) ou `false` (falhou).
   *   401 exc_type=TwoFactorRequired → precisa do código 2FA.
   *   403 exc_type=ChallengeRequired → checkpoint (código por SMS/e-mail).
   *   429 → rate limit. 401 UnknownError → usuário inválido.
   */
  async login(input: InstagramLoginInput, autorId?: string): Promise<InstagramLoginResult> {
    const base = this.aiograpiBase();
    if (!base) return { ok: false, status: 'error', error: 'Integração Instagram indisponível neste host (ALOOK_AIOGRAPI_URL).' };
    try {
      const res = await fetch(`${base}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form({
          username: input.username,
          password: input.password,
          verification_code: input.verificationCode,
        }),
      });
      const data: unknown = await res.json().catch(() => null);

      if (res.ok) {
        const sessionId = extractSession(data);
        if (sessionId) {
          await this.gravar(
            { username: input.username, password: input.password, sessionId, status: 'connected' },
            autorId,
          );
          return { ok: true, status: 'connected' };
        }
        return { ok: false, status: 'error', error: 'Login recusado — verifique usuário e senha.' };
      }

      const d = (data ?? {}) as Record<string, unknown>;
      const excType = typeof d.exc_type === 'string' ? d.exc_type : '';
      const hint = typeof d.hint === 'string' ? d.hint : '';
      const detail = (typeof d.detail === 'string' ? d.detail : JSON.stringify(data ?? {})).slice(0, 400);

      if (res.status === 401 && /TwoFactor/i.test(excType)) {
        await this.gravar(
          { username: input.username, password: input.password, status: 'needs_challenge' },
          autorId,
        );
        return { ok: false, status: 'needs_challenge', error: hint || detail };
      }
      if (res.status === 403 && /Challenge/i.test(excType)) {
        await this.gravar(
          { username: input.username, password: input.password, status: 'needs_challenge', pendingChallenge: data },
          autorId,
        );
        return { ok: false, status: 'needs_challenge', error: hint || detail };
      }
      if (res.status === 429) {
        return { ok: false, status: 'error', error: hint || 'Instagram limitou este acesso (rate limit) — tente mais tarde.' };
      }
      return { ok: false, status: 'error', error: detail || `login falhou (${res.status})` };
    } catch (e) {
      return { ok: false, status: 'error', error: e instanceof Error ? e.message : String(e) };
    }
  }

  /**
   * Continua um login que caiu em desafio. Com `code` (SMS/e-mail/TOTP) reenvia
   * /auth/login com o verification_code. SEM `code` faz um re-login simples — é
   * o caminho do desafio "aprovar no aparelho" (delta_login_review): depois que
   * a pessoa toca em "Fui eu" no app, um novo login costuma passar.
   */
  async resolverDesafio(code?: string, autorId?: string): Promise<InstagramLoginResult> {
    const cfg = await this.carregar();
    if (!cfg?.username || !cfg?.password) {
      return { ok: false, status: 'error', error: 'Reconecte a conta (usuário/senha não disponíveis).' };
    }
    return this.login(
      { username: cfg.username, password: cfg.password, verificationCode: code?.trim() || undefined },
      autorId,
    );
  }

  /**
   * Importa uma sessão pronta (cookie `sessionid` do navegador) via
   * /auth/login/by/sessionid. É o caminho MAIS confiável para contas que batem
   * em desafio no login por senha — pula o checkpoint por completo.
   */
  async loginPorSessionId(
    input: { username?: string; sessionid: string },
    autorId?: string,
  ): Promise<InstagramLoginResult> {
    const base = this.aiograpiBase();
    if (!base) return { ok: false, status: 'error', error: 'Integração Instagram indisponível neste host (ALOOK_AIOGRAPI_URL).' };
    try {
      const res = await fetch(`${base}/auth/login/by/sessionid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form({ sessionid: input.sessionid }),
      });
      const data: unknown = await res.json().catch(() => null);
      if (res.ok) {
        const sessionId = extractSession(data);
        if (sessionId) {
          await this.gravar(
            { username: (input.username || '').trim(), sessionId, status: 'connected' },
            autorId,
          );
          return { ok: true, status: 'connected' };
        }
      }
      const d = (data ?? {}) as Record<string, unknown>;
      const detail = (typeof d.detail === 'string' ? d.detail : JSON.stringify(data ?? {})).slice(0, 400);
      return { ok: false, status: 'error', error: detail || `sessão inválida (${res.status})` };
    } catch (e) {
      return { ok: false, status: 'error', error: e instanceof Error ? e.message : String(e) };
    }
  }

  async desconectar(): Promise<void> {
    await this.apagar();
  }

  // ── proxy autenticado ao sidecar (usado por telas/agentes) ────────────────

  /**
   * Chamada autenticada ao sidecar aiograpi-rest em nome da conta conectada.
   * GET/DELETE levam params na query; POST/PATCH/PUT em form-urlencoded. A
   * sessão vai no header X-Session-ID. Em 401 tenta um relogin best-effort com
   * a senha guardada.
   */
  async igApiRequest(req: IgProxyRequest): Promise<IgProxyResult> {
    const base = this.aiograpiBase();
    if (!base) return { ok: false, error: 'Integração Instagram indisponível neste host (ALOOK_AIOGRAPI_URL).' };
    let cfg = await this.carregar();
    if (!cfg?.sessionId) {
      return { ok: false, error: 'Instagram não conectado — conecte a conta em Marketing → Configurar conexão.' };
    }
    const method = (req.method || 'GET').toUpperCase();
    if (!IG_METHODS.has(method)) return { ok: false, error: `método não permitido: ${method}` };
    if (!req.path.startsWith('/') || req.path.includes('..') || req.path.startsWith('//')) {
      return { ok: false, error: 'path inválido (use um caminho do aiograpi-rest começando com /)' };
    }

    const doFetch = async (sessionId: string): Promise<Response> => {
      const url = new URL(base + req.path);
      for (const [k, v] of Object.entries(req.query ?? {})) url.searchParams.set(k, v);
      const headers: Record<string, string> = { 'X-Session-ID': sessionId, Accept: 'application/json' };
      let body: BodyInit | undefined;
      if (method !== 'GET' && method !== 'DELETE' && req.body && Object.keys(req.body).length > 0) {
        const p = new URLSearchParams();
        for (const [k, v] of Object.entries(req.body)) {
          p.set(k, typeof v === 'string' ? v : JSON.stringify(v));
        }
        body = p.toString();
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
      }
      return fetch(url, { method, headers, body });
    };

    try {
      let res = await doFetch(cfg.sessionId);

      // 401: sessão morta — relogin best-effort com a senha guardada e repete uma vez.
      if (res.status === 401 && cfg.password) {
        const relog = await this.login({ username: cfg.username, password: cfg.password });
        if (relog.ok && relog.status === 'connected') {
          cfg = await this.carregar();
          if (cfg?.sessionId) res = await doFetch(cfg.sessionId);
        }
      }

      const text = await res.text();
      if (res.status === 401) {
        return { ok: false, status: 401, body: text.slice(0, 2_000), error: 'Sessão do Instagram expirou — reconecte a conta em Marketing → Configurar conexão.' };
      }
      if (res.status === 429) {
        return { ok: false, status: 429, body: text.slice(0, 2_000), error: 'Rate limit do Instagram — espace as chamadas e tente de novo em alguns minutos.' };
      }
      return { ok: res.ok, status: res.status, body: text.slice(0, 200_000) };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  }
}
