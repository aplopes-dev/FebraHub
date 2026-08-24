import { DanfeNfceRenderer } from './danfe-nfce.renderer';
import { DanfceA4Renderer } from './danfce-a4.renderer';
import {
  CONTINGENCY_BANNER_TEXT,
  isContingencyXml,
} from './contingency-banner';
import { buildAuthorizedNfceXml } from '../../tests/fixtures/authorized-nfce-xml';
import { extractPdfText } from '../../tests/pdf-text';

describe('Marcação de contingência no documento auxiliar (FR-011, T056)', () => {
  const normal = buildAuthorizedNfceXml();
  const contingencia = buildAuthorizedNfceXml({ emissionType: '9' });

  describe('isContingencyXml', () => {
    it('reconhece tpEmis=9', () => {
      expect(isContingencyXml(contingencia.xml)).toBe(true);
    });

    it('nao marca emissao normal', () => {
      expect(isContingencyXml(normal.xml)).toBe(false);
    });

    it('⚠️ deriva do XML, nao de parametro', () => {
      // Se a marcação viesse por flag, um chamador que esquecesse de passá-la
      // imprimiria cupom de contingência sem aviso — e o consumidor levaria um
      // papel que se apresenta como autorizado sem estar.
      //
      // Vindo do XML autorizado, esquecer é impossível: o `tpEmis` está lá
      // porque foi o que a emissão gravou.
      expect(contingencia.xml).toContain('<tpEmis>9</tpEmis>');
    });
  });

  const casos = [
    ['bobina', () => new DanfeNfceRenderer()],
    ['A4', () => new DanfceA4Renderer()],
  ] as const;

  for (const [formato, build] of casos) {
    describe(`na ${formato}`, () => {
      it('imprime a faixa quando e contingencia', async () => {
        const pdf = await build().render({
          authorizedXml: Buffer.from(contingencia.xml, 'utf-8'),
          isCancelled: false,
        });

        expect((await extractPdfText(pdf)).toUpperCase()).toContain(
          CONTINGENCY_BANNER_TEXT,
        );
      }, 30_000);

      it('NAO imprime a faixa em emissao normal', async () => {
        // Faixa em todo cupom treinaria o olho a ignorá-la, e a que importa
        // passaria despercebida junto.
        const pdf = await build().render({
          authorizedXml: Buffer.from(normal.xml, 'utf-8'),
          isCancelled: false,
        });

        expect((await extractPdfText(pdf)).toUpperCase()).not.toContain(
          'CONTINGENCIA',
        );
      }, 30_000);
    });
  }

  it('as duas vias trazem a MESMA marcacao (SC-007)', async () => {
    const bobina = await new DanfeNfceRenderer().render({
      authorizedXml: Buffer.from(contingencia.xml, 'utf-8'),
      isCancelled: false,
    });
    const a4 = await new DanfceA4Renderer().render({
      authorizedXml: Buffer.from(contingencia.xml, 'utf-8'),
      isCancelled: false,
    });

    for (const pdf of [bobina, a4]) {
      expect((await extractPdfText(pdf)).toUpperCase()).toContain(
        CONTINGENCY_BANNER_TEXT,
      );
    }
  }, 60_000);
});
