/// Estampagem da marca d'água de homologação (FR-005).
///
/// ⚠️ `Buffer -> Buffer`, deliberadamente ignorante de quem produziu o PDF.
///
/// Este é o ponto de projeto mais fácil de "simplificar" errado. A tentação é
/// desenhar a marca dentro do renderizador — parece mais direto e evita um
/// passo. Mas três fontes distintas produzem PDF neste sistema: a biblioteca
/// do DANFE, o nosso renderizador de DANFSE e, na Fase 2, a **API oficial do
/// Sefin** (FR-002a). Um marcador embutido no renderizador deixaria o PDF
/// vindo do órgão **sem marcação** — falhando FR-005 justamente no caminho que
/// FR-002a prefere, e em silêncio.
///
/// Se alguém mover isto para dentro de um renderizador, o teste
/// `pdf-lib-watermark.stamper.spec.ts` — que estampa um PDF que não foi
/// produzido por nós — é o que quebra.
export abstract class WatermarkStamper {
  abstract stamp(pdf: Buffer, text: string): Promise<Buffer>;
}

/// Texto da marca. O mesmo que a legislação usa para o destinatário de NF-e em
/// homologação, o que mantém a leitura coerente com o corpo do documento.
export const HOMOLOGATION_WATERMARK_TEXT = 'SEM VALOR FISCAL';
