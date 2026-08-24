import { verticalPermission } from '@/lib/store-routing';
import { findNavByPathAccessible, verticalBasePath } from './navigation-utils';
import { canAccessWithAnyOf } from './permissions-utils';
import type { VerticalNavModule, VerticalNavPermissionsApi } from './types';

export function createStubNavPermissions(verticalId: string): VerticalNavPermissionsApi {
  const basePath = verticalBasePath(verticalId);
  const viewPermission = verticalPermission(verticalId);

  function hasVerticalAccess(permissions: string[]): boolean {
    return canAccessWithAnyOf(permissions, [viewPermission]);
  }

  return {
    canAccessWithAnyOf,

    filterNavModules(modules: VerticalNavModule[], permissions: string[]) {
      if (!hasVerticalAccess(permissions)) return [];
      return modules;
    },

    canAccessPath(pathname: string, modules: VerticalNavModule[], permissions: string[]) {
      if (!hasVerticalAccess(permissions)) return false;
      return findNavByPathAccessible(pathname, modules, basePath) !== null;
    },

    canWritePath(pathname: string, modules: VerticalNavModule[], permissions: string[]) {
      if (!hasVerticalAccess(permissions)) return false;
      return findNavByPathAccessible(pathname, modules, basePath) !== null;
    },
  };
}
