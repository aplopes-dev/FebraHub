/**
 * Estado global do modal de permissão negada (403 em mutations).
 * O `clinicaFetch` abre o modal; o componente React escuta e renderiza.
 */

export const CLINICA_PERMISSION_DENIED_TITLE = 'Sem permissão';

export const CLINICA_PERMISSION_DENIED_MESSAGE =
  'Você não tem permissão para esta ação. Clique em OK para atualizar a página com as permissões atuais.';

type PermissionDeniedState = {
  open: boolean;
  message: string;
};

type Listener = (state: PermissionDeniedState) => void;

const listeners = new Set<Listener>();

let state: PermissionDeniedState = {
  open: false,
  message: CLINICA_PERMISSION_DENIED_MESSAGE,
};

export function getPermissionDeniedDialogState(): PermissionDeniedState {
  return state;
}

export function subscribePermissionDeniedDialog(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emit(): void {
  for (const listener of listeners) {
    listener(state);
  }
}

/** Abre o modal (idempotente se já estiver aberto). */
export function openPermissionDeniedDialog(
  message: string = CLINICA_PERMISSION_DENIED_MESSAGE,
): void {
  if (state.open) return;
  state = { open: true, message };
  emit();
}

export function closePermissionDeniedDialog(): void {
  if (!state.open) return;
  state = { open: false, message: CLINICA_PERMISSION_DENIED_MESSAGE };
  emit();
}

export function reloadAfterPermissionDenied(
  reload: () => void = () => {
    window.location.reload();
  },
): void {
  closePermissionDeniedDialog();
  reload();
}
