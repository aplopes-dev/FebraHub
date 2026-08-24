import { join } from 'path';

/// Caminho do schema oficial da NF-e 4.00 (fornecido pelo usuário —
/// nfe_v4.00.xsd inclui leiauteNFe_v4.00.xsd, que importa/inclui
/// xmldsig-core-schema_v1.01.xsd + tiposBasico_v4.00.xsd +
/// DFeTiposBasicos_v1.00.xsd, todos no mesmo diretório).
///
/// Resolvido via `process.cwd()` (não `__dirname`) porque `__dirname` aponta
/// para profundidades diferentes em `src/` (ts-jest) vs. `dist/src/` (build
/// compilado) — `cwd()` é estável em ambos os casos, já que tanto
/// `pnpm --filter @citybox/fiscal-api dev/test` quanto o `CMD` do Dockerfile
/// sempre rodam a partir da raiz do pacote (`services/fiscal-api/`).
/// Sobrescrevível via `NFE_XSD_PATH` para deployments com layout diferente.
export const NFE_XSD_PATH =
  process.env.NFE_XSD_PATH ??
  join(process.cwd(), 'resources/xsd/nfe/nfe_v4.00.xsd');
