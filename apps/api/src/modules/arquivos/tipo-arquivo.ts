/**
 * Detecção de tipo pelos bytes do arquivo.
 *
 * Feita à mão em vez de usar `file-type`: a versão atual daquele pacote é
 * ESM-only e não carrega num bundle CommonJS, e a lista de formatos que o
 * FebraHub aceita é curta o bastante para caber aqui — o que ainda tem a
 * vantagem de deixar explícito o que passa.
 *
 * O que isto NÃO é: validação de extensão. Extensão é sugestão do cliente;
 * um `.png` que na verdade é HTML vira XSS quando alguém abre o link.
 */

interface Assinatura {
  mime: string;
  bytes: number[];
  deslocamento?: number;
  /** Confirmação adicional em outra posição (usado por ZIP e RIFF). */
  extra?: (b: Buffer) => string | null;
}

const ASSINATURAS: Assinatura[] = [
  { mime: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/gif', bytes: [0x47, 0x49, 0x46, 0x38] }, // GIF8
  {
    // RIFF....WEBP — o "WEBP" fica no byte 8, depois do tamanho.
    mime: 'image/webp',
    bytes: [0x52, 0x49, 0x46, 0x46],
    extra: (b) => (b.subarray(8, 12).toString('latin1') === 'WEBP' ? 'image/webp' : null),
  },
  {
    // Formatos OOXML (xlsx, docx) são ZIP. Distinguimos pelo caminho interno
    // que aparece perto do início do arquivo; sem isso um .docx viraria .zip.
    mime: 'application/zip',
    bytes: [0x50, 0x4b, 0x03, 0x04],
    extra: (b) => {
      const inicio = b.subarray(0, 4096).toString('latin1');
      if (inicio.includes('word/')) {
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      }
      if (inicio.includes('xl/')) {
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      }
      if (inicio.includes('ppt/')) {
        return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      }
      return 'application/zip';
    },
  },
  // .xls antigo (OLE2 Compound File)
  { mime: 'application/vnd.ms-excel', bytes: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1] },
];

/** Devolve o MIME detectado, ou null quando os bytes não batem com nada conhecido. */
export function detectarMime(b: Buffer): string | null {
  for (const a of ASSINATURAS) {
    const off = a.deslocamento ?? 0;
    if (b.length < off + a.bytes.length) continue;
    let bate = true;
    for (let i = 0; i < a.bytes.length; i++) {
      if (b[off + i] !== a.bytes[i]) {
        bate = false;
        break;
      }
    }
    if (!bate) continue;
    return a.extra ? a.extra(b) : a.mime;
  }
  return null;
}

/**
 * Heurística para os formatos sem assinatura (CSV e TXT): byte nulo não
 * aparece em texto, e excesso de caracteres de controle indica binário
 * renomeado. Não prova que é texto — só descarta o que claramente não é.
 */
export function pareceTextoPlano(b: Buffer): boolean {
  const amostra = b.subarray(0, 4096);
  if (!amostra.length) return false;
  let suspeitos = 0;
  for (const byte of amostra) {
    if (byte === 0) return false;
    if (byte < 9 || (byte > 13 && byte < 32)) suspeitos++;
  }
  return suspeitos / amostra.length < 0.05;
}
