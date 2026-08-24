import { ImageFileValidator } from './image-file.validator';

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);

describe('ImageFileValidator', () => {
  it('aceita PNG válido', () => {
    expect(ImageFileValidator.validate(PNG, 'image/png')).toBe('image/png');
  });

  it('rejeita buffer vazio', () => {
    expect(() =>
      ImageFileValidator.validate(Buffer.alloc(0), 'image/png'),
    ).toThrow();
  });
});
