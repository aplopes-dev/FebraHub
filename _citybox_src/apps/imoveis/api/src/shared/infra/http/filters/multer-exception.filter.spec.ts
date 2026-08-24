import { fileTooLargeMessage } from './multer-exception.filter';

describe('fileTooLargeMessage', () => {
  it('indica o limite de 4 MB para fotos de perfil e imóvel', () => {
    expect(fileTooLargeMessage('/api/v1/settings/profile/ana/photo')).toBe(
      'Imagem deve ter no máximo 4 MB',
    );
    expect(fileTooLargeMessage('/api/v1/properties/abc/photos')).toBe(
      'Imagem deve ter no máximo 4 MB',
    );
  });

  it('indica o limite de 15 MB para documentos', () => {
    expect(
      fileTooLargeMessage('/api/v1/settings/profile/ana/documents/license'),
    ).toBe('Documento deve ter no máximo 15 MB');
    expect(fileTooLargeMessage('/api/v1/properties/abc/documents')).toBe(
      'Documento deve ter no máximo 15 MB',
    );
  });
});
