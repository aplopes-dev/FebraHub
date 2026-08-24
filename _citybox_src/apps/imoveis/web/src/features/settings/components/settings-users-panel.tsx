'use client';

import { useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import clsx from 'clsx';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { Avatar, Badge, Box, Button, IconButton } from '@citybox/mui/atoms';
import { toast } from '@citybox/mui/molecules';
import {
  Modal,
  ModalActions,
  ModalCancelButton,
  ModalConfirmButton,
  ModalContent,
  ModalDescription,
  ModalScrollBody,
  ModalTitle,
} from '@/components/ui/modal';
import { Panel } from '@/components/ui/panel';
import { ListifyPagination } from '@/components/ui/listify-pagination';
import { useClientListPagination } from '@/features/shared/hooks/use-client-list-pagination';
import { CURRENT_AGENT_ID } from '@/features/shared/constants/agents';
import { useCurrentAgentId } from '@/features/shared/session/hooks/use-current-agent-id';
import {
  useDeleteTeamMemberMutation,
  useTeamMembersQuery,
  type CreateUserResult,
} from '../hooks/use-settings-queries';
import { USER_ROLE_LABEL, type TeamUser, type UserRole } from '../types';
import { SettingsUserCredentialsDialog } from './settings-user-credentials-dialog';
import { SettingsUserFormDialog } from './settings-user-form-dialog';

function roleLabel(role: UserRole | string): string {
  if (
    role === 'admin' ||
    role === 'broker' ||
    role === 'affiliated' ||
    role === 'assistant'
  ) {
    return USER_ROLE_LABEL[role];
  }
  return role;
}

type DialogState =
  | { open: false }
  | { open: true; mode: 'create' }
  | { open: true; mode: 'edit'; user: TeamUser };

type CredentialsState =
  | { open: false }
  | {
      open: true;
      userId: string;
      userName: string;
      login: string;
      temporaryPassword: string;
    };

function countEnabledPermissions(user: TeamUser): number {
  return Object.values(user.permissions).filter(Boolean).length;
}

export function SettingsUsersPanel() {
  const currentAgentId = useCurrentAgentId();
  const { data: users = [], isPending } = useTeamMembersQuery();
  const pagination = useClientListPagination(users);
  const deleteMember = useDeleteTeamMemberMutation();
  const [dialog, setDialog] = useState<DialogState>({ open: false });
  const [credentials, setCredentials] = useState<CredentialsState>({ open: false });
  const [pendingDelete, setPendingDelete] = useState<TeamUser | null>(null);

  function handleSaved(created?: CreateUserResult) {
    if (created) {
      setCredentials({
        open: true,
        userId: created.user.id,
        userName: created.user.name,
        login: created.credentials.login,
        temporaryPassword: created.credentials.temporaryPassword,
      });
    }
  }

  function requestDelete(user: TeamUser) {
    if (user.id === CURRENT_AGENT_ID) {
      toast.error('Não é possível excluir o administrador principal');
      return;
    }
    setPendingDelete(user);
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    const user = pendingDelete;
    deleteMember.mutate(user.id, {
      onSuccess: () => {
        setPendingDelete(null);
        toast.success('Usuário removido');
      },
      onError: () => toast.error('Não foi possível remover o usuário'),
    });
  }

  if (isPending) {
    return (
      <Panel>
        <p className="text-sm text-muted-foreground">Carregando usuários…</p>
      </Panel>
    );
  }

  return (
    <>
      <Panel className="flex flex-col gap-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight">Usuários</h2>
            <p className="text-sm text-muted-foreground">
              Gerencie quem acessa o painel e defina permissões por usuário.
            </p>
          </div>
          <Button
            type="button"
            variant="contained"
            className="h-11 shrink-0 rounded-3xl px-5"
            startIcon={<AddIcon sx={{ fontSize: 16 }} />}
            onClick={() => setDialog({ open: true, mode: 'create' })}
          >
            Novo usuário
          </Button>
        </header>

        <div className="overflow-x-auto rounded-3xl border border-border/70">
          <Table className="min-w-[40rem]">
            <TableHead>
              <TableRow className="hover:bg-transparent">
                <TableCell className="pl-5">Usuário</TableCell>
                <TableCell className="hidden md:table-cell">E-mail</TableCell>
                <TableCell>Papel</TableCell>
                <TableCell className="hidden lg:table-cell">Permissões</TableCell>
                <TableCell>Status</TableCell>
                <TableCell className="w-24 pr-5 text-right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pagination.pageItems.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="pl-5">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9" sx={{ width: 36, height: 36 }}>
                        {user.initials}
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{user.name}</p>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {user.id === currentAgentId ? (
                            <p className="text-xs text-muted-foreground">Você</p>
                          ) : null}
                          {user.mustChangePassword ? (
                            <Badge
                              size="small"
                              className="rounded-full bg-warning-soft text-[10px] font-medium text-warning"
                              label="1º acesso"
                            />
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden max-w-[14rem] truncate text-muted-foreground md:table-cell">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <Badge
                      size="small"
                      className="rounded-full font-medium"
                      label={roleLabel(user.role)}
                    />
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {countEnabledPermissions(user)} habilitadas
                  </TableCell>
                  <TableCell>
                    <Badge
                      size="small"
                      className={clsx(
                        'rounded-full font-medium',
                        user.active
                          ? 'bg-success-soft text-success'
                          : 'bg-muted text-muted-foreground',
                      )}
                      label={user.active ? 'Ativo' : 'Inativo'}
                    />
                  </TableCell>
                  <TableCell className="pr-5 text-right">
                    <div className="inline-flex items-center gap-1">
                      <IconButton
                        size="small"
                        className="size-9 rounded-full"
                        aria-label={`Editar ${user.name}`}
                        onClick={() => setDialog({ open: true, mode: 'edit', user })}
                      >
                        <EditOutlinedIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        className="size-9 rounded-full text-danger hover:bg-danger/10 hover:text-danger"
                        aria-label={`Excluir ${user.name}`}
                        disabled={user.id === CURRENT_AGENT_ID}
                        onClick={() => requestDelete(user)}
                      >
                        <DeleteOutlinedIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {users.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="inline-flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <PersonOutlinedIcon sx={{ fontSize: 20 }} />
            </span>
            <p className="text-sm text-muted-foreground">
              Nenhum usuário cadastrado. Crie o primeiro para começar.
            </p>
          </div>
        ) : (
          <ListifyPagination
            count={pagination.total}
            page={pagination.page}
            perPage={pagination.perPage}
            onPageChange={pagination.setPage}
            onPerPageChange={pagination.setPerPage}
            rowsPerPageOptions={pagination.perPageOptions}
          />
        )}
      </Panel>

      <SettingsUserFormDialog
        open={dialog.open}
        onOpenChange={(open) => {
          if (!open) setDialog({ open: false });
        }}
        mode={dialog.open ? dialog.mode : 'create'}
        user={dialog.open && dialog.mode === 'edit' ? dialog.user : null}
        onSaved={handleSaved}
      />

      <SettingsUserCredentialsDialog
        open={credentials.open}
        onOpenChange={(open) => {
          if (!open) setCredentials({ open: false });
        }}
        userId={credentials.open ? credentials.userId : ''}
        userName={credentials.open ? credentials.userName : ''}
        login={credentials.open ? credentials.login : ''}
        temporaryPassword={credentials.open ? credentials.temporaryPassword : ''}
      />

      <Modal
        open={Boolean(pendingDelete)}
        onClose={() => {
          if (deleteMember.isPending) return;
          setPendingDelete(null);
        }}
        maxWidth="xs"
        fullWidth
      >
        <ModalScrollBody>
          <ModalTitle>Excluir usuário?</ModalTitle>
          <ModalContent>
            <ModalDescription>
              Tem certeza que deseja excluir{' '}
              <Box component="span" sx={{ fontWeight: 600 }}>
                {pendingDelete?.name ?? 'este usuário'}
              </Box>
              ? O acesso ao painel será removido. Esta ação não pode ser desfeita.
            </ModalDescription>
          </ModalContent>
          <ModalActions>
            <ModalCancelButton
              disabled={deleteMember.isPending}
              onClick={() => setPendingDelete(null)}
            />
            <ModalConfirmButton
              disabled={deleteMember.isPending}
              onClick={confirmDelete}
              color="error"
            >
              {deleteMember.isPending ? 'Excluindo…' : 'Excluir'}
            </ModalConfirmButton>
          </ModalActions>
        </ModalScrollBody>
      </Modal>
    </>
  );
}
