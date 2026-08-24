import { resolvePhotoOrder } from './resolve-photo-order';

describe('resolvePhotoOrder', () => {
  it('aplica a permutação pedida (nova capa na frente)', () => {
    expect(resolvePhotoOrder(['a', 'b', 'c'], ['c', 'a', 'b'])).toEqual([
      'c',
      'a',
      'b',
    ]);
  });

  it('completa com as fotos que o form ainda não listou', () => {
    expect(resolvePhotoOrder(['a', 'b', 'c'], ['c', 'a'])).toEqual([
      'c',
      'a',
      'b',
    ]);
  });

  it('ignora ids que não existem no imóvel', () => {
    expect(resolvePhotoOrder(['a', 'b'], ['x', 'b', 'a'])).toEqual(['b', 'a']);
  });

  it('mantém a ordem atual se o pedido vier vazio', () => {
    expect(resolvePhotoOrder(['a', 'b'], [])).toEqual(['a', 'b']);
  });
});
