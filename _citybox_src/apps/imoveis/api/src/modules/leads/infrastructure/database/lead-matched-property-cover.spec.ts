import {
  coverPhotoMapFromRows,
  propertyCoverPhotoPath,
} from './lead-matched-property-cover';

describe('lead-matched-property-cover', () => {
  it('monta path autenticado da capa', () => {
    expect(propertyCoverPhotoPath('prop-1', 'photo-1')).toBe(
      '/v1/properties/prop-1/photos/photo-1',
    );
  });

  it('usa a primeira foto de cada imóvel no mapa', () => {
    const map = coverPhotoMapFromRows([
      { propertyId: 'a', id: 'p1' },
      { propertyId: 'a', id: 'p2' },
      { propertyId: 'b', id: 'p3' },
    ]);
    expect(map.get('a')).toBe('/v1/properties/a/photos/p1');
    expect(map.get('b')).toBe('/v1/properties/b/photos/p3');
    expect(map.size).toBe(2);
  });
});
