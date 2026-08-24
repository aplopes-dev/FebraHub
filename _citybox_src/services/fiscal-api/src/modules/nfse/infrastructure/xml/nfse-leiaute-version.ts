/// Versão do leiaute nacional da NFS-e adotada por **toda** a montagem de XML
/// (DPS e eventos).
///
/// Existe como constante única porque os builders declaravam a versão cada um
/// por conta própria: nada impedia que divergissem, e a divergência só
/// apareceria como rejeição do órgão fiscal em produção.
///
/// ⚠️ Trocar este valor exige trocar os XSD em `resources/xsd/nfse/<versão>/`
/// na mesma operação — `nfse-leiaute-version.spec.ts` falha se as duas coisas
/// se separarem. Leiaute vencido derruba emissão sem nenhuma mudança de código,
/// então a checagem é automática e não depende de alguém lembrar.
export const NFSE_LEIAUTE_VERSION = '1.01';

/// Diretório dos XSD correspondentes. Derivado da versão, não escrito à mão,
/// para que apontar para uma pasta que não existe falhe cedo.
export const NFSE_XSD_DIRECTORY = `resources/xsd/nfse/${NFSE_LEIAUTE_VERSION}`;
