"use client";

/* ============ TEXTO DE UM DOCUMENTO ============
   A extração de PDF/texto acontece NO NAVEGADOR. Áudio vai para a API
   (Whisper) — o browser não transcreve. */

export interface DocumentoExtraido {
  /** Nome do arquivo, para assinar a página. */
  origem: string;
  /** Título sugerido: o nome do arquivo sem a extensão. */
  titulo: string;
  texto: string;
  /** Quando true, o front manda o binário para POST /brain/midia. */
  ehAudio?: boolean;
  arquivo?: File;
}

const DOC_EXT = [".pdf", ".md", ".markdown", ".txt", ".csv"] as const;
const AUDIO_EXT = [".mp3", ".m4a", ".wav", ".webm", ".ogg", ".flac", ".mp4", ".mpeg", ".mpga"] as const;

export const ACEITA = [...DOC_EXT, ...AUDIO_EXT].join(",");

export class ArquivoNaoSuportado extends Error {
  constructor(nome: string) {
    super(
      `Não consigo ler "${nome}". Envie PDF, Markdown, TXT, CSV ou áudio ` +
        `(MP3, M4A, WAV, WEBM, OGG, FLAC).`,
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

  if ((AUDIO_EXT as readonly string[]).includes(ext) || arquivo.type.startsWith("audio/")) {
    return {
      ...base,
      titulo: base.titulo || "Áudio",
      texto: "(aguardando transcrição na API)",
      ehAudio: true,
      arquivo,
    };
  }

  if (!(DOC_EXT as readonly string[]).includes(ext)) throw new ArquivoNaoSuportado(nome);

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
    const linha = conteudo.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .trim();
    if (linha) paginas.push(`## Página ${i}\n\n${linha}`);
  }
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

const limpar = (t: string) =>
  t.replace(/\r\n/g, "\n").replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
