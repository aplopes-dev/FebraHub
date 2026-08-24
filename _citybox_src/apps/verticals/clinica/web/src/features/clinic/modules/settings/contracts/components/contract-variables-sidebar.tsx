'use client';

import { GripVertical } from 'lucide-react';
import { cn } from '@citybox/ui';
import {
  CONTRACT_VARIABLE_CATALOG,
  groupContractVariablesByCategory,
} from '../data/contract-variable-catalog';
import {
  CONTRACT_VARIABLE_DRAG_MIME,
  type ContractVariable,
} from '../types/clinic-contract';

type ContractVariablesSidebarProps = {
  className?: string;
  onSelectVariable?: (variable: ContractVariable) => void;
};

function DraggableVariableChip({
  variable,
  onSelect,
}: {
  variable: ContractVariable;
  onSelect?: (variable: ContractVariable) => void;
}) {
  const handleDragStart = (event: React.DragEvent<HTMLButtonElement>) => {
    event.dataTransfer.setData(CONTRACT_VARIABLE_DRAG_MIME, variable.token);
    event.dataTransfer.setData('text/plain', variable.label);
    event.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <button
      type="button"
      draggable
      onDragStart={handleDragStart}
      onClick={() => onSelect?.(variable)}
      className={cn(
        'flex w-full cursor-grab items-center gap-2 rounded-lg border border-border bg-input px-3 py-2 text-left text-sm text-foreground',
        'transition-colors hover:bg-border active:cursor-grabbing',
      )}
      aria-label={`Inserir variável ${variable.label}`}
    >
      <GripVertical className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="min-w-0 flex-1 leading-snug">{variable.label}</span>
    </button>
  );
}

const VARIABLE_GROUPS = groupContractVariablesByCategory(CONTRACT_VARIABLE_CATALOG);

export function ContractVariablesSidebar({
  className,
  onSelectVariable,
}: ContractVariablesSidebarProps) {
  return (
    <aside
      className={cn(
        'flex w-full shrink-0 flex-col border-r border-border/60 bg-muted/15 lg:w-72',
        className,
      )}
    >
      <div className="border-b border-border/60 px-4 py-4">
        <h3 className="text-sm font-semibold text-foreground">Variáveis disponíveis</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Clique ou arraste para o conteúdo do contrato
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-muted/50 px-3 py-4">
        <div className="space-y-5">
          {VARIABLE_GROUPS.map((group) => (
            <section key={group.category} className="space-y-2">
              <h4 className="px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {group.label}
              </h4>
              <div className="space-y-2">
                {group.items.map((variable) => (
                  <DraggableVariableChip
                    key={variable.id}
                    variable={variable}
                    onSelect={onSelectVariable}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </aside>
  );
}
