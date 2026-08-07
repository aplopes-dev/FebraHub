import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../../database/prisma.service';
import { Configuracao } from '../../config/configuracao';
import { DefinicaoProvedor, FONTES, Fonte, PROVEDORES } from './provedores';

/**
 * Autorização OAuth das fontes externas, feita pelo próprio sistema.
 *
 * O QUE ISTO SUBSTITUI: até aqui, reconectar o Conta Azul era "autorize no
 * navegador pelo Postman, copie o refresh token e rode --semear-token na VPS",
 * e renovar o Meta era gerar um token novo à mão a cada 60 dias. Ou seja: duas
 * dependências recorrentes de uma pessoa com ferramenta externa. Aqui o fluxo
 * inteiro (authorize → callback → token → banco) roda dentro da aplicação, e a
 * renovação vira rotina diária (ver renovacao.cron.ts).
 *
 * REGRA QUE ATRAVESSA O ARQUIVO: token não sai daqui. Nenhum método público
 * devolve access_token/refresh_token, e nenhum log imprime o valor — nem
 * truncado. O que sai é booleano, data e mensagem do provedor.
 */

/** Validade do `state`. Curta de propósito: ele só precisa sobreviver ao tempo
 *  de a pessoa clicar "autorizar" na tela do provedor. */
const ESTADO_VALIDADE_MS = 15 * 60 * 1000;

/** Janela da renovação proativa. Renovar ANTES de expirar é o ponto todo:
 *  depois de vencido, o Meta não troca mais o token e o Conta Azul devolve
 *  invalid_grant — os dois viram trabalho manual de novo. */
export const JANELA_RENOVACAO_MS = 7 * 24 * 60 * 60 * 1000;

const TIMEOUT_PROVEDOR_MS = 30_000;

/** Fonte usada em `integracao_status` para o resumo da rotina de renovação. */
const FONTE_STATUS_RENOVACAO = 'oauth_renovacao';

export type Situacao = 'conectada' | 'expira_em_breve' | 'expirada' | 'nunca_conectada';

export interface ResultadoRenovacao {
  fonte: Fonte;
  ok: boolean;
  mensagem: string;
}

export interface EstadoIntegracao {
  fonte: Fonte;
  nome: string;
  situacao: Situacao;
  /** Só isto: nunca o valor. */
  tem_token: boolean;
  expira_em: string | null;
  nota_validade: string;
  atualizado_em: string | null;
  ultima_sync: string | null;
  status_sync: string | null;
  /** Precisa estar cadastrado no painel do provedor, idêntico a esta string. */
  redirect_uri: string;
  configurada: boolean;
  /** Variáveis de ambiente que faltam na API (vazio quando `configurada`). */
  faltando: string[];
  /** Resultado da última renovação automática desta fonte, se já houve. */
  ultima_renovacao: { em: string | null; ok: boolean; mensagem: string | null } | null;
}

interface LinhaToken {
  integracao: string;
  access_token: string | null;
  refresh_token: string | null;
  expira_em: Date | null;
  atualizado_em: Date | null;
}

interface LinhaStatus {
  fonte: string;
  ultima_sync: Date | null;
  status: string | null;
  mensagem: string | null;
}

@Injectable()
export class IntegracoesService {
  private readonly logger = new Logger(IntegracoesService.name);
  private readonly cfg: Configuracao;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.cfg = config.get<Configuracao>('app')!;
  }

  // ==========================================================
  // Leitura de estado
  // ==========================================================

  /**
   * Uma linha por fonte, juntando token (existe? vence quando?) e
   * `integracao_status` (quando sincronizou pela última vez).
   */
  async listar(): Promise<EstadoIntegracao[]> {
    // A consulta não seleciona os tokens: devolve booleano direto do banco.
    // Assim o valor nem chega ao processo, e não há como escorregar para um log.
    const tokens = await this.prisma.$queryRaw<
      {
        integracao: string;
        tem_access: boolean;
        tem_refresh: boolean;
        expira_em: Date | null;
        atualizado_em: Date | null;
      }[]
    >`
      SELECT integracao,
             coalesce(access_token, '') <> ''  AS tem_access,
             coalesce(refresh_token, '') <> '' AS tem_refresh,
             expira_em,
             atualizado_em
        FROM public.integracao_tokens
    `;
    const status = await this.prisma.$queryRaw<LinhaStatus[]>`
      SELECT fonte, ultima_sync, status, mensagem
        FROM public.integracao_status
    `;

    const porToken = new Map(tokens.map((t) => [t.integracao, t]));
    const porStatus = new Map(status.map((s) => [s.fonte, s]));

    return FONTES.map((fonte) => {
      const p = PROVEDORES[fonte];
      const t = porToken.get(p.chaveToken);
      const faltando = this.configuracaoFaltante(fonte);

      // Vale a fonte de status com a sincronização mais recente (o Meta é
      // registrado com dois nomes diferentes, ver provedores.ts).
      const sync = p.fontesStatus
        .map((f) => porStatus.get(f))
        .filter((s): s is LinhaStatus => !!s)
        .sort((a, b) => (b.ultima_sync?.getTime() ?? 0) - (a.ultima_sync?.getTime() ?? 0))[0];

      const renov = porStatus.get(`${FONTE_STATUS_RENOVACAO}_${fonte}`);

      const temToken =
        p.validadeRelevante === 'refresh' ? !!t?.tem_refresh : !!t?.tem_access;
      const renovacaoFalhou = !!renov && renov.status !== 'ok';

      return {
        fonte,
        nome: p.nome,
        situacao: situacaoDe(p, temToken, t?.expira_em ?? null, renovacaoFalhou),
        tem_token: temToken,
        expira_em: t?.expira_em?.toISOString() ?? null,
        nota_validade: p.notaValidade,
        atualizado_em: t?.atualizado_em?.toISOString() ?? null,
        ultima_sync: sync?.ultima_sync?.toISOString() ?? null,
        status_sync: sync?.status ?? null,
        redirect_uri: this.redirectUri(fonte),
        configurada: faltando.length === 0,
        faltando,
        ultima_renovacao: renov
          ? {
              em: renov.ultima_sync?.toISOString() ?? null,
              ok: renov.status === 'ok',
              mensagem: renov.mensagem,
            }
          : null,
      };
    });
  }

  // ==========================================================
  // Autorização (com navegador, uma vez por integração)
  // ==========================================================

  /**
   * Monta a URL de autorização do provedor.
   *
   * Devolve a URL em vez de redirecionar: quem chama é o fetch do painel, e um
   * 302 aqui viraria uma requisição XHR seguindo para o domínio do provedor —
   * bloqueada por CORS e sem janela onde a pessoa possa fazer login. O front
   * abre esta URL numa aba nova.
   */
  async urlAutorizacao(fonte: Fonte): Promise<{ url: string; redirect_uri: string }> {
    const { id, redirectUri } = this.exigirConfiguracao(fonte);
    const p = PROVEDORES[fonte];

    // `state` aleatório, guardado no banco e conferido no callback. Sem ele o
    // callback (que é público) aceitaria um `code` de qualquer origem, e um
    // atacante poderia amarrar a CONTA DELE à nossa integração — o dado do
    // painel passaria a vir da fonte errada. É o CSRF do fluxo OAuth.
    const state = randomBytes(32).toString('base64url');
    await this.prisma.$executeRaw`
      INSERT INTO public.integracao_estado_oauth (state, fonte, criado_em)
      VALUES (${state}, ${fonte}, now())
    `;
    await this.limparEstadosVencidos();

    const q = montarQuery({
      response_type: 'code',
      client_id: id,
      redirect_uri: redirectUri,
      scope: this.escopoDe(fonte),
      state,
    });
    return { url: `${p.urlAutorizacao}?${q}`, redirect_uri: redirectUri };
  }

  /**
   * Fecha o fluxo: confere o `state`, troca o `code` por token e grava.
   *
   * Devolve texto para uma PESSOA (o callback responde HTML), então as
   * mensagens de erro aqui são de leitura humana, não códigos.
   */
  async concluirAutorizacao(fonte: Fonte, code: string, state: string): Promise<void> {
    const { id, segredo, redirectUri } = this.exigirConfiguracao(fonte);
    const p = PROVEDORES[fonte];

    // DELETE ... RETURNING: consome o state no mesmo comando que o valida.
    // Se fosse SELECT e depois DELETE, dois callbacks simultâneos com o mesmo
    // state passariam os dois — uso único só vale se for atômico.
    const usados = await this.prisma.$queryRaw<{ fonte: string; criado_em: Date }[]>`
      DELETE FROM public.integracao_estado_oauth
       WHERE state = ${state}
      RETURNING fonte, criado_em
    `;
    const usado = usados[0];
    if (!usado) {
      throw new BadRequestException({
        codigo: 'ESTADO_INVALIDO',
        message:
          'Este link de autorização não é válido (ou já foi usado). ' +
          'Volte ao painel de Integrações e clique em Conectar de novo.',
      });
    }
    if (usado.fonte !== fonte) {
      throw new BadRequestException({
        codigo: 'ESTADO_DE_OUTRA_FONTE',
        message: 'A autorização veio de outra integração. Recomece pelo painel.',
      });
    }
    if (Date.now() - usado.criado_em.getTime() > ESTADO_VALIDADE_MS) {
      throw new BadRequestException({
        codigo: 'ESTADO_EXPIRADO',
        message: 'A autorização demorou demais e expirou. Comece de novo pelo painel.',
      });
    }

    if (fonte === 'contaazul') {
      const d = await this.pedirJson(
        p.urlToken,
        {
          method: 'POST',
          headers: {
            // Cognito aceita a credencial do cliente por Basic; é o mesmo
            // formato que o ETL já usa no refresh.
            Authorization: `Basic ${Buffer.from(`${id}:${segredo}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            // Tem que ser IDÊNTICO ao usado no authorize: o provedor compara
            // as duas strings e recusa com invalid_grant se diferirem em uma
            // barra final.
            redirect_uri: redirectUri,
          }).toString(),
        },
        'troca do código por token no Conta Azul',
      );
      await this.gravarToken(p, d);
      return;
    }

    // Meta: o /oauth/access_token com `code` devolve um token de CURTA duração
    // (~1h). Guardar esse seria garantir uma reconexão manual amanhã — por isso
    // ele é trocado na hora por um de longa duração (~60 dias), que é o que a
    // renovação diária consegue manter vivo.
    const curto = await this.pedirJson(
      `${p.urlToken}?${montarQuery({
        client_id: id,
        client_secret: segredo,
        redirect_uri: redirectUri,
        code,
      })}`,
      { method: 'GET', headers: { Accept: 'application/json' } },
      'troca do código por token no Meta',
    );
    const longo = await this.trocarPorLongaDuracao(id, segredo, texto(curto.access_token));
    await this.gravarToken(p, longo);
  }

  // ==========================================================
  // Renovação (sem navegador)
  // ==========================================================

  /** Força a renovação de uma fonte agora, independente de quando ela vence. */
  async renovar(fonte: Fonte): Promise<{ fonte: Fonte; expira_em: string | null }> {
    const { id, segredo } = this.exigirConfiguracao(fonte);
    const p = PROVEDORES[fonte];
    const atual = await this.lerToken(p.chaveToken);

    if (p.modoRenovacao === 'refresh_token') {
      if (!atual?.refresh_token) {
        throw new NotFoundException({
          codigo: 'SEM_REFRESH_TOKEN',
          message: `${p.nome} não tem refresh token guardado. Use Conectar para autorizar no navegador.`,
        });
      }
      const d = await this.pedirJson(
        p.urlToken,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${Buffer.from(`${id}:${segredo}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: atual.refresh_token,
          }).toString(),
        },
        `renovação do ${p.nome}`,
      );
      // O Conta Azul v2 ROTACIONA o refresh token: o antigo morre nesta
      // chamada. Não gravar o novo quebraria a próxima renovação — foi
      // exatamente assim que a integração parou antes.
      const expira = await this.gravarToken(p, d);
      return { fonte, expira_em: expira?.toISOString() ?? null };
    }

    // Meta: troca o token atual por outro de 60 dias. Só funciona enquanto o
    // atual ainda vale.
    if (!atual?.access_token) {
      throw new NotFoundException({
        codigo: 'SEM_TOKEN',
        message: `${p.nome} não tem token guardado. Use Conectar para autorizar no navegador.`,
      });
    }
    const d = await this.trocarPorLongaDuracao(id, segredo, atual.access_token);
    const expira = await this.gravarToken(p, d);
    return { fonte, expira_em: expira?.toISOString() ?? null };
  }

  /**
   * Renova tudo que vence dentro da janela. É o que tira a ação recorrente da
   * mão de alguém: enquanto rodar, o token nunca chega a expirar.
   *
   * Uma fonte que falha não impede as outras — e a falha fica registrada em
   * `integracao_status`, que é o que a tela lê.
   */
  async renovarVencendo(): Promise<ResultadoRenovacao[]> {
    const limite = new Date(Date.now() + JANELA_RENOVACAO_MS);
    const resultados: ResultadoRenovacao[] = [];

    for (const fonte of FONTES) {
      const p = PROVEDORES[fonte];
      if (this.configuracaoFaltante(fonte).length) continue; // sem credencial: nada a fazer
      const atual = await this.lerToken(p.chaveToken);
      const temAlgo =
        p.modoRenovacao === 'refresh_token' ? !!atual?.refresh_token : !!atual?.access_token;
      if (!temAlgo) continue; // nunca conectada: precisa de navegador, não de cron

      // Sem data conhecida, renova — melhor uma renovação a mais do que
      // descobrir o vencimento pelo painel quebrado.
      //
      // No Conta Azul isto dá renovação TODO DIA, porque a data guardada é a
      // do access token de 1h. É o comportamento desejado: o refresh token
      // dele caduca por falta de uso, então exercitá-lo diariamente é o que o
      // mantém vivo entre uma carga e outra.
      const vence = !atual?.expira_em || atual.expira_em <= limite;
      if (!vence) continue;

      try {
        const r = await this.renovar(fonte);
        resultados.push({
          fonte,
          ok: true,
          mensagem: r.expira_em ? `renovado até ${r.expira_em}` : 'renovado',
        });
        this.logger.log(`${p.nome}: token renovado (vence em ${r.expira_em ?? 'sem data'})`);
      } catch (e) {
        const msg = mensagemDe(e);
        resultados.push({ fonte, ok: false, mensagem: msg });
        // Sem o valor do token na mensagem: o que se registra é o motivo.
        this.logger.error(`${p.nome}: renovação automática falhou — ${msg}`);
      }
    }

    await this.registrarResultado(resultados);
    return resultados;
  }

  // ==========================================================
  // Desconexão
  // ==========================================================

  /** Apaga o token. Serve para forçar uma reautorização limpa quando o
   *  provedor invalidou a credencial do lado dele. */
  async desconectar(fonte: Fonte): Promise<{ fonte: Fonte; desconectada: boolean }> {
    const p = PROVEDORES[fonte];
    const n = await this.prisma.$executeRaw`
      DELETE FROM public.integracao_tokens WHERE integracao = ${p.chaveToken}
    `;
    this.logger.warn(`${p.nome}: token removido do banco (desconectado pelo painel)`);
    return { fonte, desconectada: n > 0 };
  }

  // ==========================================================
  // Configuração
  // ==========================================================

  /** `${APP_URL}/api/integracoes/<fonte>/callback` — a mesma string tem que
   *  estar cadastrada no painel do provedor, senão ele recusa antes de tudo. */
  redirectUri(fonte: Fonte): string {
    const base = (this.cfg.appUrl ?? '').replace(/\/+$/, '');
    return `${base}/api/integracoes/${fonte}/callback`;
  }

  /** Variáveis que faltam para esta fonte funcionar. Vazio = configurada. */
  configuracaoFaltante(fonte: Fonte): string[] {
    const p = PROVEDORES[fonte];
    const { id, segredo } = this.credenciaisDe(fonte);
    const faltando: string[] = [];
    if (!id) faltando.push(p.envs.id);
    if (!segredo) faltando.push(p.envs.segredo);
    // Sem APP_URL não há redirect_uri absoluto para mandar ao provedor.
    if (!this.cfg.appUrl) faltando.push('APP_URL');
    return faltando;
  }

  private credenciaisDe(fonte: Fonte): { id?: string; segredo?: string } {
    const o = this.cfg.oauth;
    return fonte === 'contaazul'
      ? { id: o.contaAzul.clientId, segredo: o.contaAzul.clientSecret }
      : { id: o.meta.appId, segredo: o.meta.appSecret };
  }

  private escopoDe(fonte: Fonte): string {
    return fonte === 'contaazul' ? this.cfg.oauth.contaAzul.escopo : PROVEDORES[fonte].escopo;
  }

  /** Credencial faltando é erro de configuração, não falha de servidor: 400 com
   *  o nome da variável, nunca um 500 genérico. */
  private exigirConfiguracao(fonte: Fonte): { id: string; segredo: string; redirectUri: string } {
    const faltando = this.configuracaoFaltante(fonte);
    if (faltando.length) {
      throw new BadRequestException({
        codigo: 'INTEGRACAO_NAO_CONFIGURADA',
        message:
          `${PROVEDORES[fonte].nome}: faltam variáveis de ambiente na API — ` +
          `${faltando.join(', ')}. Elas ficam em ${'{FEBRAHUB_DIR}'}/etl.env, ` +
          'que precisa estar no env_file do serviço `api` (docker-compose.prod.yml).',
      });
    }
    const { id, segredo } = this.credenciaisDe(fonte);
    return { id: id!, segredo: segredo!, redirectUri: this.redirectUri(fonte) };
  }

  // ==========================================================
  // Provedor e banco
  // ==========================================================

  /** Meta: `grant_type=fb_exchange_token`. É o que elimina a ação recorrente —
   *  desde que rode enquanto o token de entrada ainda vale. */
  private async trocarPorLongaDuracao(
    id: string,
    segredo: string,
    tokenAtual: string,
  ): Promise<Record<string, unknown>> {
    const p = PROVEDORES.meta;
    return this.pedirJson(
      `${p.urlToken}?${montarQuery({
        grant_type: 'fb_exchange_token',
        client_id: id,
        client_secret: segredo,
        fb_exchange_token: tokenAtual,
      })}`,
      { method: 'GET', headers: { Accept: 'application/json' } },
      'troca por token de longa duração no Meta',
    );
  }

  /** Leitura interna — o valor do token só circula dentro do serviço. */
  private async lerToken(chave: string): Promise<LinhaToken | null> {
    const linhas = await this.prisma.$queryRaw<LinhaToken[]>`
      SELECT integracao, access_token, refresh_token, expira_em, atualizado_em
        FROM public.integracao_tokens
       WHERE integracao = ${chave}
    `;
    return linhas[0] ?? null;
  }

  /** Grava a resposta do provedor. Devolve o novo vencimento, para log e
   *  resposta — nunca o token. */
  private async gravarToken(
    p: DefinicaoProvedor,
    resposta: Record<string, unknown>,
  ): Promise<Date | null> {
    const access = texto(resposta.access_token);
    if (!access) {
      throw new ServiceUnavailableException({
        codigo: 'RESPOSTA_SEM_TOKEN',
        message: `${p.nome} respondeu sem access_token.`,
      });
    }
    const refresh = texto(resposta.refresh_token) || null;
    const segundos = Number(resposta.expires_in);
    // Sem expires_in (acontece com token de usuário de sistema do Meta) a
    // validade fica nula: é honesto, e a renovação proativa trata "sem data"
    // como "renova assim mesmo".
    const expiraEm =
      Number.isFinite(segundos) && segundos > 0 ? new Date(Date.now() + segundos * 1000) : null;
    const agora = new Date();

    await this.prisma.$executeRaw`
      INSERT INTO public.integracao_tokens
             (integracao, access_token, refresh_token, expira_em, atualizado_em)
      VALUES (${p.chaveToken}, ${access}, ${refresh}::text, ${expiraEm}::timestamptz, ${agora})
      ON CONFLICT (integracao) DO UPDATE SET
        access_token = EXCLUDED.access_token,
        -- COALESCE: uma resposta que não traz refresh (o Meta nunca traz) não
        -- pode apagar o que já estava guardado.
        refresh_token = COALESCE(EXCLUDED.refresh_token, public.integracao_tokens.refresh_token),
        expira_em = EXCLUDED.expira_em,
        atualizado_em = EXCLUDED.atualizado_em
    `;
    return expiraEm;
  }

  /** Estado vencido não serve para nada e a tabela só cresceria. */
  private async limparEstadosVencidos(): Promise<void> {
    await this.prisma.$executeRaw`
      DELETE FROM public.integracao_estado_oauth
       WHERE criado_em < now() - interval '1 hour'
    `;
  }

  /**
   * Registra o resultado da rotina em `integracao_status`: uma linha de resumo
   * (`oauth_renovacao`) e uma por fonte (`oauth_renovacao_<fonte>`), que é o
   * que a tela usa para dizer "a última renovação do Conta Azul falhou".
   */
  private async registrarResultado(resultados: ResultadoRenovacao[]): Promise<void> {
    const agora = new Date();
    const falhas = resultados.filter((r) => !r.ok);
    const resumo = resultados.length
      ? resultados.map((r) => `${r.fonte}: ${r.ok ? 'ok' : r.mensagem}`).join(' · ')
      : 'nenhuma fonte precisava renovar';
    const status = !resultados.length ? 'ok' : falhas.length === resultados.length ? 'erro' : falhas.length ? 'parcial' : 'ok';

    await this.gravarStatus(FONTE_STATUS_RENOVACAO, 'Renovação OAuth', status, resumo, agora);
    for (const r of resultados) {
      await this.gravarStatus(
        `${FONTE_STATUS_RENOVACAO}_${r.fonte}`,
        `Renovação OAuth — ${PROVEDORES[r.fonte].nome}`,
        r.ok ? 'ok' : 'erro',
        r.mensagem,
        agora,
      );
    }
  }

  private async gravarStatus(
    fonte: string,
    nome: string,
    status: string,
    mensagem: string,
    quando: Date,
  ): Promise<void> {
    await this.prisma.$executeRaw`
      INSERT INTO public.integracao_status
             (fonte, nome_exibicao, ultima_sync, status, mensagem, atualizado_em)
      VALUES (${fonte}, ${nome}, ${quando}, ${status}, ${mensagem}, ${quando})
      ON CONFLICT (fonte) DO UPDATE SET
        nome_exibicao = EXCLUDED.nome_exibicao,
        ultima_sync = EXCLUDED.ultima_sync,
        status = EXCLUDED.status,
        mensagem = EXCLUDED.mensagem,
        atualizado_em = EXCLUDED.atualizado_em
    `;
  }

  /**
   * Chamada ao provedor com timeout e erro traduzido.
   *
   * O corpo bruto NÃO vai para a mensagem: extraímos os campos conhecidos de
   * erro. Resposta de provedor pode ecoar o que foi enviado, e o que foi
   * enviado inclui credencial.
   */
  private async pedirJson(
    url: string,
    init: RequestInit,
    contexto: string,
  ): Promise<Record<string, unknown>> {
    const controlador = new AbortController();
    const relogio = setTimeout(() => controlador.abort(), TIMEOUT_PROVEDOR_MS);
    let resposta: Response;
    try {
      resposta = await fetch(url, { ...init, signal: controlador.signal });
    } catch {
      throw new ServiceUnavailableException({
        codigo: 'PROVEDOR_INDISPONIVEL',
        message: `Não foi possível falar com o provedor (${contexto}).`,
      });
    } finally {
      clearTimeout(relogio);
    }

    const cru = await resposta.text();
    let corpo: unknown = null;
    try {
      corpo = cru ? JSON.parse(cru) : null;
    } catch {
      /* provedor devolveu algo que não é JSON — cai no erro genérico abaixo */
    }

    if (!resposta.ok) {
      throw new BadRequestException({
        codigo: 'PROVEDOR_RECUSOU',
        message: `${contexto}: ${erroDoProvedor(corpo, resposta.status)}`,
      });
    }
    if (!corpo || typeof corpo !== 'object') {
      throw new ServiceUnavailableException({
        codigo: 'RESPOSTA_INVALIDA',
        message: `${contexto}: resposta do provedor em formato inesperado.`,
      });
    }
    return corpo as Record<string, unknown>;
  }
}

/* ---------------- auxiliares ---------------- */

const texto = (v: unknown): string => (typeof v === 'string' ? v : '');

/**
 * Query string com percent-encoding (RFC 3986), não com `+` no lugar do espaço.
 *
 * `URLSearchParams` serializa como formulário (`application/x-www-form-
 * urlencoded`), onde espaço vira `+`. Isso está certo no CORPO de um POST —
 * e é o que usamos lá —, mas na URL de autorização o `scope` do Conta Azul
 * tem espaços, e servidor OAuth que não trata o corpo como formulário lê o
 * `+` literalmente e devolve invalid_scope.
 */
const montarQuery = (p: Record<string, string>): string =>
  Object.entries(p)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

function situacaoDe(
  p: DefinicaoProvedor,
  temToken: boolean,
  expiraEm: Date | null,
  renovacaoFalhou: boolean,
): Situacao {
  if (!temToken) return 'nunca_conectada';
  // Conta Azul: a data guardada é do access token de 1h, e estar vencida é o
  // estado normal entre uma carga e outra — usá-la como semáforo pintaria de
  // vermelho uma integração saudável. O que vale ali é ter refresh token.
  //
  // Sem data confiável, o semáforo passa a ser o resultado da última
  // renovação automática: um refresh que o provedor recusou (invalid_grant,
  // invalid_client) é credencial morta, e mostrar "conectada" nesse caso é
  // como a integração ficou dias quebrada sem ninguém notar.
  if (p.validadeRelevante === 'refresh') return renovacaoFalhou ? 'expirada' : 'conectada';
  // Meta: a data é confiável, então ela manda. Uma renovação que falhou com o
  // token ainda válido não é emergência — sobram tentativas diárias até o
  // vencimento, e a linha de "renovação automática" na tela já mostra a falha.
  if (!expiraEm) return 'conectada';
  const restante = expiraEm.getTime() - Date.now();
  if (restante <= 0) return 'expirada';
  if (restante < JANELA_RENOVACAO_MS) return 'expira_em_breve';
  return 'conectada';
}

/** Mensagem do provedor sem devolver o corpo inteiro. */
function erroDoProvedor(corpo: unknown, status: number): string {
  if (corpo && typeof corpo === 'object') {
    const o = corpo as Record<string, unknown>;
    const erro = o.error;
    if (erro && typeof erro === 'object') {
      const e = erro as Record<string, unknown>;
      const m = [texto(e.message), texto(e.type), texto(e.error_user_msg)].filter(Boolean);
      if (m.length) return `${m.join(' · ')} (HTTP ${status})`;
    }
    const simples = [texto(o.error_description), texto(erro)].filter(Boolean);
    if (simples.length) return `${simples.join(' · ')} (HTTP ${status})`;
  }
  return `o provedor recusou (HTTP ${status})`;
}

function mensagemDe(e: unknown): string {
  if (e instanceof BadRequestException || e instanceof ServiceUnavailableException || e instanceof NotFoundException) {
    const corpo = e.getResponse();
    if (corpo && typeof corpo === 'object') {
      const m = (corpo as Record<string, unknown>).message;
      if (typeof m === 'string') return m;
    }
  }
  return e instanceof Error ? e.message : String(e);
}
