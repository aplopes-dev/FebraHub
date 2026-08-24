"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ModalForm } from "@citybox/ui/organisms";
import type { PlatformUser, UserFormMode, CreateUserPayload, UpdateUserPayload } from "../types";
import {
  adminUserSchema,
  ADMIN_USER_DEFAULT_VALUES,
  type AdminUserFormData,
} from "../schemas/admin-user-schema";
import { mapUserToFormData } from "../lib/map-user-to-form-data";
import { buildCreatePayload, buildUpdatePayload } from "../lib/build-user-payload";
import { UserFormIdentity } from "./user-form-identity";
import { extractApiMessage } from "@/lib/api-error";

interface AdminUserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: UserFormMode;
  user?: PlatformUser | null;
  isSaving?: boolean;
  onSubmit: (
    payload: CreateUserPayload | UpdateUserPayload,
    mode: UserFormMode,
    userId?: string,
  ) => Promise<void>;
}

export function AdminUserFormDialog({
  open,
  onOpenChange,
  mode,
  user,
  isSaving,
  onSubmit,
}: AdminUserFormDialogProps) {
  const form = useForm<AdminUserFormData>({
    resolver: zodResolver(adminUserSchema),
    defaultValues: ADMIN_USER_DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && user) {
      form.reset(mapUserToFormData(user));
      return;
    }
    form.reset(ADMIN_USER_DEFAULT_VALUES);
  }, [open, mode, user, form]);

  const handleSave = form.handleSubmit(async (data) => {
    try {
      if (mode === "edit" && user) {
        await onSubmit(buildUpdatePayload(data), mode, user.id);
      } else {
        await onSubmit(buildCreatePayload(data), mode);
      }
      form.reset(ADMIN_USER_DEFAULT_VALUES);
      onOpenChange(false);
    } catch (err) {
      form.setError("root", { message: extractApiMessage(err) });
    }
  });

  const rootError = form.formState.errors.root?.message;

  return (
    <ModalForm
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "create" ? "Novo Usuário" : "Editar Usuário"}
      subtitle="Defina identidade e perfil de acesso ao painel."
      saveLabel={mode === "create" ? "Enviar Convite" : "Salvar Alterações"}
      onSave={handleSave}
      onClose={() => form.reset(ADMIN_USER_DEFAULT_VALUES)}
      isSaving={isSaving}
    >
      <UserFormIdentity
        register={form.register}
        control={form.control}
        errors={form.formState.errors}
        emailReadOnly={mode === "edit"}
      />
      {rootError ? (
        <p className="mt-2 text-sm text-destructive">{rootError}</p>
      ) : null}
    </ModalForm>
  );
}
