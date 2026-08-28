"use client";

import { Button, Drawer, Stack } from "@/ui";
import { UserGeneralFields } from "@/features/users-permissions/components/user-form/user-general-section";
import { useUserForm } from "@/features/users-permissions/hooks/use-user-form";
import type { PermissionProfileOption } from "@/features/users-permissions/types/permission-profile";
import type { CreateMemberResult } from "@/features/users-permissions/types/user";

/** Um campo por linha — não precisa da largura do drawer de sessões ativas. */
const DRAWER_WIDTH = 480;

type UserFormDrawerProps = {
  open: boolean;
  onClose: () => void;
  profileOptions: PermissionProfileOption[];
  /**
   * Criado. Quem chama fecha o drawer e mostra a senha provisória — o diálogo
   * não pode viver aqui dentro, que desmonta junto com o painel.
   */
  onCreated: (result: CreateMemberResult) => void;
};

/**
 * Cadastro de usuário em drawer.
 *
 * Só cria: a **edição** continua em página (`UserEditPage`), que tem a seção de
 * senha e o rodapé de rascunho sujo. Aqui a seção de senha nem apareceria — na
 * criação a API é quem gera a provisória.
 *
 * Os campos entram **soltos** (`UserGeneralFields`), sem o `FormSection` da
 * página: aquele card com borda e fundo dentro do painel faz o drawer ler como
 * um modal. Vale para qualquer formulário que venha para cá.
 *
 * Monte condicionalmente (`{open ? <UserFormDrawer … /> : null}`): é o que
 * zera o formulário entre uma abertura e outra, como nos outros drawers de
 * cadastro do app.
 */
export function UserFormDrawer({
  open,
  onClose,
  profileOptions,
  onCreated,
}: UserFormDrawerProps) {
  const form = useUserForm({ profileOptions, onCreated });

  return (
    <Drawer
      open={open}
      onClose={() => {
        if (!form.isSaving) onClose();
      }}
      title="Novo usuário"
      width={DRAWER_WIDTH}
      footer={
        <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
          <Button
            type="button"
            variant="outlined"
            onClick={onClose}
            disabled={form.isSaving}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="contained"
            loading={form.isSaving}
            disabled={form.isSaving}
            onClick={() => void form.save()}
          >
            Salvar
          </Button>
        </Stack>
      }
    >
      <UserGeneralFields
        form={form}
        profileOptions={profileOptions}
        columns={1}
      />
    </Drawer>
  );
}
