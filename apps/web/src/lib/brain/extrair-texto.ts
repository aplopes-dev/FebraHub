"use client";

/* ============ TEXTO DE UM DOCUMENTO ============
   A extração acontece NO NAVEGADOR, não na API. Três razões:

   · o pdfjs já está no bundle (é o mesmo que desenha as miniaturas das
     conversas), então não custa dependência nova;
   · a API não ganha um parser de PDF nem gasta CPU do servidor por upload;
   · o que trafega é texto — bem menor que o binário, e é só o texto que a
     memória institucional guarda.

   O worker do pdfjs é servido de /public, nunca de CDN. */

export interface DocumentoExtraido {
  /** Nome do arquivo, para assinar a página. */
  origem: string;
  /** Título sugerido: o nome do arquivo sem a extensão. */
  titulo: string;
  texto: string;
}

/** O que dá para ler hoje. DOCX ficou de fora: é um zip de XML e exigiria uma
 *  biblioteca nova só para ele — converter para PDF resolve. */
const EXTENSOES = [".pdf", ".md", ".markdown", ".txt", ".csv"] as const;

export const ACEITA = EXTENSOES.join(",");

export class ArquivoNaoSuportado extends Error {
  constructor(nome: string) {
    super(
      `Não consigo ler "${nome}". Envie PDF, Markdown, TXT ou CSV — ` +
        `para .docx, exporte como PDF ou cole o texto no campo abaixo.`,
    );
    this.name = "ArquivoNaoSuportado";
  }
}

let workerPronto = false;
async function prepararPdfjs() {
  if (workerPronto) return;
  workerPronto = true;
  const { GlobalWorkerOptions } = await import("pdfjs-dist");
  GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
}

const semExtensao = (nome: string) => nome.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();

export async function extrairTexto(arquivo: File): Promise<DocumentoExtraido> {
  const nome = arquivo.name;
  const ext = `.${(nome.split(".").pop() ?? "").toLowerCase()}`;
  const base = { origem: nome, titulo: semExtensao(nome) || "Documento" };

  if (!EXTENSOES.includes(ext as (typeof EXTENSOES)[number])) throw new ArquivoNaoSuportado(nome);

  if (ext !== ".pdf") {
    const texto = await arquivo.text();
    return { ...base, texto: limpar(texto) };
  }

  await prepararPdfjs();
  const pdfjs = await import("pdfjs-dist");
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await arquivo.arrayBuffer()) }).promise;

  const paginas: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const pagina = await doc.getPage(i);
    const conteudo = await pagina.getTextContent();
    // `str` só existe nos itens de texto; os de marcação entram sem ele.
    const linha = conteudo.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .trim();
    // O número da página vira parte do texto: quando o gbrain citar o trecho,
    // dá para achar de onde ele saiu no documento original.
    if (linha) paginas.push(`## Página ${i}\n\n${linha}`);
  }
  // Libera o worker: sem isto, cada PDF lido deixa um documento vivo na
  // memória da aba. O nome do método mudou entre versões do pdfjs, e os
  // tipos da 6.x não declaram nenhum dos dois.
  const fechavel = doc as unknown as { destroy?: () => Promise<void>; cleanup?: () => Promise<void> };
  await (fechavel.destroy?.() ?? fechavel.cleanup?.() ?? Promise.resolve());

  const texto = limpar(paginas.join("\n\n"));
  if (!texto) {
    throw new Error(
      `"${nome}" não tem texto extraível — provavelmente é um PDF digitalizado (imagem). ` +
        `Passe por um OCR antes de enviar.`,
    );
  }
  return { ...base, texto };
}

/** Espaço repetido e quebra tripla viram ruído nos chunks do gbrain. */
const limpar = (t: string) =>
  t.replace(/\r\n/g, "\n").replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
