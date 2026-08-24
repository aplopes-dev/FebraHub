import type { LatLng } from './map-coordinate';

/** Pin locked until Editar; draft is local until Salvar. */
export function resolveDisplayedPin(args: {
  saved: LatLng;
  editing: boolean;
  draft: LatLng | null;
}): LatLng {
  if (args.editing && args.draft) return args.draft;
  return args.saved;
}
