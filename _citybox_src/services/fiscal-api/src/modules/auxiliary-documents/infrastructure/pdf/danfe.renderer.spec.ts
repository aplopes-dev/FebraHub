import { DanfeRenderer } from './danfe.renderer';
import { buildAuthorizedNfeXml } from '../../tests/fixtures/authorized-nfe-xml';
import { extractPdfText } from '../../tests/pdf-text';

describe('DanfeRenderer', () => {
  const renderer = new DanfeRenderer();

  it('NUNCA passa pathLogo a biblioteca (research.md R10)', async () => {
    // ⚠️ Trava de leiaute fiscal, não de estilo.
    //
    // `pathLogo` é desenhado dentro do quadro "IDENTIFICAÇÃO DO EMITENTE"
    // (`get-dados-emitente.js:66`) — a caixa que declara QUEM EMITIU a nota.
    // Uma logo nossa ali afirmaria que o Citybox é o emitente, num documento
    // que acompanha mercadoria e vai para fiscalização.
    //
    // Desde a spec 029 (FR-014) o DANFE também não leva marca de fornecedor no
    // rodapé — a estampagem Citybox foi removida. Este teste continua travando
    // a restrição de leiaute do quadro do emitente.
    const lib = await import('@alexssmusica/node-pdf-nfe');
    const spy = jest.spyOn(lib, 'gerarPDF');
    const { xml } = buildAuthorizedNfeXml();

    await renderer.render({
      authorizedXml: Buffer.from(xml, 'utf-8'),
      isCancelled: false,
    });

    const options = spy.mock.calls[0]?.[1];
    expect(options).toBeDefined();
    expect(options).not.toHaveProperty('pathLogo');
    spy.mockRestore();
  });

  it('gera um PDF valido a partir do XML autorizado', async () => {
    const { xml } = buildAuthorizedNfeXml();

    const pdf = await renderer.render({
      authorizedXml: Buffer.from(xml, 'utf-8'),
      isCancelled: false,
    });

    expect(pdf).toBeInstanceOf(Buffer);
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pdf.length).toBeGreaterThan(1000);
  });

  it('imprime a chave de acesso da nota (FR-004, SC-002)', async () => {
    const { xml, accessKey } = buildAuthorizedNfeXml();

    const pdf = await renderer.render({
      authorizedXml: Buffer.from(xml, 'utf-8'),
      isCancelled: false,
    });

    // O DANFE mostra a chave formatada em grupos de 4. Comparar só os dígitos
    // evita depender do separador escolhido pelo leiaute.
    const digits = (await extractPdfText(pdf)).replace(/\D/g, '');
    expect(digits).toContain(accessKey);
  });

  it('imprime o protocolo de autorizacao (SC-002)', async () => {
    const { xml, protocol } = buildAuthorizedNfeXml();

    const pdf = await renderer.render({
      authorizedXml: Buffer.from(xml, 'utf-8'),
      isCancelled: false,
    });

    expect((await extractPdfText(pdf)).replace(/\D/g, '')).toContain(protocol);
  });

  it('imprime a razao social do emitente', async () => {
    const { xml } = buildAuthorizedNfeXml();

    const pdf = await renderer.render({
      authorizedXml: Buffer.from(xml, 'utf-8'),
      isCancelled: false,
    });

    expect(await extractPdfText(pdf)).toContain('RR EMPREENDIMENTOS');
  });

  it('produz documento diferente quando a nota esta cancelada (FR-006)', async () => {
    const { xml } = buildAuthorizedNfeXml();
    const input = { authorizedXml: Buffer.from(xml, 'utf-8') };

    const normal = await renderer.render({ ...input, isCancelled: false });
    const cancelled = await renderer.render({ ...input, isCancelled: true });

    // Não assere o texto exato da marcação: ele é do leiaute da biblioteca, e
    // fixá-lo aqui quebraria numa atualização sem que nada estivesse errado. O
    // que importa é que a distinção EXISTE — um documento de nota cancelada
    // idêntico ao de nota válida é o defeito real.
    const normalText = await extractPdfText(normal);
    const cancelledText = await extractPdfText(cancelled);
    expect(cancelledText).not.toBe(normalText);
    expect(cancelledText.toUpperCase()).toContain('CANCEL');
  });

  it('nao deixa vazar dados do banco — so o XML entra', async () => {
    // Garantia de FR-008 no nível do renderizador: a única entrada é o XML.
    // Se o nome do emitente mudar no XML, muda no PDF; se mudar só no cadastro,
    // não há por onde chegar aqui.
    const { xml } = buildAuthorizedNfeXml({
      emitter: {
        cnpj: '50031609000104',
        legalName: 'OUTRA RAZAO SOCIAL SA',
        stateRegistration: '204887605',
        taxRegimeCode: '1',
        address: {
          street: 'Rua Marques de Paranagua',
          number: '100',
          district: 'Centro',
          cityCodeIbge: '2913606',
          cityName: 'Ilheus',
          uf: 'BA',
          zipCode: '45650-000',
        },
      },
    });

    const pdf = await renderer.render({
      authorizedXml: Buffer.from(xml, 'utf-8'),
      isCancelled: false,
    });

    const text = await extractPdfText(pdf);
    expect(text).toContain('OUTRA RAZAO SOCIAL');
    expect(text).not.toContain('RR EMPREENDIMENTOS');
  });

  it('gera conteudo identico para o mesmo XML (FR-008)', async () => {
    const { xml } = buildAuthorizedNfeXml();
    const input = {
      authorizedXml: Buffer.from(xml, 'utf-8'),
      isCancelled: false,
    };

    const first = await renderer.render(input);
    const second = await renderer.render(input);

    // Conteúdo textual, não bytes: PDF carrega data de criação e dois arquivos
    // do mesmo conteúdo nunca batem byte a byte — o que não indica defeito.
    expect(await extractPdfText(second)).toBe(await extractPdfText(first));
  });
});
