import type { VerticalManifest } from './types';

type ManifestLoader = () => Promise<VerticalManifest>;

/** App dedicado — registra apenas a vertical Clínica. */
export const VERTICAL_MANIFEST_LOADERS: Record<string, ManifestLoader> = {
  clinic: () => import('@/features/clinic/manifest').then((m) => m.clinicManifest),
};

const manifestCache = new Map<string, VerticalManifest>();

export function isKnownVerticalId(verticalId: string): boolean {
  return verticalId in VERTICAL_MANIFEST_LOADERS;
}

export function listKnownVerticalIds(): string[] {
  return Object.keys(VERTICAL_MANIFEST_LOADERS);
}

export function getCachedVerticalManifest(verticalId: string): VerticalManifest | null {
  return manifestCache.get(verticalId) ?? null;
}

export async function loadVerticalManifest(verticalId: string): Promise<VerticalManifest | null> {
  const cached = manifestCache.get(verticalId);
  if (cached) return cached;

  const loader = VERTICAL_MANIFEST_LOADERS[verticalId];
  if (!loader) return null;

  const manifest = await loader();
  manifestCache.set(verticalId, manifest);
  return manifest;
}

/** @deprecated Preferir `loadVerticalManifest` ou `useVerticalManifest`. */
export function getVerticalDefinition(verticalId: string): VerticalManifest | null {
  return getCachedVerticalManifest(verticalId);
}

export function listVerticalDefinitions(): VerticalManifest[] {
  return [...manifestCache.values()];
}
