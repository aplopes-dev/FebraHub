import { BadGatewayException, Injectable, Logger } from '@nestjs/common';

/**
 * Cliente da impressora térmica exposta pelo servidor de impressão da IdeaPad
 * (host 172.17.0.1:9100 por padrão). Contrato do servidor:
 *   - GET  /health      -> { ok, device, writable }
 *   - POST /print/text  -> { text }        -> imprime texto puro (bytes)
 *   - POST /print/raw   -> { data: base64 } -> imprime ESC/POS bruto (bytes)
 *
 * Usamos /print/raw com ESC/POS para controlar negrito, alinhamento, tamanho
 * grande do código e o corte do papel. A URL é configurável por env
 * (PRINTER_URL / IMPRESSORA_URL) para não ficar amarrada ao host.
 */
@Injectable()
export class ImpressoraService {
  private readonly logger = new Logger(ImpressoraService.name);

  /** Base do servidor de impressão (sem barra final). */
  private base(): string {
    const url = process.env.PRINTER_URL || process.env.IMPRESSORA_URL || 'http://172.17.0.1:9100';
    return url.replace(/\/+$/, '');
  }

  private timeoutMs(): number {
    const n = Number(process.env.PRINTER_TIMEOUT_MS);
    return Number.isFinite(n) && n > 0 ? n : 6000;
  }

  private async fetchJson(caminho: string, init?: RequestInit): Promise<unknown> {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), this.timeoutMs());
    try {
      const resp = await fetch(`${this.base()}${caminho}`, { ...init, signal: ctrl.signal });
      const texto = await resp.text();
      let corpo: unknown = null;
      try { corpo = texto ? JSON.parse(texto) : null; } catch { corpo = texto; }
      if (!resp.ok) throw new BadGatewayException(`Impressora respondeu ${resp.status}: ${texto || resp.statusText}`);
      return corpo;
    } catch (e) {
      if (e instanceof BadGatewayException) throw e;
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.warn(`Falha ao falar com a impressora (${caminho}): ${msg}`);
      throw new BadGatewayException(`Não foi possível falar com a impressora: ${msg}`);
    } finally {
      clearTimeout(t);
    }
  }

  /** Estado da impressora (para a UI habilitar/desabilitar o botão). */
  async health(): Promise<{ ok: boolean; device?: string; writable?: boolean }> {
    const r = (await this.fetchJson('/health')) as { ok?: boolean; device?: string; writable?: boolean } | null;
    return { ok: !!r?.ok, device: r?.device, writable: r?.writable };
  }

  /** Imprime um buffer ESC/POS já montado (base64 pelo transporte). */
  async imprimirEscPos(buffer: Buffer): Promise<{ ok: boolean; bytes: number }> {
    const r = (await this.fetchJson('/print/raw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: buffer.toString('base64') }),
    })) as { ok?: boolean; bytes?: number } | null;
    if (!r?.ok) throw new BadGatewayException('A impressora recusou a impressão.');
    return { ok: true, bytes: r.bytes ?? buffer.length };
  }

  /** Imprime texto puro (fallback simples). */
  async imprimirTexto(texto: string): Promise<{ ok: boolean; bytes: number }> {
    const r = (await this.fetchJson('/print/text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: texto }),
    })) as { ok?: boolean; bytes?: number } | null;
    if (!r?.ok) throw new BadGatewayException('A impressora recusou a impressão.');
    return { ok: true, bytes: r.bytes ?? Buffer.byteLength(texto) };
  }
}
