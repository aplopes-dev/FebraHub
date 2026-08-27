/**
 * Em linhas `getRowHref` (component=Link), controles internos precisam
 * cancelar a navegação do `<a>` pai — `stopPropagation` sozinho não basta.
 *
 * ⚠️ Em Checkbox: `preventDefault` cancela o toggle nativo do input (e o
 * `onChange` do MUI). Aplique a seleção no `onClick` do próprio Checkbox
 * (chamar este helper + o toggle), não num `Box` pai com `onChange`.
 */
export function stopRowNavigation(event: {
  preventDefault: () => void;
  stopPropagation: () => void;
}) {
  event.preventDefault();
  event.stopPropagation();
}
