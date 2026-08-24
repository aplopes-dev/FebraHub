import { globSync, readFileSync } from 'fs';
import path from 'path';
import { resolvePermissions } from './permissions';

/// Auditoria estática do mapa de permissões (spec erp/023, N1).
///
/// **Achado que originou este teste:** `fiscal.sequences.manage` era exigida
/// por 4 rotas de escrita de `fiscal-sequences` sem estar concedida a
/// NINGUÉM em `ROLE_PERMISSIONS` — só `platform_admin` (que passa por cima
/// via `platform.admin`, antes de checar a lista) conseguia usar essas
/// rotas. Ao escrever este teste apareceu uma SEGUNDA permissão fantasma
/// (`fiscal.documents.read`, também corrigida nesta feature) — prova de que
/// o erro é uma classe inteira (grafia divergindo entre decorator e mapa),
/// não um caso isolado, e que só grep manual não pega todos.
///
/// **Por que regex sobre o código-fonte, não reflection em runtime.** Rodar
/// o Nest inteiro para inspecionar metadata de rota é mais lento e frágil
/// (precisaria montar o `TestingModule` com todas as dependências de cada
/// controller). Uma varredura textual de `@RequirePermission('...')` é
/// suficiente — o decorator só aceita um literal de string (nunca uma
/// variável dinâmica, confirmado pelo uso real em todo o código), então a
/// regex não perde nenhum caso.
describe('Mapa de permissões da fiscal-api — exaustividade', () => {
  const SRC_ROOT = path.resolve(__dirname, '../../../..');

  function extractRequiredPermissions(): Set<string> {
    const files = globSync('**/*.route.ts', { cwd: SRC_ROOT });
    const found = new Set<string>();
    const pattern = /@RequirePermission\(\s*['"]([^'"]+)['"]\s*\)/g;
    for (const relativeFile of files) {
      const content = readFileSync(path.join(SRC_ROOT, relativeFile), 'utf8');
      for (const match of content.matchAll(pattern)) {
        found.add(match[1]);
      }
    }
    return found;
  }

  it('toda permissão usada em @RequirePermission é concedida por pelo menos um papel', () => {
    const required = extractRequiredPermissions();
    expect(required.size).toBeGreaterThan(0); // sanity: a regex achou algo

    // Simula todo papel conhecido (não `platform_admin`, que sempre passa
    // por `platform.admin` antes da checagem — o teste é sobre quem
    // DEPENDE da lista de permissões, não sobre o bypass).
    const grantedByFiscalOperator = new Set(
      resolvePermissions({ roles: ['fiscal_operator'] }),
    );
    const grantedByPlatformAdmin = new Set(
      resolvePermissions({ roles: ['platform_admin'] }),
    );

    const orphaned = [...required].filter(
      (permission) =>
        !grantedByFiscalOperator.has(permission) &&
        !grantedByPlatformAdmin.has(permission),
    );

    expect(orphaned).toEqual([]);
  });
});
