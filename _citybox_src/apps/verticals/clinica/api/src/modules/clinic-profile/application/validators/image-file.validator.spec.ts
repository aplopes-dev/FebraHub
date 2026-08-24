import { ImageFileValidator } from './image-file.validator';
import { InvalidImageFileError } from '../../domain/errors/invalid-image-file.error';

const PNG_BUFFER = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
]);

describe('ImageFileValidator', () => {
  it('accepts valid PNG', () => {
    expect(ImageFileValidator.validate(PNG_BUFFER, 'image/png')).toBe(
      'image/png',
    );
  });

  it('rejects invalid signature', () => {
    expect(() =>
      ImageFileValidator.validate(Buffer.from('not-image'), 'image/png'),
    ).toThrow(InvalidImageFileError);
  });

  it('rejects files larger than 4MB', () => {
    const large = Buffer.concat([PNG_BUFFER, Buffer.alloc(4 * 1024 * 1024)]);
    expect(() => ImageFileValidator.validate(large, 'image/png')).toThrow(
      InvalidImageFileError,
    );
  });
});
