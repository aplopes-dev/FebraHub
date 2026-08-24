export abstract class DocumentPdfRenderer {
  abstract render(html: string, title: string): Promise<Buffer>;
}
