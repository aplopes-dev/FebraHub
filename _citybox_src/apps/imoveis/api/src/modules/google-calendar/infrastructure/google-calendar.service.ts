import { createHmac, timingSafeEqual } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import type { calendar_v3 } from 'googleapis';
import { AppointmentEntity } from '../../appointments/domain/entities/appointment.entity';
import { appointmentKindToApi } from '../../appointments/domain/mappers/appointment-enum.mapper';
import {
  APPOINTMENT_TIMEZONE,
  formatAppointmentDate,
  formatAppointmentTime,
} from '../../appointments/application/policies/appointment-datetime.policy';
import { AgentProfileRepository } from '../../settings/domain/repositories/agent-profile.repository.interface';
import { PrismaService } from '../../../shared/infra/prisma/prisma.service';
import { GoogleOAuthStateInvalidError } from '../domain/errors/google-oauth-state-invalid.error';
import { GoogleRefreshTokenMissingError } from '../domain/errors/google-refresh-token-missing.error';
import { GoogleCalendarInfrastructureError } from '../domain/errors/google-calendar-infrastructure.error';

/** Escopo mínimo para criar/atualizar/excluir eventos (não o calendar full). */
export const GOOGLE_CALENDAR_EVENTS_SCOPE =
  'https://www.googleapis.com/auth/calendar.events';

const STATE_TTL_MS = 15 * 60 * 1000;
/** Máximo de compromissos na carga inicial (OAuth / sync manual). */
const INITIAL_SYNC_LIMIT = 200;

export type GoogleOAuthStatePayload = {
  storeId: string;
  agentId: string;
  exp: number;
};

export type GoogleCalendarSyncEvent = {
  summary: string;
  description: string;
  location: string;
  startsAt: Date;
  endsAt: Date;
  googleEventId: string | null;
};

/**
 * Cliente Google Calendar + OAuth2 offline por corretor.
 * Falhas de API **não** devem quebrar o CRUD de agenda (soft).
 */
@Injectable()
export class GoogleCalendarService {
  private readonly logger = new Logger(GoogleCalendarService.name);

  constructor(
    private readonly profiles: AgentProfileRepository,
    private readonly prisma: PrismaService,
  ) {}

  isConfigured(): boolean {
    return Boolean(
      process.env.GOOGLE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_CLIENT_SECRET?.trim() &&
      process.env.GOOGLE_REDIRECT_URI?.trim(),
    );
  }

  buildAuthUrl(storeId: string, agentId: string): string {
    this.assertConfigured();
    const client = this.createOAuthClient();
    const state = this.signState({
      storeId,
      agentId,
      exp: Date.now() + STATE_TTL_MS,
    });
    return client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      /** String única — garante o scope de eventos no token. */
      scope: GOOGLE_CALENDAR_EVENTS_SCOPE,
      state,
      include_granted_scopes: true,
    });
  }

  verifyState(state: string): GoogleOAuthStatePayload {
    const secret = this.stateSecret();
    const [body, sig] = state.split('.');
    if (!body || !sig) {
      throw new GoogleOAuthStateInvalidError(GoogleCalendarService.name);
    }
    const expected = createHmac('sha256', secret)
      .update(body)
      .digest('base64url');
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new GoogleOAuthStateInvalidError(GoogleCalendarService.name);
    }
    let payload: GoogleOAuthStatePayload;
    try {
      payload = JSON.parse(
        Buffer.from(body, 'base64url').toString('utf8'),
      ) as GoogleOAuthStatePayload;
    } catch {
      throw new GoogleOAuthStateInvalidError(GoogleCalendarService.name);
    }
    if (!payload.storeId || !payload.agentId || !payload.exp) {
      throw new GoogleOAuthStateInvalidError(GoogleCalendarService.name);
    }
    if (Date.now() > payload.exp) {
      throw new GoogleOAuthStateInvalidError(
        GoogleCalendarService.name,
        'expired',
      );
    }
    return payload;
  }

  async exchangeCodeAndConnect(params: {
    code: string;
    storeId: string;
    agentId: string;
  }): Promise<void> {
    this.assertConfigured();
    const client = this.createOAuthClient();
    this.logger.log(
      `[OAuth] exchanging code storeId=${params.storeId} agentId=${params.agentId}`,
    );

    let refreshToken: string | null = null;
    try {
      const { tokens } = await client.getToken(params.code);
      refreshToken = tokens.refresh_token?.trim() || null;
    } catch (error) {
      this.logger.error(
        `[OAuth] getToken failed storeId=${params.storeId} agentId=${params.agentId}: ${formatGoogleError(error)}`,
      );
      throw error;
    }

    let resolvedRefreshToken = refreshToken;
    if (!resolvedRefreshToken) {
      const existing = await this.profiles.findByAgentId(
        params.storeId,
        params.agentId,
      );
      resolvedRefreshToken = existing?.googleRefreshToken?.trim() || null;
    }

    if (!resolvedRefreshToken) {
      this.logger.warn(
        `[OAuth] refresh_token ausente no token response e no perfil (storeId=${params.storeId} agentId=${params.agentId}). Reauthorize with prompt=consent.`,
      );
      throw new GoogleRefreshTokenMissingError(GoogleCalendarService.name);
    }

    if (!refreshToken) {
      this.logger.log(
        `[OAuth] sem refresh_token novo; reutilizando o existente e forçando googleCalendarEnabled=true (storeId=${params.storeId} agentId=${params.agentId})`,
      );
    }

    // Sempre persiste enabled=true no callback — flag de “integração ativa”.
    const saved = await this.profiles.setGoogleCalendarCredentials(
      params.storeId,
      params.agentId,
      {
        googleCalendarEnabled: true,
        googleRefreshToken: resolvedRefreshToken,
        googleCalendarId: 'primary',
      },
    );

    if (!saved.googleCalendarEnabled) {
      this.logger.error(
        `[OAuth] googleCalendarEnabled ficou false após upsert (storeId=${params.storeId} agentId=${params.agentId})`,
      );
      throw new GoogleCalendarInfrastructureError(
        GoogleCalendarService.name,
        'Falha ao ativar Google Calendar no perfil do corretor',
      );
    }
    if (!saved.googleRefreshToken?.trim()) {
      this.logger.error(
        `[OAuth] refresh token não persistiu (storeId=${params.storeId} agentId=${params.agentId})`,
      );
      throw new GoogleCalendarInfrastructureError(
        GoogleCalendarService.name,
        'Falha ao gravar refresh token do Google Calendar',
      );
    }

    this.logger.log(
      `[OAuth] connected storeId=${params.storeId} agentId=${params.agentId} googleCalendarEnabled=true calendarId=${saved.googleCalendarId}`,
    );

    // Carga inicial: passados + futuros sem googleEventId — em background.
    this.scheduleHistoricalSync(params.storeId, params.agentId);
  }

  /**
   * Dispara a carga histórica em background (fire-and-forget).
   * Falhas são só logadas — OAuth já concluiu.
   */
  scheduleHistoricalSync(storeId: string, agentId: string): void {
    void this.syncExistingAppointmentsForAgent(storeId, agentId)
      .then((synced) => {
        this.logger.log(
          `[OAuth] historical sync done storeId=${storeId} agentId=${agentId} synced=${synced}`,
        );
      })
      .catch((error: unknown) => {
        this.logger.warn(
          `[OAuth] historical sync failed storeId=${storeId} agentId=${agentId}: ${formatGoogleError(error)}`,
        );
      });
  }

  async disconnect(storeId: string, agentId: string): Promise<void> {
    await this.profiles.setGoogleCalendarCredentials(storeId, agentId, {
      googleCalendarEnabled: false,
      googleRefreshToken: null,
      googleCalendarId: 'primary',
    });
    this.logger.log(
      `[OAuth] disconnected storeId=${storeId} agentId=${agentId}`,
    );
  }

  /**
   * Carga inicial (CRM → Google): **passados e futuros** do corretor sem
   * `googleEventId` (máx. `INITIAL_SYNC_LIMIT`), ordenados do mais antigo ao
   * mais recente. Soft-fail por evento.
   */
  async syncExistingAppointmentsForAgent(
    storeId: string,
    agentId: string,
  ): Promise<number> {
    if (!this.isConfigured()) {
      this.logger.warn(
        `[GoogleSync] skip historical: GOOGLE_* não configurado agentId=${agentId}`,
      );
      return 0;
    }

    const totalWithoutGoogleEvent = await this.prisma.appointment.count({
      where: {
        storeId,
        agentId,
        googleEventId: null,
      },
    });

    // Sem filtro de data: inclui eventos antigos e futuros pendentes.
    const rows = await this.prisma.appointment.findMany({
      where: {
        storeId,
        agentId,
        googleEventId: null,
      },
      orderBy: { startsAt: 'asc' },
      take: INITIAL_SYNC_LIMIT,
    });

    this.logger.log(
      `[GoogleSync] Encontrados ${rows.length} compromissos pendentes para o agente ${agentId} ` +
        `(storeId=${storeId}, passados+futuros, totalSemGoogleEventId=${totalWithoutGoogleEvent}, ` +
        `limit=${INITIAL_SYNC_LIMIT})`,
    );

    if (rows.length === 0) {
      return 0;
    }

    if (totalWithoutGoogleEvent > rows.length) {
      this.logger.warn(
        `[GoogleSync] ${totalWithoutGoogleEvent - rows.length} pendente(s) ficaram ` +
          `fora do batch (limit=${INITIAL_SYNC_LIMIT}); rode sync de novo se necessário agentId=${agentId}`,
      );
    }

    let synced = 0;
    let failed = 0;
    for (const row of rows) {
      const appointment = AppointmentEntity.create(
        {
          storeId: row.storeId,
          title: row.title,
          description: row.description,
          startsAt: row.startsAt,
          endsAt: row.endsAt,
          location: row.location,
          kind: appointmentKindToApi(row.kind),
          agentId: row.agentId,
          done: row.done,
          leadId: row.leadId,
          leadName: row.leadName,
          leadEmail: row.leadEmail,
          leadPhone: row.leadPhone,
          leadPhotoUrl: row.leadPhotoUrl,
          propertyId: row.propertyId,
          googleEventId: row.googleEventId,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        },
        row.id,
      );

      const eventId = await this.upsertEventForAgent({
        storeId,
        agentId,
        appointment,
      });
      if (!eventId) {
        failed += 1;
        this.logger.warn(
          `[GoogleSync] falha/skip insert appointment=${row.id} startsAt=${row.startsAt.toISOString()} agentId=${agentId}`,
        );
        continue;
      }

      await this.prisma.appointment.update({
        where: { id: row.id },
        data: { googleEventId: eventId },
      });
      synced += 1;
      this.logger.log(
        `[GoogleSync] synced appointment=${row.id} googleEventId=${eventId} startsAt=${row.startsAt.toISOString()}`,
      );
    }

    this.logger.log(
      `[GoogleSync] concluído agentId=${agentId} synced=${synced} failed=${failed} found=${rows.length}`,
    );

    return synced;
  }

  /**
   * Alias usado pelo endpoint manual POST …/sync e pela Agenda web.
   * Mesma semântica da carga inicial (passados + futuros sem googleEventId).
   */
  async syncPendingAppointmentsForAgent(
    storeId: string,
    agentId: string,
  ): Promise<number> {
    return this.syncExistingAppointmentsForAgent(storeId, agentId);
  }

  /**
   * Cria ou atualiza o evento no calendar do **agentId responsável**.
   * Retorna o eventId ou null se desconectado/desabilitado/falha soft.
   */
  async upsertEventForAgent(params: {
    storeId: string;
    agentId: string;
    appointment: AppointmentEntity;
  }): Promise<string | null> {
    const appointmentId = params.appointment.id;
    if (!this.isConfigured()) {
      this.logger.warn(
        `[sync] skip appointment=${appointmentId}: GOOGLE_* env não configurado`,
      );
      return null;
    }

    const profile = await this.profiles.findByAgentId(
      params.storeId,
      params.agentId,
    );
    if (!profile) {
      this.logger.warn(
        `[sync] skip appointment=${appointmentId}: AgentProfile ausente (storeId=${params.storeId} agentId=${params.agentId})`,
      );
      return null;
    }
    if (!profile.googleCalendarEnabled) {
      this.logger.warn(
        `[sync] skip appointment=${appointmentId}: googleCalendarEnabled=false (storeId=${params.storeId} agentId=${params.agentId})`,
      );
      return null;
    }
    if (!profile.googleRefreshToken?.trim()) {
      this.logger.warn(
        `[sync] skip appointment=${appointmentId}: googleRefreshToken ausente (storeId=${params.storeId} agentId=${params.agentId})`,
      );
      return null;
    }

    const calendarId = profile.googleCalendarId?.trim() || 'primary';
    const event = this.appointmentToEvent(params.appointment);
    const body = this.toGoogleEvent(event);

    this.logger.log(
      `[sync] upsert appointment=${appointmentId} storeId=${params.storeId} agentId=${params.agentId} calendarId=${calendarId} googleEventId=${event.googleEventId ?? 'new'} start=${body.start?.dateTime} end=${body.end?.dateTime} tz=${body.start?.timeZone}`,
    );

    try {
      const calendar = this.createCalendarClient(profile.googleRefreshToken);
      if (event.googleEventId) {
        await calendar.events.update({
          calendarId,
          eventId: event.googleEventId,
          requestBody: body,
        });
        this.logger.log(
          `[sync] updated appointment=${appointmentId} googleEventId=${event.googleEventId}`,
        );
        return event.googleEventId;
      }
      const created = await calendar.events.insert({
        calendarId,
        requestBody: body,
      });
      const id = created.data.id ?? null;
      if (!id) {
        this.logger.warn(
          `[sync] insert sem id no response appointment=${appointmentId}`,
        );
      } else {
        this.logger.log(
          `[sync] inserted appointment=${appointmentId} googleEventId=${id}`,
        );
      }
      return id;
    } catch (error) {
      this.logger.error(
        `[sync] falha Google API appointment=${appointmentId} storeId=${params.storeId} agentId=${params.agentId}: ${formatGoogleError(error)}`,
      );
      return null;
    }
  }

  async deleteEventForAgent(params: {
    storeId: string;
    agentId: string;
    googleEventId: string | null;
  }): Promise<void> {
    if (!params.googleEventId || !this.isConfigured()) return;

    const profile = await this.profiles.findByAgentId(
      params.storeId,
      params.agentId,
    );
    if (!profile?.googleRefreshToken?.trim()) {
      this.logger.warn(
        `[sync] skip delete googleEventId=${params.googleEventId}: sem refresh token (agentId=${params.agentId})`,
      );
      return;
    }

    const calendarId = profile.googleCalendarId?.trim() || 'primary';
    try {
      const calendar = this.createCalendarClient(profile.googleRefreshToken);
      await calendar.events.delete({
        calendarId,
        eventId: params.googleEventId,
      });
      this.logger.log(
        `[sync] deleted googleEventId=${params.googleEventId} agentId=${params.agentId}`,
      );
    } catch (error) {
      this.logger.warn(
        `[sync] falha ao remover googleEventId=${params.googleEventId}: ${formatGoogleError(error)}`,
      );
    }
  }

  /**
   * Pós-OAuth: volta para a Agenda (banner de conexão).
   * Sucesso: `/calendar?connected=true`
   */
  frontendRedirectUrl(query: Record<string, string>): string {
    const base = (
      process.env.IMOVEIS_WEB_URL ??
      process.env.NEXT_PUBLIC_APP_URL ??
      'http://localhost:3111'
    ).replace(/\/$/, '');
    const qs = new URLSearchParams(query).toString();
    return qs ? `${base}/calendar?${qs}` : `${base}/calendar`;
  }

  /** Expõe formatação de datetime Google (timezone America/Bahia) — útil em testes. */
  formatEventDateTime(instant: Date): { dateTime: string; timeZone: string } {
    return toGoogleDateTime(instant);
  }

  private appointmentToEvent(
    appointment: AppointmentEntity,
  ): GoogleCalendarSyncEvent {
    const lines = [
      appointment.description.trim(),
      appointment.leadName ? `Cliente: ${appointment.leadName}` : '',
      appointment.leadPhone ? `Telefone: ${appointment.leadPhone}` : '',
      appointment.propertyId ? `Imóvel: ${appointment.propertyId}` : '',
    ].filter(Boolean);

    return {
      summary: appointment.title,
      description: lines.join('\n'),
      location: appointment.location,
      startsAt: appointment.startsAt,
      endsAt: appointment.endsAt,
      googleEventId: appointment.googleEventId,
    };
  }

  private toGoogleEvent(
    event: GoogleCalendarSyncEvent,
  ): calendar_v3.Schema$Event {
    const start = toGoogleDateTime(event.startsAt);
    const end = toGoogleDateTime(event.endsAt);
    return {
      summary: event.summary,
      description: event.description || undefined,
      location: event.location || undefined,
      start,
      end,
    };
  }

  private createCalendarClient(refreshToken: string): calendar_v3.Calendar {
    const auth = this.createOAuthClient();
    auth.setCredentials({ refresh_token: refreshToken });
    return google.calendar({ version: 'v3', auth });
  }

  private createOAuthClient() {
    return new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID!.trim(),
      process.env.GOOGLE_CLIENT_SECRET!.trim(),
      process.env.GOOGLE_REDIRECT_URI!.trim(),
    );
  }

  private signState(payload: GoogleOAuthStatePayload): string {
    const body = Buffer.from(JSON.stringify(payload), 'utf8').toString(
      'base64url',
    );
    const sig = createHmac('sha256', this.stateSecret())
      .update(body)
      .digest('base64url');
    return `${body}.${sig}`;
  }

  private stateSecret(): string {
    return (
      process.env.GOOGLE_OAUTH_STATE_SECRET?.trim() ||
      process.env.GOOGLE_CLIENT_SECRET?.trim() ||
      'imoveis-google-oauth-dev-secret'
    );
  }

  private assertConfigured(): void {
    if (!this.isConfigured()) {
      throw new GoogleCalendarInfrastructureError(
        GoogleCalendarService.name,
        'Integração Google Calendar não configurada (GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI)',
      );
    }
  }
}

/** Wall-clock helper exportado (testes + formatação de evento). */
export function toGoogleDateTime(instant: Date): {
  dateTime: string;
  timeZone: string;
} {
  if (!(instant instanceof Date) || Number.isNaN(instant.getTime())) {
    throw new Error(`Invalid Date for Google Calendar: ${String(instant)}`);
  }
  const date = formatAppointmentDate(instant);
  const time = formatAppointmentTime(instant);
  return {
    dateTime: `${date}T${time}:00`,
    timeZone: APPOINTMENT_TIMEZONE,
  };
}

function formatGoogleError(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return String(error);
  }
  const e = error as {
    message?: string;
    code?: string | number;
    response?: { status?: number; statusText?: string; data?: unknown };
    errors?: unknown;
  };
  const status = e.response?.status;
  const statusText = e.response?.statusText;
  const data = e.response?.data;
  const parts = [
    e.message,
    e.code != null ? `code=${e.code}` : null,
    status != null ? `httpStatus=${status}` : null,
    statusText ? `statusText=${statusText}` : null,
    data != null ? `body=${safeJson(data)}` : null,
  ].filter(Boolean);
  return parts.join(' | ') || String(error);
}

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
