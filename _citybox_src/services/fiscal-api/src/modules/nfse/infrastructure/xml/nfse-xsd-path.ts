import { join } from 'path';

/// Caminho do schema oficial da DPS (Declaração de Prestação de Serviços,
/// Padrão Nacional NFS-e v1.01 — fornecido pelo usuário). Resolvido via
/// `process.cwd()` pelo mesmo motivo de `nfe-xsd-path.ts` (estável entre
/// ts-jest e o build compilado). Sobrescrevível via `NFSE_DPS_XSD_PATH`.
export const NFSE_DPS_XSD_PATH =
  process.env.NFSE_DPS_XSD_PATH ??
  join(process.cwd(), 'resources/xsd/nfse/DPS_v1.01.xsd');

/// Schema do Pedido de Registro de Evento (cancelamento e analise fiscal).
/// Aponta para `1.01/` — os XSD completos conferidos byte-a-byte contra a
/// publicacao oficial; a raiz de `xsd/nfse/` guarda so um subconjunto legado.
export const NFSE_PED_REG_EVENTO_XSD_PATH =
  process.env.NFSE_PED_REG_EVENTO_XSD_PATH ??
  join(process.cwd(), 'resources/xsd/nfse/1.01/pedRegEvento_v1.01.xsd');
