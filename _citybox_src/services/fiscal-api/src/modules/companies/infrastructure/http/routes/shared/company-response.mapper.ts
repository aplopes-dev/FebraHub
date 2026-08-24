import type { Company } from '../../../../domain/entities/company.entity';

export function toCompanyResponse(company: Company) {
  return {
    id: company.id,
    storeId: company.storeId,
    cnpj: company.cnpj,
    legalName: company.legalName,
    tradeName: company.tradeName,
    stateRegistration: company.stateRegistration,
    municipalRegistration: company.municipalRegistration,
    taxRegime: company.taxRegime,
    cityCodeIbge: company.cityCodeIbge,
    uf: company.uf,
    address: company.address,
    defaultEnvironment: company.defaultEnvironment,
    // Sem estes dois a resposta escondia justamente o que decide se a emissao
    // passa: NFS-e recusa com 422 sem `nationalNfseEnabled`, e a Bahia recusa
    // a NF-e com 486 sem o escritorio de contabilidade.
    nationalNfseEnabled: company.nationalNfseEnabled,
    accountingOfficeDocument: company.accountingOfficeDocument,
    /// Booleano, **nunca o CSC**. Pelo mesmo motivo dos dois acima, quem opera
    /// precisa saber se a emissao de cupom esta destravada — mas nem o token
    /// nem o `cscId` saem por aqui. Nao ha endpoint de leitura do CSC.
    cscConfigured: company.hasCsc(),
    // Justificativas padrão (spec erp/023, N6) — sem segredo aqui, expostas
    // em claro (é texto que o próprio Emitente escreveu e vai pro XML).
    inutilizationJustification: company.inutilizationJustification,
    cancellationJustification: company.cancellationJustification,
    active: company.active,
    createdAt: company.createdAt,
    updatedAt: company.updatedAt,
  };
}
