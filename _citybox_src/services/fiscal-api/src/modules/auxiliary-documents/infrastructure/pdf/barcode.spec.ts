import {
  renderAccessKeyBarcode,
  renderVerificationQrCode,
  formatAccessKey,
} from './barcode';

/// NF-e: 44 dígitos. NFS-e: 50. O módulo serve os dois documentos, e tratar os
/// dois como 44 quebrava o DANFSE — defeito real pego por este teste.
const NFE_KEY = '29136062250031609000104000000000002026080715';
const NFSE_KEY = '29136062250031609000104000000000002026080715989993';

describe('barcode', () => {
  describe('renderAccessKeyBarcode', () => {
    it('gera uma imagem PNG a partir da chave de 44 digitos', async () => {
      const png = await renderAccessKeyBarcode(NFE_KEY);

      expect(png.subarray(1, 4).toString()).toBe('PNG');
      expect(png.length).toBeGreaterThan(100);
    });

    it('aceita chave ja formatada com separadores', async () => {
      const png = await renderAccessKeyBarcode(formatAccessKey(NFE_KEY));

      expect(png.subarray(1, 4).toString()).toBe('PNG');
    });

    it('aceita a chave de 50 digitos da NFS-e', async () => {
      const png = await renderAccessKeyBarcode(NFSE_KEY);

      expect(png.subarray(1, 4).toString()).toBe('PNG');
    });

    it('recusa chave com numero errado de digitos', async () => {
      // Um código de barras truncado num documento fiscal é pior que a
      // ausência dele: parece válido até alguém tentar ler.
      await expect(renderAccessKeyBarcode('123')).rejects.toThrow(/44 digitos/);
    });

    it('recusa chave vazia', async () => {
      await expect(renderAccessKeyBarcode('')).rejects.toThrow(/44 digitos/);
    });

    it('recusa comprimento intermediario entre os dois validos', async () => {
      // 47 digitos nao e nem NF-e nem NFS-e — aceitar seria produzir codigo
      // que nenhum leitor fiscal reconhece.
      await expect(renderAccessKeyBarcode('1'.repeat(47))).rejects.toThrow(
        /44 digitos/,
      );
    });
  });

  describe('renderVerificationQrCode', () => {
    it('gera PNG a partir da URL de consulta', async () => {
      const png = await renderVerificationQrCode(
        'https://www.nfse.gov.br/consultapublica?chave=' + NFE_KEY,
      );

      expect(png.subarray(1, 4).toString()).toBe('PNG');
    });
  });

  describe('formatAccessKey', () => {
    it('agrupa a chave de 4 em 4 — conferir 44 digitos a olho e inviavel sem isso', () => {
      expect(formatAccessKey('12345678')).toBe('1234 5678');
    });

    it('remove separadores antes de reagrupar, sem duplicar espacos', () => {
      expect(formatAccessKey('1234 5678')).toBe('1234 5678');
    });

    it('nao perde digitos quando o total nao e multiplo de 4', () => {
      expect(formatAccessKey('123456789').replace(/\s/g, '')).toBe('123456789');
    });
  });
});
