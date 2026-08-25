# Cadeia de certificados ICP-Brasil (`icp-brasil.pem`)

Coloque aqui o bundle **ICP-Brasil** (raiz + intermediárias) no arquivo
`icp-brasil.pem` **antes de transmitir em produção**.

Este bundle é usado para validar o certificado **apresentado pelo servidor da
SEFAZ/SVRS** durante o handshake TLS mútuo — não é o certificado A1 do emitente.

Sem este arquivo o handshake falha com `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`,
porque o bundle padrão do Node (raízes da Mozilla) não inclui a ICP-Brasil e o
servidor da SEFAZ envia apenas a folha e a intermediária.

O caminho pode ser sobrescrito pela variável de ambiente `SEFAZ_CA_BUNDLE_PATH`.
Por padrão o código resolve `resources/ca/icp-brasil.pem` a partir de
`process.cwd()` (ver `ca-bundle.ts`).
