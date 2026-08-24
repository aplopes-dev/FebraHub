/// Um evento tal como o ambiente nacional o reporta.
///
/// `nationalEventCode` é a identidade: é por ele que se distingue um evento que
/// **nós** registramos de um que o **município** lançou de ofício. Sem ele o
/// evento é inútil para a linha do tempo e é descartado.
export type RemoteFiscalEvent = {
  nationalEventCode: string;
  /// `ambGer`: 1 = sistema próprio do município, 2 = Sefin Nacional, 3 = ADN.
  generatorEnvironment: number | null;
  /// Identificador do evento no órgão (`Id`/`idEvento`), quando informado.
  protocol: string | null;
  occurredAt: Date | null;
  description: string | null;
};

/// Códigos de evento do leiaute nacional: `e` + 6 dígitos (`tiposEventos_v1.01`).
/// Filtrar por forma, e não por lista fechada, é deliberado: um código novo que
/// o órgão passe a emitir deve aparecer na linha do tempo como desconhecido, não
/// sumir dela.
const EVENT_CODE_PATTERN = /^e\d{6}$/;

/// Lê a resposta de `GET /nfse/{chave}/eventos`.
///
/// ⚠️ **Formato não confirmado** — mesma limitação de `SEFIN_EVENT_PAYLOAD_FIELD`:
/// o OpenAPI deixou de responder nos caminhos conhecidos. Por isso a leitura é
/// tolerante na grafia dos campos e na forma do envelope (lista na raiz, ou sob
/// `eventos`/`Eventos`), e **estrita no que importa**: sem código de evento
/// reconhecível a entrada é descartada em vez de virar um evento vazio na
/// linha do tempo do contribuinte.
export function parseSefinEventsResponse(json: unknown): RemoteFiscalEvent[] {
  const entries = extractEntries(json);

  return entries
    .map((entry) => toRemoteEvent(asRecord(entry)))
    .filter((event): event is RemoteFiscalEvent => event !== null);
}

function extractEntries(json: unknown): unknown[] {
  if (Array.isArray(json)) return json;

  const body = asRecord(json);
  for (const key of ['eventos', 'Eventos', 'listaEventos', 'items']) {
    const value = body[key];
    if (Array.isArray(value)) return value;
  }
  return [];
}

function toRemoteEvent(
  entry: Record<string, unknown>,
): RemoteFiscalEvent | null {
  const nationalEventCode = findEventCode(entry);
  if (!nationalEventCode) return null;

  return {
    nationalEventCode,
    generatorEnvironment: readNumber(entry, [
      'ambGer',
      'ambienteGerador',
      'tipoAmbienteGerador',
    ]),
    protocol: readString(entry, ['idEvento', 'Id', 'id', 'protocolo']) ?? null,
    occurredAt: readDate(entry, [
      'dhEvento',
      'dataHoraEvento',
      'dhProcessamento',
    ]),
    description:
      readString(entry, ['xDesc', 'descricao', 'descEvento']) ?? null,
  };
}

/// O código pode vir como valor de um campo (`tipoEvento`) ou como **nome** do
/// elemento que carrega o corpo (`{"e101101": {...}}`, espelhando o XML). As
/// duas formas aparecem na documentação, então ambas são aceitas.
function findEventCode(entry: Record<string, unknown>): string | null {
  const direct = readString(entry, [
    'tipoEvento',
    'codigoEvento',
    'nationalEventCode',
  ]);
  if (direct && EVENT_CODE_PATTERN.test(direct)) return direct;
  // Alguns campos trazem só os 6 dígitos, sem o prefixo `e`.
  if (direct && /^\d{6}$/.test(direct)) return `e${direct}`;

  const nested = Object.keys(entry).find((key) => EVENT_CODE_PATTERN.test(key));
  return nested ?? null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {};
}

function readString(
  entry: Record<string, unknown>,
  keys: readonly string[],
): string | null {
  for (const key of keys) {
    const value = entry[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function readNumber(
  entry: Record<string, unknown>,
  keys: readonly string[],
): number | null {
  for (const key of keys) {
    const value = entry[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
      return Number(value.trim());
    }
  }
  return null;
}

/// Data inválida vira `null`, não `Invalid Date`: um `Invalid Date` propagado
/// para a linha do tempo quebra a ordenação silenciosamente.
function readDate(
  entry: Record<string, unknown>,
  keys: readonly string[],
): Date | null {
  const raw = readString(entry, keys);
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
