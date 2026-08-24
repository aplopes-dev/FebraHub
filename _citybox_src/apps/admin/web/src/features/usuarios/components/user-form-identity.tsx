"use client";

import type { FieldErrors, UseFormRegister, Control } from "react-hook-form";
import { Controller } from "react-hook-form";
import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@citybox/ui/atoms";
import type { AdminUserFormData } from "../schemas/admin-user-schema";

interface UserFormIdentityProps {
  register: UseFormRegister<AdminUserFormData>;
  control: Control<AdminUserFormData>;
  errors: FieldErrors<AdminUserFormData>;
  emailReadOnly?: boolean;
}

export function UserFormIdentity({
  register,
  control,
  errors,
  emailReadOnly = false,
}: UserFormIdentityProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="admin-user-first-name">Primeiro Nome</Label>
          <Input
            id="admin-user-first-name"
            placeholder="Ex: Ana Paula"
            {...register("firstName")}
          />
          {errors.firstName ? (
            <p className="text-xs text-destructive">{errors.firstName.message}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="admin-user-last-name">Sobrenome</Label>
          <Input
            id="admin-user-last-name"
            placeholder="Ex: Ribeiro"
            {...register("lastName")}
          />
          {errors.lastName ? (
            <p className="text-xs text-destructive">{errors.lastName.message}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="admin-user-email">E-mail Corporativo</Label>
        <Input
          id="admin-user-email"
          type="email"
          placeholder="nome@citybox.com"
          disabled={emailReadOnly}
          className={emailReadOnly ? "bg-muted/50" : undefined}
          {...register("email")}
        />
        {errors.email ? (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        ) : emailReadOnly ? (
          <p className="text-xs text-muted-foreground">
            O e-mail de login não pode ser alterado após o cadastro.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Será usado como login. Um convite será enviado para definir a senha.
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="admin-user-role">Perfil de Acesso</Label>
        <Controller
          name="role"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="admin-user-role">
                <SelectValue placeholder="Selecione o perfil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="platform_operator">Operador</SelectItem>
                <SelectItem value="platform_admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {errors.role ? (
          <p className="text-xs text-destructive">{errors.role.message}</p>
        ) : null}
      </div>
    </div>
  );
}
