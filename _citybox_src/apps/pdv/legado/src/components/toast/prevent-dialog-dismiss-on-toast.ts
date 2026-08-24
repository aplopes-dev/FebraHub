type DismissOutsideEvent = {
  target: EventTarget | null;
  preventDefault: () => void;
};

/**
 * Impede que cliques/interações no Toast do PDV fechem um Dialog (Radix treat-as-outside).
 */
export function preventDialogDismissOnToast(event: DismissOutsideEvent): void {
  const target = event.target;
  if (!(target instanceof Element)) return;
  if (target.closest('[data-pdv-toast-viewport]')) {
    event.preventDefault();
  }
}
