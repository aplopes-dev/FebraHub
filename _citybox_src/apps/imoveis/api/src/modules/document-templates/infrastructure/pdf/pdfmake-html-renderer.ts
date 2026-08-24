import { Injectable } from '@nestjs/common';
import { JSDOM } from 'jsdom';
import htmlToPdfmake from 'html-to-pdfmake';
import pdfMake from 'pdfmake';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { DocumentPdfRenderer } from '../../domain/pdf/document-pdf-renderer';

type VfsBundle = {
  vfs?: Record<string, string>;
  pdfMake?: { vfs: Record<string, string> };
};

function loadVfs(): Record<string, string> {
  const bundle = pdfFonts as unknown as VfsBundle & Record<string, string>;
  if (bundle.pdfMake?.vfs) return bundle.pdfMake.vfs;
  if (bundle.vfs) return bundle.vfs;
  if (bundle['Roboto-Regular.ttf']) return bundle;
  throw new Error('pdfmake vfs fonts not found');
}

const VFS = loadVfs();

function fontBuffer(name: string): Buffer {
  const b64 = VFS[name];
  if (!b64) throw new Error(`Missing pdfmake font: ${name}`);
  return Buffer.from(b64, 'base64');
}

pdfMake.setUrlAccessPolicy(() => false);
pdfMake.setLocalAccessPolicy(() => false);
pdfMake.setFonts({
  Roboto: {
    normal: fontBuffer('Roboto-Regular.ttf'),
    bold: fontBuffer('Roboto-Medium.ttf'),
    italics: fontBuffer('Roboto-Italic.ttf'),
    bolditalics: fontBuffer('Roboto-MediumItalic.ttf'),
  },
});

const JSDOM_WINDOW = new JSDOM('').window;

@Injectable()
export class PdfMakeHtmlRenderer extends DocumentPdfRenderer {
  async render(html: string, title: string): Promise<Buffer> {
    const content = htmlToPdfmake(html, { window: JSDOM_WINDOW });
    const doc: TDocumentDefinitions = {
      info: { title },
      pageSize: 'A4',
      pageMargins: [56, 56, 56, 56],
      defaultStyle: { font: 'Roboto', fontSize: 11, lineHeight: 1.25 },
      content,
    };

    return pdfMake.createPdf(doc).getBuffer();
  }
}
