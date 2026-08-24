import { buildXml } from '../../../../shared/infra/fiscal-xml/xml-builder';
import { buildDpsId } from './dps-id';
import { NFSE_LEIAUTE_VERSION } from './nfse-leiaute-version';

export type DpsProvider = {
  cnpj: string;
  municipalRegistration?: string | null;
  legalName: string;
  cityCodeIbge: string;
  /// TSOpSimpNac: 1 = não optante, 3 = optante ME/EPP. MEI (2) não é
  /// representável a partir de `Company.taxRegime` hoje — evolução futura.
  simplesNacionalOption: '1' | '3';
};

export type DpsCustomer = {
  documentType: 'CPF' | 'CNPJ';
  document: string;
  name?: string | null;
};

/// Substituicao de NFS-e.
///
/// ⚠️ NAO e um evento postado. `POST /nfse/{chave}/eventos` recusa o `e105102`
/// com `E1861` — verificado contra o servico real em 2026-08-07. O caminho e
/// emitir uma DPS com este bloco, e o Sefin gera o evento de cancelamento por
/// substituicao sozinho.
export type DpsSubstitutionInput = {
  /// Chave de acesso (50 digitos) da NFS-e substituida — nao o `Id` da DPS.
  substitutedAccessKey: string;
  /// `TSCodJustSubst`: lista propria de dois digitos, disjunta da de
  /// cancelamento.
  reasonCode: '01' | '02' | '03' | '04' | '05' | '99';
  /// `TSMotivo` (15-255) quando informado; opcional no bloco.
  reasonText?: string;
};

export type DpsServiceInput = {
  description: string;
  /// Formato "NN.NN" (LC 116/2003, ex.: "17.02") — convertido para o código
  /// nacional de 6 dígitos (cTribNac) exigido pelo schema.
  municipalServiceCode: string;
  /// Código de tributação NACIONAL (`cTribNac`, 6 dígitos) — tabela distinta
  /// da municipal. Quando ausente, é derivado do código municipal; ver
  /// `toCTribNac` para a ressalva.
  nationalServiceCode?: string | null;
  /// Alíquota do ISS em fração decimal (ex.: 0.05 = 5%) — convertida para
  /// percentual (TSDec1V2, "5.00") no XML. Opcional: municípios já
  /// parametrizados no Sistema Nacional NFS-e não precisam informá-la.
  issRate?: number | null;
  issWithheld: boolean;
  /// Tributação do ISSQN (`tribISSQN`, `TSTribISSQN`, spec erp/018): 1 = operação
  /// tributável (exigível), 2 = imunidade, 3 = exportação de serviço, 4 = não
  /// incidência. **Opcional, default `'1'`** — caller antigo (sem o campo) segue
  /// emitindo tributável (não-regressão). O erp-api resolve do Grupo de ISSQN.
  tribISSQN?: '1' | '2' | '3' | '4';
  totalValue: number;
};

export type BuildDpsXmlInput = {
  environment: 'HOMOLOGATION' | 'PRODUCTION';
  provider: DpsProvider;
  customer: DpsCustomer;
  service: DpsServiceInput;
  series: string;
  number: string;
  /// Presente APENAS quando a DPS substitui outra nota.
  substitution?: DpsSubstitutionInput;
  /// Informação complementar já resolvida pelo emissor (spec erp/017). ⚠️ A NFS-e
  /// nacional **não** tem `infAdic`/`infAdFisco` — só `serv/infoCompl/xInfComp`
  /// (interesse do contribuinte, análogo do `infCpl`, máx. 2000). Ausente/vazia →
  /// `infoCompl` **não** é emitido (não-regressão). Ver plan D10.
  additionalInfo?: { infCpl?: string };
  emissionDate?: Date;
};

export type BuiltDpsXml = {
  xml: Buffer;
  dpsId: string;
};

const DPS_SCHEMA_VERSION = NFSE_LEIAUTE_VERSION;

/// Teto do XSD para `xInfComp` (`TSDescInfCompl`).
const X_INF_COMP_MAX = 2000;

/// Rejeita caracteres de controle C0 ilegais em XML 1.0 (§2.2): permitidos só TAB
/// (9), LF (10) e CR (13); ilegais 0–8, 11, 12, 14–31. Emiti-los produziria uma
/// DPS mal-formada, que o Sefin pode recusar. Defesa antes de transmitir (a
/// `erp-api` também recusa no cadastro). Por código de caractere para não esbarrar
/// no lint `no-control-regex`.
function assertXmlSafeText(value: string, field: string): void {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    const isIllegal =
      code <= 8 || code === 11 || code === 12 || (code >= 14 && code <= 31);
    if (isIllegal) {
      throw new Error(
        `${field} contém caractere de controle inválido para XML 1.0.`,
      );
    }
  }
}

function formatMonetary(value: number): string {
  return value.toFixed(2);
}

/// Monta `serv/infoCompl` com `xInfComp` (spec erp/017, plan D10). Retorna `{}`
/// (grupo omitido) quando vazio — não-regressão: DPS sem informação sai idêntica
/// à de hoje. Reforça o teto do XSD (o emissor já valida a soma; aqui é defesa).
function buildInfoComplXml(
  info: { infCpl?: string } | undefined,
): Record<string, unknown> {
  const xInfComp = info?.infCpl?.trim();
  if (!xInfComp) return {};
  if (xInfComp.length > X_INF_COMP_MAX) {
    throw new Error(
      `xInfComp excede o limite de ${X_INF_COMP_MAX} caracteres do XSD.`,
    );
  }
  assertXmlSafeText(xInfComp, 'xInfComp');
  return { infoCompl: { xInfComp } };
}

/// `dhEmi`/TSDateTimeUTC exige offset de fuso em horas completas (`-03:00`,
/// nunca `Z`) sem milissegundos — mesmo formato de `nfe-xml.builder.ts`
/// (Ilhéus/BA está em UTC-3 o ano todo, Brasil não usa mais horário de
/// verão desde 2019).
function toDpsDateTime(date: Date): string {
  const localOffsetMs = 3 * 60 * 60 * 1000;
  const local = new Date(date.getTime() - localOffsetMs);
  return `${local.toISOString().slice(0, 19)}-03:00`;
}

function toDpsDate(date: Date): string {
  const localOffsetMs = 3 * 60 * 60 * 1000;
  const local = new Date(date.getTime() - localOffsetMs);
  return local.toISOString().slice(0, 10);
}

/// Resolve o `cTribNac`. **Prefira sempre o código informado explicitamente.**
///
/// A derivação a partir do código municipal (concatenar desdobro "00") é
/// best-effort e sabidamente falha: o Sefin Nacional rejeitou `010600` com
/// `E0310` — "o código de tributação nacional informado não existe conforme a
/// lista de serviços nacional" (verificado em produção restrita, 2026-08-06).
/// Municipal e nacional são tabelas distintas, e nem todo par item.subitem tem
/// desdobro "00".
///
/// O fallback permanece para não quebrar quem já chama sem o campo, mas quem
/// integra deve informar `nationalServiceCode`.
function resolveCTribNac(service: DpsServiceInput): string {
  const explicito = service.nationalServiceCode?.replace(/\D/g, '');
  if (explicito) return explicito;

  const digits = service.municipalServiceCode.replace(/\D/g, '');
  return `${digits}00`;
}

function toPersonXml(person: DpsCustomer) {
  return {
    [person.documentType]: person.document.replace(/\D/g, ''),
    ...(person.name ? { xNome: person.name } : {}),
  };
}

/// Constrói o XML da DPS (Declaração de Prestação de Serviços, Padrão
/// Nacional NFS-e v1.01) a partir dos dados já validados/persistidos. Cobre
/// os elementos exigidos pelo schema oficial (`DPS_v1.01.xsd` +
/// `tiposComplexos_v1.01.xsd`) para uma prestação de serviço simples,
/// doméstica, sem intermediário — não implementa ainda campos opcionais
/// avançados (obra, evento, comércio exterior, substituição, IBS/CBS) que
/// não são exigidos pelo XSD (`minOccurs="0"`) e ficam para evolução futura
/// conforme necessidade real.
export function buildDpsXml(input: BuildDpsXmlInput): BuiltDpsXml {
  const emissionDate = input.emissionDate ?? new Date();

  const dpsId = buildDpsId({
    cityCodeIbge: input.provider.cityCodeIbge,
    documentType: 'CNPJ',
    document: input.provider.cnpj,
    series: input.series,
    number: input.number,
  });

  const dpsObject = {
    DPS: {
      '@xmlns': 'http://www.sped.fazenda.gov.br/nfse',
      '@versao': DPS_SCHEMA_VERSION,
      infDPS: {
        '@Id': dpsId,
        tpAmb: input.environment === 'PRODUCTION' ? '1' : '2',
        dhEmi: toDpsDateTime(emissionDate),
        verAplic: 'citybox-fiscal-v1',
        serie: input.series.padStart(5, '0'),
        nDPS: String(Number(input.number)),
        dCompet: toDpsDate(emissionDate),
        // 1 = Prestador — único emitente suportado no v1 (Tomador/
        // Intermediário emitindo a DPS é evolução futura).
        tpEmit: '1',
        cLocEmi: input.provider.cityCodeIbge,
        // `xs:sequence`: `subst` fica entre `cLocEmi` e `prest`. Fora de ordem
        // o XML e recusado por schema antes da regra de negocio.
        ...(input.substitution
          ? {
              subst: {
                chSubstda: input.substitution.substitutedAccessKey.replace(
                  /\D/g,
                  '',
                ),
                cMotivo: input.substitution.reasonCode,
                ...(input.substitution.reasonText
                  ? { xMotivo: input.substitution.reasonText }
                  : {}),
              },
            }
          : {}),
        prest: {
          CNPJ: input.provider.cnpj.replace(/\D/g, ''),
          ...(input.provider.municipalRegistration
            ? { IM: input.provider.municipalRegistration }
            : {}),
          // `xNome` do prestador NAO vai: com `tpEmit=1` o emitente E o
          // prestador, e o Sefin ja conhece a razao social pelo CNPJ. Mandar
          // e rejeicao `E0121` — verificado contra o servico real em
          // 2026-08-07. A regra vale so para o prestador; o tomador segue com
          // nome, porque dele o orgao pode nao ter cadastro.
          regTrib: {
            opSimpNac: input.provider.simplesNacionalOption,
            // `regApTribSN` e `minOccurs="0"` no XSD, mas o Sefin o EXIGE
            // quando `opSimpNac = 3` (optante ME/EPP) — rejeicao `E0166`,
            // verificada contra o servico real em 2026-08-07.
            //
            // `1` = tributos federais E municipal apurados pelo SN. E o caso de
            // quem nao ultrapassou sublimite, que e a situacao da esmagadora
            // maioria. Quem ultrapassou usa `2` ou `3` — evolucao futura, que
            // exige um campo no cadastro da empresa para nao ser adivinhado.
            ...(input.provider.simplesNacionalOption === '3'
              ? { regApTribSN: '1' }
              : {}),
            // 0 = Nenhum — regimes especiais (cooperativa, notário, etc.)
            // ficam para evolução futura.
            regEspTrib: '0',
          },
        },
        toma: toPersonXml(input.customer),
        serv: {
          locPrest: {
            cLocPrestacao: input.provider.cityCodeIbge,
          },
          cServ: {
            cTribNac: resolveCTribNac(input.service),
            xDescServ: input.service.description,
          },
          // `infoCompl/xInfComp` entra após `cServ` na sequência do XSD (spec erp/017,
          // plan D10). Omitido quando não há texto → XML idêntico ao de hoje.
          ...buildInfoComplXml(input.additionalInfo),
        },
        valores: {
          vServPrest: {
            vServ: formatMonetary(input.service.totalValue),
          },
          trib: {
            tribMun: {
              // `tribISSQN` vem do Grupo de ISSQN resolvido pelo emissor (spec
              // erp/018): 1 = tributável, 2 = imunidade, 4 = não incidência (3 =
              // exportação exige dados extras — ainda não emitida). Default '1'
              // (não-regressão: caller sem o campo segue tributável).
              tribISSQN: input.service.tribISSQN ?? '1',
              tpRetISSQN: input.service.issWithheld ? '2' : '1',
              // Aliquota SO quando ha retencao. Sem retencao quem a define e o
              // municipio, e declara-la e rejeicao `E0625` — verificado contra
              // o servico real em 2026-08-07.
              //
              // `issRate` ja chega em percentual (0-100), nao fracao (0-1) —
              // spec erp/030, B3: o erp-api resolve `issRate: group.issqnRate`
              // direto, sem conversao, e `issqnRate` e validado/exibido como
              // percentual em todo o resto da cadeia (cadastro, tela de
              // emissao). O `* 100` daqui multiplicava por 100 de novo,
              // gerando `pAliq` 100x maior que o real quando havia retencao
              // (achado ao investigar "0.05%" exibido na tela — a exibicao
              // estava certa, este calculo e que estava errado).
              ...(input.service.issWithheld && input.service.issRate != null
                ? { pAliq: input.service.issRate.toFixed(2) }
                : {}),
            },
            // `totTrib` e um `xs:choice` entre valor (`vTotTrib`), percentual
            // (`pTotTrib`) e indicador (`indTotTrib`), e o grupo e OBRIGATORIO
            // pelo schema.
            //
            // Para ME/EPP o **indicador** e proibido (`E0712`, verificado contra
            // o servico real em 2026-08-07): optante do Simples tem de informar
            // valor, nao dizer "nao informo". Entao usa `vTotTrib` decomposto.
            //
            // ⚠️ Os valores saem ZERADOS: o calculo de transparencia tributaria
            // (Lei 12.741/2012) exige tabela IBPT por NBS/municipio, que a API
            // nao tem. E declaracao aproximada por lei, mas zero nao e o valor
            // correto — pendencia conhecida, nao decisao.
            totTrib:
              input.provider.simplesNacionalOption === '3'
                ? {
                    vTotTrib: {
                      vTotTribFed: '0.00',
                      vTotTribEst: '0.00',
                      vTotTribMun: '0.00',
                    },
                  }
                : { indTotTrib: '0' },
          },
        },
      },
    },
  };

  return { xml: buildXml(dpsObject), dpsId };
}
