import { StoreObjectKeyPolicy } from './store-object-key.policy';

const STORE_ID = '019c0000-0000-7000-8000-000000000001';

describe('StoreObjectKeyPolicy', () => {
  it('guarda a logo dentro da pasta da loja e do estabelecimento', () => {
    expect(
      StoreObjectKeyPolicy.logoKey(STORE_ID, 'Studio Bella', 'image/png'),
    ).toBe(`${STORE_ID}/studio-bella/logo/logo.png`);
  });

  it('normaliza acentos, símbolos e espaços repetidos', () => {
    expect(
      StoreObjectKeyPolicy.logoKey(
        STORE_ID,
        '  Salão   Beleza & Cia.  ',
        'image/webp',
      ),
    ).toBe(`${STORE_ID}/salao-beleza-cia/logo/logo.webp`);
  });

  it('usa jpg para mime types não mapeados', () => {
    expect(
      StoreObjectKeyPolicy.logoKey(STORE_ID, 'Studio Bella', 'image/jpeg'),
    ).toBe(`${STORE_ID}/studio-bella/logo/logo.jpg`);
  });

  it('cai no slug padrão quando o nome não gera caracteres válidos', () => {
    expect(StoreObjectKeyPolicy.logoKey(STORE_ID, '***', 'image/png')).toBe(
      `${STORE_ID}/estabelecimento/logo/logo.png`,
    );
  });
});
