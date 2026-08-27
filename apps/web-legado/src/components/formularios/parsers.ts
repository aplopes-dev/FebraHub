/* ============ AVALIAÇÕES: PARSERS ============
   Duas entradas manuais, dois formatos. Nada é gravado aqui: os forms
   mostram a prévia e só então chamam a API. */

// Tokenizador que respeita aspas: um campo entre "..." pode conter o
// delimitador E quebras de linha (comentários do GGB); "" é aspa escapada.
export function parseDelimitado(texto: string, delim: string): string[][] {
  const s = String(texto ?? "").replace(/\r\n?/g, "\n");
  const linhas: string[][] = [];
  let linha: string[] = [], campo = "", aspas = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (aspas) {
      if (c === '"') { if (s[i + 1] === '"') { campo += '"'; i++; } else aspas = false; }
      else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === delim) { linha.push(campo); campo = ""; }
    else if (c === "\n") { linha.push(campo); linhas.push(linha); linha = []; campo = ""; }
    else campo += c;
  }
  if (campo.length || linha.length) { linha.push(campo); linhas.push(linha); }
  return linhas;
}

// "9,5" | "9.5" | " 10 " -> número; vazio/lixo -> null.
export const notaNum = (v: unknown): number | null => {
  const n = Number(String(v ?? "").trim().replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

export const mediaNotas = (arr: readonly (number | null)[]): number | null => {
  const v = arr.filter((x): x is number => x != null);
  return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null;
};

// Sem acento e minúsculo. O range é o de combinantes Unicode (U+0300-U+036F).
export const semAcento = (s: unknown): string =>
  String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/* ---------- GGB (bloco colado, TSV) ---------- */

export type CampoGGB =
  | "q_conteudo" | "q_clareza" | "q_material" | "q_aplicacao"
  | "q_dominio" | "q_pontualidade" | "q_duvidas" | "nps";

// Ordem das 8 colunas de nota do bloco GGB -> campos da fato_avaliacao
// (confirmado pela gestora). A 8ª é a indicação ("NPS"); a 9ª é comentário.
export const GGB_CAMPOS: readonly CampoGGB[] =
  ["q_conteudo", "q_clareza", "q_material", "q_aplicacao", "q_dominio", "q_pontualidade", "q_duvidas", "nps"];

export const GGB_ROTULO: Record<CampoGGB, string> = {
  q_conteudo: "Conteúdo", q_clareza: "Clareza", q_material: "Material", q_aplicacao: "Aplicação",
  q_dominio: "Domínio", q_pontualidade: "Pontualidade", q_duvidas: "Dúvidas", nps: "Indicação (alunos)",
};

export type MediasGGB = Record<CampoGGB, number | null>;

export interface PreviaGGB extends MediasGGB {
  nota_treinador: number | null;
  respondentes: number;
}

/* Processa o bloco colado do GGB (TSV; comentários entre aspas podem ter
   quebras de linha). Devolve as 8 médias + nota do treinador + respondentes.
   Não grava — o form mostra o preview e só então insere. */
export function parseGGB(texto: string): PreviaGGB {
  const linhas = parseDelimitado(texto, "\t");
  let nota_treinador: number | null = null;
  for (const l of linhas) {
    const m = l.join(" ").match(/NOTA\s+D[AO]\s+TREINADOR[A]?\s*[:\-]?\s*([\d.,]+)/i);
    if (m) { nota_treinador = notaNum(m[1]); break; }
  }
  // Respondentes: linhas com >= 8 colunas e 1º campo numérico (exclui
  // cabeçalho de texto e a linha da nota da treinadora).
  const resp = linhas.filter((l) => l.length >= 8 && notaNum(l[0]) != null);
  const medias = {} as MediasGGB;
  GGB_CAMPOS.forEach((campo, i) => { medias[campo] = mediaNotas(resp.map((l) => notaNum(l[i]))); });
  return { ...medias, nota_treinador, respondentes: resp.length };
}

/* ---------- EVENTOS (CSV do Make Forms) ---------- */

// Escala 1-5 em texto ("5 — Definitivamente sim"): pega o 1º dígito. Robusto
// contra o travessão mal codificado — não depende do resto do rótulo.
export const notaEscala = (v: unknown): number | null => {
  const m = String(v ?? "").match(/^\s*(\d)/);
  return m ? Number(m[1]) : null;
};

// "Submitted At" -> data ISO (aceita YYYY-MM-DD e DD/MM/YYYY).
export const dataISO = (v: unknown): string | null => {
  const s = String(v ?? "").trim();
  let m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return null;
};

export type CampoEvento = "q_conteudo" | "q_material" | "q_clareza" | "q_dominio" | "q_aplicacao" | "nps";

// Colunas do CSV do Make Forms -> campos da fato_avaliacao (confirmado pela
// gestora). A escala é 1-5 e NÃO é convertida. `recomendacao` é o indicador
// principal (nps). Evento/treinador vêm à parte; a data sai de "Submitted At".
export const CSV_EVENTO_MAP: Record<string, CampoEvento> = {
  satisfacao_geral: "q_conteudo", utilidade_conteudo: "q_material", metodologia: "q_clareza",
  dominio_treinador: "q_dominio", aplicacao_conhecimento: "q_aplicacao", recomendacao: "nps",
};

// Rótulo p/ o preview do evento (campos mapeados do CSV).
export const EV_ROTULO: Record<CampoEvento, string> = {
  q_conteudo: "Satisfação", q_material: "Utilidade", q_clareza: "Metodologia",
  q_dominio: "Domínio", q_aplicacao: "Aplicação", nps: "Indicação",
};
export const EV_ORDEM: readonly CampoEvento[] =
  ["nps", "q_conteudo", "q_material", "q_clareza", "q_dominio", "q_aplicacao"];

export interface PreviaEvento {
  medias: Partial<Record<CampoEvento, number | null>>;
  nps: number | null;
  comentario: string | null;
  data_curso: string | null;
  respondentes: number;
  encontradas: CampoEvento[];
}

/* Processa o CSV do Make Forms. Casa colunas pelo NOME (sem acento, tolerante
   a mojibake nos VALORES, que só lemos o 1º dígito). Devolve as médias 1-5
   mapeadas, o comentário (principal_aprendizado juntado) e a data (Submitted
   At). Encoding: o form lê o arquivo como UTF-8 antes de chamar aqui. */
export function parseCSVEvento(texto: string): PreviaEvento {
  const primeira = String(texto ?? "").split("\n")[0] ?? "";
  const delim = (primeira.match(/;/g) || []).length > (primeira.match(/,/g) || []).length ? ";" : ",";
  const linhas = parseDelimitado(texto, delim).filter((l) => l.some((c) => String(c).trim() !== ""));
  if (linhas.length < 2) return { medias: {}, nps: null, comentario: null, data_curso: null, respondentes: 0, encontradas: [] };
  // Normaliza o nome da coluna: sem acento, minúsculo, e espaço≡underscore
  // (o header pode vir "satisfacao_geral" ou "Satisfação Geral").
  const chaveCol = (s: string) => semAcento(s).trim().replace(/[\s_]+/g, "_");
  const header = linhas[0].map(chaveCol);
  const corpo = linhas.slice(1);
  const idxDe = (nome: string) => { const n = chaveCol(nome); const e = header.indexOf(n); return e >= 0 ? e : header.findIndex((h) => h.includes(n)); };

  const medias: Partial<Record<CampoEvento, number | null>> = {};
  const encontradas: CampoEvento[] = [];
  for (const [col, campo] of Object.entries(CSV_EVENTO_MAP)) {
    const idx = idxDe(col);
    if (idx < 0) continue;
    encontradas.push(campo);
    medias[campo] = mediaNotas(corpo.map((l) => notaEscala(l[idx])));
  }
  const idxCom = idxDe("principal_aprendizado");
  const comentario = idxCom >= 0 ? (corpo.map((l) => String(l[idxCom] ?? "").trim()).filter(Boolean).join("\n") || null) : null;
  const idxData = idxDe("submitted at");
  const data_curso = idxData >= 0 ? (corpo.map((l) => dataISO(l[idxData])).find(Boolean) ?? null) : null;
  return { medias, nps: medias.nps ?? null, comentario, data_curso, respondentes: corpo.length, encontradas };
}
