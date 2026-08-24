import { gunzipSync } from 'zlib';

/// Interpretação da resposta do `POST /nfse` do Sistema Nacional.
///
/// O ambiente devolve a NFS-e gerada compactada (mesmo esquema `GZip+base64`
/// da DPS enviada). Rejeição de negócio vem em HTTP 200 com o motivo no
/// corpo — o transporte já trata 4xx/5xx como falha de comunicação.
export type SefinIssueOutcome =
  | {
      status: 'AUTHORIZED';
      accessKey: string;
      nfseXml: string;
    }
  | {
      status: 'REJECTED';
      errorCode?: string;
      errorMessage?: string;
    };

/// Nomes de campo tolerantes de propósito: o OpenAPI descreve o contrato mas
/// não fixa a grafia de cada variante de erro, e uma resposta bem-sucedida
/// interpretada como rejeição (ou o contrário) é o pior erro possível aqui.
/// Preferimos reconhecer mais formas do que assumir uma.
export function parseSefinIssueResponse(json: unknown): SefinIssueOutcome {
  const body = asRecord(json);

  const compressed =
    readString(body, 'nfseXmlGZipB64') ??
    readString(body, 'nfseXmlGZipB64String');
  const accessKey =
    readString(body, 'chaveAcesso') ?? readString(body, 'chaveAcessoNFSe');

  if (compressed && accessKey) {
    return {
      status: 'AUTHORIZED',
      accessKey,
      nfseXml: gunzipSync(Buffer.from(compressed, 'base64')).toString('utf-8'),
    };
  }

  return {
    status: 'REJECTED',
    errorCode: firstError(body, ['codigo', 'Codigo', 'codigoErro']),
    errorMessage:
      firstError(body, ['mensagem', 'Mensagem', 'descricao', 'Descricao']) ??
      'Rejeição sem detalhamento retornada pelo Sistema Nacional NFS-e',
  };
}

export type SefinEventOutcome = {
  accepted: boolean;
  protocol?: string;
  errorCode?: string;
  errorMessage?: string;
};

/// Desfecho do registro de evento (`POST /nfse/{chave}/eventos`).
///
/// ⚠️ Tolerante por necessidade: o formato da resposta de evento NÃO foi
/// confirmado contra o OpenAPI (indisponível — ver `SEFIN_EVENT_PAYLOAD_FIELD`).
/// Por isso a aceitação é decidida pela **ausência de erro estruturado**, não
/// pela presença de um campo específico que talvez não exista com esse nome.
///
/// Assimetria deliberada com `parseSefinIssueResponse`, que é estrito no
/// sucesso (exige chave E documento): lá o formato é conhecido, e tratar
/// resposta incompleta como autorização produziria nota fantasma. Aqui, exigir
/// um campo cujo nome eu não confirmei rejeitaria cancelamentos que deram
/// certo — e uma nota que ficou cancelada no órgão mas ativa aqui é pior.
export function parseSefinEventResponse(json: unknown): SefinEventOutcome {
  const body = asRecord(json);

  const errorCode = firstError(body, ['codigo', 'Codigo', 'codigoErro']);
  const errorMessage = firstError(body, [
    'mensagem',
    'Mensagem',
    'descricao',
    'Descricao',
  ]);

  if (errorCode || errorMessage) {
    return { accepted: false, errorCode, errorMessage };
  }

  return {
    accepted: true,
    protocol:
      readString(body, 'idEvento') ??
      readString(body, 'protocolo') ??
      readString(body, 'chaveAcesso'),
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {};
}

function readString(
  body: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = body[key];
  return typeof value === 'string' && value.trim() ? value : undefined;
}

/// As rejeições podem vir no topo ou dentro de uma lista de erros — aceitar as
/// duas formas evita perder o código oficial, que é o que o operador precisa
/// para agir (ver `national-error-codes.ts`).
function firstError(
  body: Record<string, unknown>,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const direct = readString(body, key);
    if (direct) return direct;
  }

  const list = body.erros ?? body.Erros ?? body.errors;
  if (Array.isArray(list)) {
    for (const entry of list) {
      const record = asRecord(entry);
      for (const key of keys) {
        const nested = readString(record, key);
        if (nested) return nested;
      }
    }
  }

  return undefined;
}
