'use client';

import { RotateCwIcon, PencilIcon, Trash2Icon } from 'lucide-react';

type TableEditToolbarProps = {
  /** Posição em % do canvas (centro horizontal do item, topo acima dele). */
  leftPercent: number;
  topPercent: number;
  onRotate: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  /** Exibe ações de editar/excluir (mesas). Fixtures como Caixa ficam só com rotacionar. */
  showEditActions?: boolean;
};

export function TableEditToolbar({
  leftPercent,
  topPercent,
  onRotate,
  onEdit,
  onDelete,
  showEditActions = true,
}: TableEditToolbarProps) {
  return (
    <div
      className="absolute z-30 flex -translate-x-1/2 -translate-y-full items-center gap-0.5 rounded-xl bg-[#404040] p-1 shadow-lg"
      style={{
        left: `${leftPercent}%`,
        top: `calc(${topPercent}% - 8px)`,
      }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        className="flex size-8 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/15 cursor-pointer"
        onClick={onRotate}
        aria-label="Rotacionar"
      >
        <RotateCwIcon className="size-4" />
      </button>
      {showEditActions && onEdit && (
        <button
          type="button"
          className="flex size-8 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/15 cursor-pointer"
          onClick={onEdit}
          aria-label="Editar mesa"
        >
          <PencilIcon className="size-4" />
        </button>
      )}
      {showEditActions && onDelete && (
        <button
          type="button"
          className="flex size-8 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/15 cursor-pointer"
          onClick={onDelete}
          aria-label="Excluir mesa"
        >
          <Trash2Icon className="size-4" />
        </button>
      )}
    </div>
  );
}
