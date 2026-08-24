'use client';

import { usePathname } from 'next/navigation';
import { activeModuleId, findNavByPath, verticalBasePath } from '@/lib/vertical/navigation-utils';
import { getCachedVerticalManifest } from '@/lib/vertical/registry';
import { useVerticalManifest } from '@/lib/vertical/vertical-definition-context';
import type { VerticalManifest } from '@/lib/vertical/types';

export function resolveVerticalNavHit(manifest: VerticalManifest | null, pathname: string) {
  if (!manifest) return null;
  const basePath = verticalBasePath(manifest.id);
  return findNavByPath(
    pathname,
    manifest.navModules,
    basePath,
    manifest.navDefaults,
  );
}

export function useVerticalNavHit(verticalId: string) {
  const pathname = usePathname();
  const { manifest } = useVerticalManifest();
  const resolved = manifest ?? getCachedVerticalManifest(verticalId);
  return resolveVerticalNavHit(resolved, pathname);
}

export function useActiveVerticalModuleId(verticalId: string) {
  const pathname = usePathname();
  const { manifest } = useVerticalManifest();
  const resolved = manifest ?? getCachedVerticalManifest(verticalId);
  if (!resolved) return 'dashboard';
  return activeModuleId(
    pathname,
    resolved.navModules,
    verticalBasePath(verticalId),
    resolved.navDefaults,
  );
}
