import type { VerticalNavLeaf, VerticalNavModule } from './types';

/**
 * Base das rotas do backoffice. App dedicado à clínica — servido na raiz, sem
 * prefixo de vertical (no ERP multi-vertical isto era `/${verticalId}`).
 */
export const VERTICAL_BASE_PATH = '/';

export function verticalBasePath(_verticalId?: string): string {
  return VERTICAL_BASE_PATH;
}

export type FindNavOptions = {
  defaultModuleId?: string;
  defaultLeafId?: string;
  /** Quando true, leaves com disabled não entram no match (roteamento/permissões). */
  skipDisabled?: boolean;
};

export function findNavByPath(
  pathname: string,
  modules: VerticalNavModule[],
  basePath: string,
  options?: FindNavOptions,
): { module: VerticalNavModule; leaf: VerticalNavLeaf } | null {
  let best:
    | { module: VerticalNavModule; leaf: VerticalNavLeaf; matchedPathLength: number }
    | null = null;
  for (const mod of modules) {
    for (const leaf of mod.children) {
      if (options?.skipDisabled && leaf.disabled) continue;
      const candidatePaths = [leaf.path, ...(leaf.aliases ?? [])];
      const matchedPath = candidatePaths
        .filter((candidatePath) => {
          const matchesExact = pathname === candidatePath;
          const matchesNested =
            candidatePath !== basePath &&
            (pathname.startsWith(`${candidatePath}/`) ||
              pathname.startsWith(`${candidatePath}?`));
          return matchesExact || matchesNested;
        })
        .sort((left, right) => right.length - left.length)[0];
      if (!matchedPath) continue;
      // Prefere o match mais específico (path mais longo). Evita que um leaf
      // pai (ex.: "/food/sistema") fique ativo junto de um filho mais profundo
      // (ex.: "/food/sistema/equipe").
      if (!best || matchedPath.length > best.matchedPathLength) {
        best = { module: mod, leaf, matchedPathLength: matchedPath.length };
      }
    }
  }
  if (best) return { module: best.module, leaf: best.leaf };

  const normalized = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
  if (normalized === basePath) {
    const defaultMod = options?.defaultModuleId
      ? modules.find((m) => m.id === options.defaultModuleId)
      : modules[0];
    const defaultLeaf = options?.defaultLeafId
      ? defaultMod?.children.find((c) => c.id === options.defaultLeafId)
      : defaultMod?.children[0];
  const resolvedDefaultLeaf =
    defaultLeaf && (!options?.skipDisabled || !defaultLeaf.disabled)
      ? defaultLeaf
      : defaultMod?.children.find((c) => !c.disabled);
    if (defaultMod && resolvedDefaultLeaf) {
      return { module: defaultMod, leaf: resolvedDefaultLeaf };
    }
  }

  return null;
}

/** Resolve path para roteamento/permissões — ignora leaves desabilitados. */
export function findNavByPathAccessible(
  pathname: string,
  modules: VerticalNavModule[],
  basePath: string,
  options?: Omit<FindNavOptions, 'skipDisabled'>,
) {
  return findNavByPath(pathname, modules, basePath, { ...options, skipDisabled: true });
}

/** Primeiro leaf habilitado de um módulo (ordem do menu). */
export function firstEnabledLeafInModule(mod: VerticalNavModule): VerticalNavLeaf | null {
  return mod.children.find((leaf) => !leaf.disabled) ?? null;
}

/** Redirect alvo quando o pathname bate um leaf desabilitado. */
export function redirectPathForDisabledNavPath(
  pathname: string,
  modules: VerticalNavModule[],
  basePath: string,
  options?: FindNavOptions,
): string | null {
  const hit = findNavByPath(pathname, modules, basePath, options);
  if (!hit?.leaf.disabled) return null;
  const enabled = firstEnabledLeafInModule(hit.module);
  return enabled?.path ?? null;
}

export function activeModuleId(
  pathname: string,
  modules: VerticalNavModule[],
  basePath: string,
  options?: FindNavOptions,
): string {
  const hit = findNavByPath(pathname, modules, basePath, options);
  if (hit) return hit.module.id;
  // basePath pode ser "/" (app dedicado) — evita gerar prefixo com barra dupla.
  const normalizedBase = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
  for (const mod of modules) {
    const prefix = `${normalizedBase}/${mod.id}`;
    if (pathname.startsWith(prefix)) return mod.id;
  }
  return modules[0]?.id ?? 'dashboard';
}
