"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Loader2, Plus, RefreshCw } from "lucide-react";
import { Button, Skeleton } from "@citybox/ui/atoms";
import { SearchInput } from "@citybox/ui/molecules";
import {
  PageHeader,
  FilterPopover,
  FilterPills,
  createEmptyValues,
  EmptyState,
} from "@citybox/ui/organisms";
import type { FilterValues } from "@citybox/ui/organisms";
import { extractApiMessage } from "@/lib/api-error";
import { useDebouncedUsersSearch } from "@/features/usuarios/hooks/use-debounced-users-search";
import { useUsersQuery } from "@/features/usuarios/hooks/use-users-query";
import {
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useResendInviteMutation,
} from "@/features/usuarios/hooks/use-user-mutations";
import { UsuariosGrid } from "@/features/usuarios/components/usuarios-grid";
import { AdminUserFormDialog } from "@/features/usuarios/components/admin-user-form-dialog";
import { USUARIOS_FILTER_GROUPS } from "@/features/usuarios/components/usuarios-filter";
import type {
  PlatformUser,
  PlatformRole,
  UserFormMode,
  CreateUserPayload,
  UpdateUserPayload,
} from "@/features/usuarios/types";

const DEFAULT_FILTERS: FilterValues = createEmptyValues(USUARIOS_FILTER_GROUPS);

export default function UsuariosPage() {
  const { search, setSearch, apiSearch } = useDebouncedUsersSearch();
  const [filters, setFilters] = useState<FilterValues>(DEFAULT_FILTERS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<UserFormMode>("create");
  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null);

  const listParams = useMemo(() => {
    const roleFilter = (filters.role as string[] | undefined) ?? [];
    return {
      perPage: 100,
      search: apiSearch,
      roles: roleFilter.length ? (roleFilter as PlatformRole[]) : undefined,
    };
  }, [apiSearch, filters.role]);

  const { users, isPending, isFetching, error, refetch } = useUsersQuery(listParams);
  const createMutation = useCreateUserMutation();
  const updateMutation = useUpdateUserMutation();
  const deleteMutation = useDeleteUserMutation();
  const resendMutation = useResendInviteMutation();

  const openCreateDialog = () => {
    setDialogMode("create");
    setSelectedUser(null);
    setDialogOpen(true);
  };

  const openEditDialog = (user: PlatformUser) => {
    setDialogMode("edit");
    setSelectedUser(user);
    setDialogOpen(true);
  };

  const handleDelete = async (user: PlatformUser) => {
    await deleteMutation.mutateAsync(user.id);
  };

  const handleSubmit = async (
    payload: CreateUserPayload | UpdateUserPayload,
    mode: UserFormMode,
    userId?: string,
  ) => {
    if (mode === "create") {
      await createMutation.mutateAsync(payload as CreateUserPayload);
      return;
    }
    if (userId) {
      await updateMutation.mutateAsync({
        id: userId,
        payload: payload as UpdateUserPayload,
      });
    }
  };

  const handleResendInvite = async (user: PlatformUser) => {
    await resendMutation.mutateAsync({
      id: user.id,
      label: user.email ?? user.displayName ?? "usuário",
    });
  };

  const isSaving =
    dialogMode === "create"
      ? createMutation.isPending
      : updateMutation.isPending;

  const deletingUserId = deleteMutation.isPending
    ? deleteMutation.variables
    : undefined;

  const resendingUserId = resendMutation.isPending
    ? resendMutation.variables?.id
    : undefined;

  const isFiltering = isFetching && !isPending;

  return (
    <div className="flex flex-col gap-5 p-2">
      <PageHeader
        title="Usuários"
        description="Gerencie a equipe interna com acesso ao painel CityBox."
        actions={
          <>
            <div className="relative w-64">
              <SearchInput
                id="usuarios-search"
                placeholder="Buscar por nome ou e-mail (mín. 3 letras)..."
                className="w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {isFiltering ? (
                <Loader2
                  className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
                  aria-hidden="true"
                />
              ) : null}
            </div>
            <FilterPopover
              groups={USUARIOS_FILTER_GROUPS}
              values={filters}
              onValuesChange={setFilters}
            />
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4" />
              Novo Usuário
            </Button>
          </>
        }
      />

      <FilterPills
        groups={USUARIOS_FILTER_GROUPS}
        values={filters}
        onValuesChange={setFilters}
      />

      {error ? (
        <EmptyState
          icon={<AlertCircle className="h-6 w-6" />}
          title="Não foi possível carregar os usuários"
          description={extractApiMessage(error)}
          action={
            <Button variant="secondary" onClick={() => void refetch()}>
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </Button>
          }
        />
      ) : isPending ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <div
          className={
            isFiltering ? "opacity-60 transition-opacity duration-200" : undefined
          }
        >
          <UsuariosGrid
            users={users}
            onEdit={openEditDialog}
            onDelete={handleDelete}
            onResendInvite={handleResendInvite}
            deletingUserId={deletingUserId}
            resendingUserId={resendingUserId}
          />
        </div>
      )}

      <AdminUserFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        user={selectedUser}
        isSaving={isSaving}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
