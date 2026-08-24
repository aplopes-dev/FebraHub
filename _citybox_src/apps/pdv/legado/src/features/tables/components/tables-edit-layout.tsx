'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlusIcon } from 'lucide-react';
import { Switch } from '@citybox/ui/atoms';
import { PdvConfirmModal } from '@/components/pdv-confirm-modal';
import { PdvDeleteModal } from '@/components/pdv-delete-modal';
import { useToast } from '@/components/toast';
import {
  getDefaultFloorFixtures,
  useFloorLayoutStore,
} from '../hooks/use-floor-layout-store';
import type { FloorFixture, FloorTable } from '../types/floor-table';
import { nextRotationDeg } from '../types/floor-table';
import {
  defaultSizeForShape,
  nextTableName,
  TableEditFormModal,
  type TableEditFormValues,
} from './table-edit-form-modal';
import { TablesEditCanvas, type FloorSelection } from './tables-edit-canvas';

type FormTarget = 'new' | FloorTable | null;

function cloneTables(tables: readonly FloorTable[]): FloorTable[] {
  return tables.map((table) => ({ ...table }));
}

function cloneFixtures(fixtures: readonly FloorFixture[]): FloorFixture[] {
  return fixtures.map((fixture) => ({ ...fixture }));
}

export function TablesEditLayout() {
  const router = useRouter();
  const { toast } = useToast();

  const storeTables = useFloorLayoutStore((state) => state.tables);
  const storeFixtures = useFloorLayoutStore((state) => state.fixtures);
  const storeShowCashier = useFloorLayoutStore((state) => state.showCashier);
  const setLayout = useFloorLayoutStore((state) => state.setLayout);

  const [draftTables, setDraftTables] = useState<FloorTable[]>(() => cloneTables(storeTables));
  const [draftFixtures, setDraftFixtures] = useState<FloorFixture[]>(() =>
    cloneFixtures(storeFixtures),
  );
  const [showCashier, setShowCashier] = useState(storeShowCashier);
  const [selection, setSelection] = useState<FloorSelection>(null);

  const [formTarget, setFormTarget] = useState<FormTarget>(null);
  const [tablePendingDelete, setTablePendingDelete] = useState<FloorTable | null>(null);
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const visibleFixtures = useMemo(
    () => (showCashier ? draftFixtures : []),
    [draftFixtures, showCashier],
  );

  const formMode = formTarget === 'new' ? 'add' : 'edit';
  const formInitial: TableEditFormValues | null =
    formTarget === null
      ? null
      : formTarget === 'new'
        ? {
            name: nextTableName(draftTables),
            capacity: 2,
            shape: 'circle',
          }
        : {
            name: formTarget.name,
            capacity: formTarget.capacity,
            shape: formTarget.shape,
          };

  const handleMoveTable = (tableId: string, x: number, y: number) => {
    setDraftTables((current) =>
      current.map((table) => (table.id === tableId ? { ...table, x, y } : table)),
    );
  };

  const handleMoveFixture = (fixtureId: string, x: number, y: number) => {
    setDraftFixtures((current) =>
      current.map((fixture) => (fixture.id === fixtureId ? { ...fixture, x, y } : fixture)),
    );
  };

  const handleRotateTable = (tableId: string) => {
    setDraftTables((current) =>
      current.map((table) =>
        table.id === tableId
          ? { ...table, rotationDeg: nextRotationDeg(table.rotationDeg) }
          : table,
      ),
    );
  };

  const handleRotateFixture = (fixtureId: string) => {
    setDraftFixtures((current) =>
      current.map((fixture) =>
        fixture.id === fixtureId
          ? { ...fixture, rotationDeg: nextRotationDeg(fixture.rotationDeg) }
          : fixture,
      ),
    );
  };

  const handleFormSubmit = (values: TableEditFormValues) => {
    if (formTarget === 'new') {
      const size = defaultSizeForShape(values.shape);
      const newTable: FloorTable = {
        id: `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        name: values.name,
        capacity: values.capacity,
        status: 'available',
        shape: values.shape,
        x: clampCenter(50 - size.w / 2, size.w),
        y: clampCenter(50 - size.h / 2, size.h),
        w: size.w,
        h: size.h,
      };
      setDraftTables((current) => [...current, newTable]);
      setSelection({ kind: 'table', id: newTable.id });
      toast({
        variant: 'success',
        title: 'Mesa adicionada',
        description: `${newTable.name} foi adicionada ao layout.`,
      });
      return;
    }

    if (formTarget === null) {
      return;
    }

    const editingId = formTarget.id;
    setDraftTables((current) =>
      current.map((table) => {
        if (table.id !== editingId) return table;
        const sizeChanged = table.shape !== values.shape;
        const size = sizeChanged ? defaultSizeForShape(values.shape) : { w: table.w, h: table.h };
        return {
          ...table,
          name: values.name,
          capacity: values.capacity,
          shape: values.shape,
          w: size.w,
          h: size.h,
          x: Math.min(table.x, 100 - size.w),
          y: Math.min(table.y, 100 - size.h),
        };
      }),
    );
    toast({
      variant: 'success',
      title: 'Mesa atualizada',
      description: `${values.name} foi atualizada.`,
    });
  };

  const handleConfirmDelete = () => {
    if (!tablePendingDelete) return;
    const deletedName = tablePendingDelete.name;
    const deletedId = tablePendingDelete.id;
    setDraftTables((current) => current.filter((table) => table.id !== deletedId));
    setSelection((current) =>
      current?.kind === 'table' && current.id === deletedId ? null : current,
    );
    setTablePendingDelete(null);
    toast({
      variant: 'success',
      title: 'Mesa excluída',
      description: `${deletedName} foi removida do layout.`,
    });
  };

  const handleConfirmReset = () => {
    setDraftTables([]);
    setDraftFixtures(getDefaultFloorFixtures());
    setShowCashier(false);
    setSelection(null);
    setIsResetConfirmOpen(false);
    toast({
      variant: 'info',
      title: 'Layout limpo',
      description: 'Todas as mesas foram removidas do layout.',
    });
  };

  const handleConfirmSave = () => {
    setLayout({ tables: draftTables, fixtures: draftFixtures, showCashier });
    setIsSaveConfirmOpen(false);
    toast({
      variant: 'success',
      title: 'Layout salvo',
      description: 'As alterações do layout de mesas foram aplicadas.',
    });
    router.push('/mesas');
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 p-6">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 select-none">
        <h1 className="text-xl font-bold text-[#171717]">Editar mesas</h1>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setIsResetConfirmOpen(true)}
            className="text-sm font-semibold text-[#F04D28] hover:opacity-80 cursor-pointer"
          >
            Resetar para padrão
          </button>

          <label className="flex items-center gap-2 text-sm font-semibold text-[#171717]">
            <span>Exibir Caixa</span>
            <Switch
              checked={showCashier}
              onCheckedChange={(checked) => {
                setShowCashier(checked);
                if (!checked) {
                  setSelection((current) => (current?.kind === 'fixture' ? null : current));
                }
              }}
            />
          </label>

          <button
            type="button"
            onClick={() => setFormTarget('new')}
            className="flex h-10 items-center gap-1.5 rounded-xl border border-[#e5e5e5] bg-white px-4 text-sm font-semibold text-[#171717] hover:bg-black/[0.02] cursor-pointer"
          >
            <PlusIcon className="size-4" />
            <span>Adicionar mesa</span>
          </button>

          <button
            type="button"
            onClick={() => router.push('/mesas')}
            className="pdv-gradient-border-btn flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold text-[#171717] cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={() => setIsSaveConfirmOpen(true)}
            className="pdv-primary-gradient-btn flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Salvar
          </button>
        </div>
      </div>

      <TablesEditCanvas
        tables={draftTables}
        fixtures={visibleFixtures}
        selection={selection}
        onSelect={setSelection}
        onMoveTable={handleMoveTable}
        onMoveFixture={handleMoveFixture}
        onRotateTable={handleRotateTable}
        onRotateFixture={handleRotateFixture}
        onEditTable={(tableId) => {
          const table = draftTables.find((item) => item.id === tableId);
          if (table) setFormTarget(table);
        }}
        onDeleteTable={(tableId) => {
          const table = draftTables.find((item) => item.id === tableId);
          if (table) setTablePendingDelete(table);
        }}
      />

      <TableEditFormModal
        open={formTarget !== null}
        mode={formMode}
        initial={formInitial}
        onOpenChange={(open) => {
          if (!open) setFormTarget(null);
        }}
        onSubmit={handleFormSubmit}
      />

      <PdvDeleteModal
        open={tablePendingDelete !== null}
        title="Excluir mesa?"
        description={
          tablePendingDelete
            ? `Tem certeza que deseja remover ${tablePendingDelete.name} do layout?`
            : ''
        }
        confirmLabel="Sim, Excluir"
        onCancel={() => setTablePendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />

      <PdvDeleteModal
        open={isResetConfirmOpen}
        title="Limpar layout?"
        description="Todas as mesas serão removidas do layout. Esta ação não pode ser desfeita nesta edição."
        confirmLabel="Sim, Limpar"
        onCancel={() => setIsResetConfirmOpen(false)}
        onConfirm={handleConfirmReset}
      />

      <PdvConfirmModal
        open={isSaveConfirmOpen}
        title="Salvar layout?"
        description="As alterações do layout de mesas serão aplicadas na tela de Mesas."
        confirmLabel="Sim, Salvar"
        onCancel={() => setIsSaveConfirmOpen(false)}
        onConfirm={handleConfirmSave}
      />
    </div>
  );
}

function clampCenter(value: number, size: number): number {
  return Math.min(Math.max(value, 0), 100 - size);
}
