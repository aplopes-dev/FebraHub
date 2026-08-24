import { gzipSync } from 'zlib';
import { parseSefinIssueResponse } from '../infrastructure/sefin-nacional-response';

describe('parseSefinIssueResponse', () => {
  const nfseXml =
    '<NFSe xmlns="http://www.sped.fazenda.gov.br/nfse"><infNFSe Id="NFS1"/></NFSe>';

  it('reads an authorized response, decompressing the returned NFS-e', () => {
    const outcome = parseSefinIssueResponse({
      chaveAcesso: '29260836698609000123',
      nfseXmlGZipB64: gzipSync(Buffer.from(nfseXml, 'utf-8')).toString(
        'base64',
      ),
    });

    expect(outcome).toEqual({
      status: 'AUTHORIZED',
      accessKey: '29260836698609000123',
      nfseXml,
    });
  });

  /// O pior erro possível aqui é ler rejeição como sucesso: a plataforma
  /// gravaria a nota como autorizada sem que ela exista no órgão fiscal.
  it('treats a response without access key or document as a rejection', () => {
    const outcome = parseSefinIssueResponse({
      codigo: 'E1226',
      mensagem: 'Estrutura descompactada mal formada.',
    });

    expect(outcome).toEqual({
      status: 'REJECTED',
      errorCode: 'E1226',
      errorMessage: 'Estrutura descompactada mal formada.',
    });
  });

  it('finds the official code inside an error list', () => {
    const outcome = parseSefinIssueResponse({
      erros: [
        { codigo: 'E1208', mensagem: 'Certificado difere da ICP-Brasil' },
      ],
    });

    expect(outcome).toMatchObject({
      status: 'REJECTED',
      errorCode: 'E1208',
    });
  });

  /// Resposta vazia ou inesperada não pode virar "autorizado" nem estourar —
  /// vira rejeição com mensagem que diz que não houve detalhamento.
  it('degrades to a described rejection for an unrecognised payload', () => {
    for (const payload of [null, undefined, {}, 'texto solto', 42]) {
      const outcome = parseSefinIssueResponse(payload);
      expect(outcome.status).toBe('REJECTED');
      expect((outcome as { errorMessage?: string }).errorMessage).toBeTruthy();
    }
  });
});
