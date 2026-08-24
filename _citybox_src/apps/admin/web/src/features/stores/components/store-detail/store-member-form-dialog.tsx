"use client";

import { useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from "@citybox/ui/atoms";
import { ModalForm } from "@citybox/ui/organisms";
import { extractApiMessage } from "@/lib/api-error";
import type { StoreEmployee, StoreMemberRole } from "../../types";
import {
  storeMemberSchema,
  STORE_MEMBER_DEFAULT_VALUES,
  type StoreMemberFormData,
} from "../../schemas/store-member-schema";

export type StoreMemberFormSubmitValues = StoreMemberFormData;

// Este diálogo só cria (ou edita) um membro próprio da loja. A aba de
// "usuário existente" — que listava membros de outras lojas do mesmo Cliente e
// os vinculava em lote — saiu na Fase 10 do PLAT-001: sem o conceito de Client,
// cada loja é um cliente independente e reaproveitar membro entre lojas
// cruzaria a fronteira de tenant.
interface StoreMemberFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: StoreEmployee | null;
  roles: StoreMemberRole[];
  isRolesLoading?: boolean;
  isSubmitting?: boolean;
  onSubmit: (values: StoreMemberFormSubmitValues) => Promise<void>;
}

function normalizeUsernamePart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9._-]+/g, "")
    .replace(/^[._-]+|[._-]+$/g, "");
}

function suggestUsernameFromName(firstName: string, lastName: string): string {
  const first = normalizeUsernamePart(firstName);
  const last = normalizeUsernamePart(lastName);
  if (first && last) return `${first}.${last}`;
  return first || last;
}

function mapMemberToForm(member: StoreEmployee): StoreMemberFormData {
  return {
    firstName: member.firstName,
    lastName: member.lastName,
    username: member.username,
    email: member.email ?? "",
    role: member.role,
    permissions: member.permissions.join(", "),
    generateProvisionalPassword: true,
    sendInviteEmail: false,
  };
}

export function StoreMemberFormDialog({
  open,
  onOpenChange,
  member,
  roles,
  isRolesLoading,
  isSubmitting,
  onSubmit,
}: StoreMemberFormDialogProps) {
  const isEditing = Boolean(member);
  const usernameManuallyEdited = useRef(false);

  const form = useForm<StoreMemberFormData>({
    resolver: zodResolver(storeMemberSchema),
    defaultValues: STORE_MEMBER_DEFAULT_VALUES,
  });

  const email = form.watch("email");
  const firstName = form.watch("firstName");
  const lastName = form.watch("lastName");
  const generatePassword = form.watch("generateProvisionalPassword");
  const sendInvite = form.watch("sendInviteEmail");
  const hasEmail = Boolean(email?.trim());

  useEffect(() => {
    if (!open) return;
    usernameManuallyEdited.current = false;
    if (member) {
      form.reset(mapMemberToForm(member));
    } else {
      form.reset(STORE_MEMBER_DEFAULT_VALUES);
    }
  }, [open, member, form]);

  useEffect(() => {
    if (isEditing || usernameManuallyEdited.current) return;
    const suggested = suggestUsernameFromName(firstName, lastName);
    if (suggested) {
      form.setValue("username", suggested, { shouldValidate: true });
    }
  }, [firstName, lastName, isEditing, form]);

  useEffect(() => {
    if (isEditing || hasEmail || !sendInvite) return;
    form.setValue("sendInviteEmail", false);
  }, [hasEmail, isEditing, sendInvite, form]);

  const handleSave = async () => {
    await form.handleSubmit(async (data) => {
      try {
        await onSubmit(data);
        if (!isEditing) {
          form.reset(STORE_MEMBER_DEFAULT_VALUES);
        }
        onOpenChange(false);
      } catch (err) {
        form.setError("root", { message: extractApiMessage(err) });
      }
    })();
  };

  const rootError = form.formState.errors.root?.message;
  const usernameRegister = form.register("username");

  return (
    <ModalForm
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Editar usuário" : "Adicionar usuário"}
      subtitle={
        isEditing
          ? "Atualize cargo e permissões do membro da loja."
          : "Crie um acesso para a equipe operacional da loja."
      }
      saveLabel={isEditing ? "Salvar alterações" : "Adicionar usuário"}
      onSave={handleSave}
      onClose={() => {
        form.reset(STORE_MEMBER_DEFAULT_VALUES);
      }}
      isSaving={isSubmitting}
    >
      <div className="space-y-4">
        {!isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="member-first-name">Primeiro nome</Label>
                <Input
                  id="member-first-name"
                  {...form.register("firstName")}
                />
                {form.formState.errors.firstName ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.firstName.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="member-last-name">Sobrenome</Label>
                <Input
                  id="member-last-name"
                  {...form.register("lastName")}
                />
                {form.formState.errors.lastName ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.lastName.message}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="member-username">Username</Label>
              <Input
                id="member-username"
                placeholder="ex: bruno.arouca"
                {...usernameRegister}
                onChange={(event) => {
                  usernameManuallyEdited.current = true;
                  void usernameRegister.onChange(event);
                }}
              />
              {form.formState.errors.username ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.username.message}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Sugerido automaticamente a partir do nome. Você pode editar se preferir.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="member-email">E-mail</Label>
              <Input
                id="member-email"
                type="email"
                placeholder="email@loja.com (opcional)"
                {...form.register("email")}
              />
              {form.formState.errors.email ? (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="member-first-name">Primeiro nome</Label>
                <Input
                  id="member-first-name"
                  disabled={true}
                  className="bg-muted/50"
                  {...form.register("firstName")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="member-last-name">Sobrenome</Label>
                <Input
                  id="member-last-name"
                  disabled={true}
                  className="bg-muted/50"
                  {...form.register("lastName")}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="member-username">Username</Label>
              <Input
                id="member-username"
                disabled={true}
                className="bg-muted/50"
                {...form.register("username")}
              />
              <p className="text-xs text-muted-foreground">
                O username não pode ser alterado após o cadastro.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="member-email">E-mail</Label>
              <Input
                id="member-email"
                type="email"
                disabled={true}
                className="bg-muted/50"
                {...form.register("email")}
              />
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="member-role">Cargo</Label>
          <Controller
            name="role"
            control={form.control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={isRolesLoading || roles.length === 0}
              >
                <SelectTrigger id="member-role">
                  <SelectValue placeholder={isRolesLoading ? "Carregando..." : "Selecionar cargo"} />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.roleKey} value={role.roleKey}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {form.formState.errors.role ? (
            <p className="text-xs text-destructive">{form.formState.errors.role.message}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="member-permissions">Permissões</Label>
          <Input
            id="member-permissions"
            placeholder="Separadas por vírgula (opcional)"
            {...form.register("permissions")}
          />
        </div>

        {!isEditing ? (
          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Gerar senha provisória</p>
                <p className="text-xs text-muted-foreground">
                  O usuário define uma nova senha no primeiro login no ERP. Você também pode
                  gerar a senha depois pelo menu de ações do usuário.
                </p>
              </div>
              <Switch
                checked={generatePassword}
                onCheckedChange={(checked) => {
                  form.setValue("generateProvisionalPassword", checked);
                  if (checked) form.setValue("sendInviteEmail", false);
                }}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Enviar convite por e-mail</p>
                <p className="text-xs text-muted-foreground">
                  Requer e-mail preenchido. Envia link para definir senha.
                </p>
              </div>
              <Switch
                checked={sendInvite}
                disabled={!hasEmail}
                onCheckedChange={(checked) => {
                  if (!hasEmail) return;
                  form.setValue("sendInviteEmail", checked);
                  if (checked) form.setValue("generateProvisionalPassword", false);
                }}
              />
            </div>
          </div>
        ) : null}

        {rootError ? <p className="text-sm text-destructive">{rootError}</p> : null}
      </div>
    </ModalForm>
  );
}
