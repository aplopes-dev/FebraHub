import { darken, getLuminance, lighten } from "@mui/material/styles";

/**
 * Cor de um preenchimento sob o cursor.
 *
 * O MUI usa `palette[color].dark` no hover do botão `contained`. Aqui isso não
 * serve: no catálogo de marca (`theme/brand-color.ts`) o `dark` é calibrado
 * para **texto sobre superfície clara** — precisa de 4,5:1 contra o branco para
 * passar no AA. Como fundo de hover ele derruba a luminância entre 50% e 78%,
 * e o botão parece trocar de cor em vez de reagir ao cursor. Em "Ardósia",
 * "Zinco" e "Pedra" a queda passa de 75% e o hover chega quase no preto.
 *
 * O mesmo `dark`, sendo escolhido a olho por cor e não por fórmula, também é
 * **irregular**: em "Vermelho vivo" a queda é de só 17% e o hover mal aparece.
 *
 * Esta função troca os dois problemas por um degrau **uniforme de ~22%**,
 * calculado a partir do `main`: o hover fica perceptível em qualquer cor de
 * marca que o usuário escolher, sem escurecer demais em nenhuma.
 *
 * Marca quase preta (o "Neutro", `#1B1E1E`) não tem para onde escurecer —
 * nessas o degrau vai para o outro lado.
 */

/** Abaixo desta luminância, escurecer não se vê: o degrau é para o claro. */
const NEAR_BLACK_LUMINANCE = 0.02;

/** Quanto o preenchimento escurece sob o cursor. */
const DARKEN_STEP = 0.11;

/** Quanto ele clareia, quando a cor já é escura demais para escurecer. */
const LIGHTEN_STEP = 0.16;

export function hoverFill(color: string): string {
  return getLuminance(color) < NEAR_BLACK_LUMINANCE
    ? lighten(color, LIGHTEN_STEP)
    : darken(color, DARKEN_STEP);
}
