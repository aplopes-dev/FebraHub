import type { NfseItemDto } from '../../domain/validators/nfse-item.zod.validator';
import type { CustomerAddress } from '../../../fiscal-documents/domain/entities/customer.entity';

export type IssueNfseCustomerDto = {
  documentType: 'CPF' | 'CNPJ';
  document: string;
  name: string;
  email?: string | null;
  address?: CustomerAddress | null;
};

export type IssueNfseServiceDto = {
  serviceDescription: string;
  /// Formato "NN.NN" (LC 116/2003) — ver `dps-xml.builder.ts` para a
  /// conversão para o código nacional de 6 dígitos exigido pelo XSD.
  municipalServiceCode: string;
  /// `cTribNac` (6 dígitos) — tabela NACIONAL, distinta da municipal. Sem ele
  /// o builder deriva do código municipal, derivação que o Sefin Nacional já
  /// rejeitou com `E0310`.
  nationalServiceCode?: string | null;
  issRate?: number | null;
  issWithheld: boolean;
  /// Exigibilidade do ISS (`tribISSQN`, spec erp/018): 1 tributável, 2 imunidade,
  /// 3 exportação, 4 não incidência. Resolvido pelo emissor a partir do Grupo de
  /// ISSQN. **Opcional, default '1'** no builder (não-regressão).
  tribISSQN?: '1' | '2' | '3' | '4';
};

export type IssueNfseDto = {
  /// Preenchido apenas por `SubstituteNfseUseCase`. Substituicao de NFS-e e
  /// uma EMISSAO com bloco `subst`, nao um evento postado — `POST
  /// /nfse/{chave}/eventos` recusa o `e105102` com `E1861`.
  substitution?: {
    substitutedAccessKey: string;
    reasonCode: '01' | '02' | '03' | '04' | '05' | '99';
    reasonText?: string;
  };
  companyId: string;
  sourceSystem: string;
  externalReference: string;
  idempotencyKey: string;
  environment?: 'HOMOLOGATION' | 'PRODUCTION';
  customer: IssueNfseCustomerDto;
  nfse: IssueNfseServiceDto;
  items: NfseItemDto[];
};

export type ConsultNfseDto = {
  fiscalDocumentId: string;
};

export type CancelNfseDto = {
  fiscalDocumentId: string;
  justification: string;
};

export type SubstituteNfseDto = {
  /// Nota a ser substituída.
  fiscalDocumentId: string;
  /// Dados completos da nota nova — mesma forma da emissão, porque é uma
  /// emissão de verdade: o Padrão Nacional gera uma NFS-e independente e o
  /// vínculo com a original vive no evento, não na nota.
  replacement: IssueNfseDto;
  /// `TSCodJustSubst` — lista PRÓPRIA da substituição, dois dígitos.
  reasonCode: '01' | '02' | '03' | '04' | '05' | '99';
  /// `xMotivo`, opcional em `e105102` (15–255 quando informado).
  reasonText?: string;
  /// Bloqueio de ofício do município. Informado pelo chamador enquanto não há
  /// consulta automatizada — ver `nfse-substitution-eligibility.ts`.
  hasOfficialBlock?: boolean;
};
