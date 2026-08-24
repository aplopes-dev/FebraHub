import { DocumentFileValidator } from './document-file.validator';

const PDF = Buffer.from('%PDF-1.7\n%mock', 'binary');
const DOCX = Buffer.concat([
  Buffer.from([0x50, 0x4b, 0x03, 0x04]),
  Buffer.alloc(8),
]);
const DOC = Buffer.concat([
  Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
  Buffer.alloc(8),
]);

describe('DocumentFileValidator', () => {
  it('aceita PDF válido', () => {
    expect(DocumentFileValidator.validate(PDF, 'Escritura.pdf')).toBe(
      'application/pdf',
    );
  });

  it('aceita DOCX válido', () => {
    expect(DocumentFileValidator.validate(DOCX, 'Contrato.docx')).toBe(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
  });

  it('aceita DOC válido', () => {
    expect(DocumentFileValidator.validate(DOC, 'Contrato.doc')).toBe(
      'application/msword',
    );
  });

  it('rejeita buffer vazio', () => {
    expect(() =>
      DocumentFileValidator.validate(Buffer.alloc(0), 'a.pdf'),
    ).toThrow();
  });

  it('rejeita conteúdo desconhecido', () => {
    expect(() =>
      DocumentFileValidator.validate(Buffer.from('plain text'), 'a.pdf'),
    ).toThrow();
  });

  it('rejeita extensão divergente do conteúdo', () => {
    expect(() =>
      DocumentFileValidator.validate(PDF, 'Escritura.docx'),
    ).toThrow();
    expect(() =>
      DocumentFileValidator.validate(DOCX, 'Contrato.pdf'),
    ).toThrow();
  });

  it('rejeita arquivo maior que o limite', () => {
    const big = Buffer.concat([
      PDF,
      Buffer.alloc(DocumentFileValidator.maxBytes),
    ]);
    expect(() => DocumentFileValidator.validate(big, 'a.pdf')).toThrow();
  });

  it('sanitiza nome removendo caminho', () => {
    expect(DocumentFileValidator.sanitizeName('../../etc/Escritura.pdf')).toBe(
      'Escritura.pdf',
    );
  });

  it('rejeita nome vazio', () => {
    expect(() => DocumentFileValidator.sanitizeName('  ')).toThrow();
  });
});
