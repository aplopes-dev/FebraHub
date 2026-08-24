import { create } from 'zustand';
import {
  PLACEHOLDER_FLOOR_FIXTURES,
  PLACEHOLDER_FLOOR_TABLES,
} from '../data/placeholder-floor-tables';
import type { FloorFixture, FloorTable } from '../types/floor-table';

function cloneTables(tables: readonly FloorTable[]): FloorTable[] {
  return tables.map((table) => ({ ...table }));
}

function cloneFixtures(fixtures: readonly FloorFixture[]): FloorFixture[] {
  return fixtures.map((fixture) => ({ ...fixture }));
}

export function getDefaultFloorTables(): FloorTable[] {
  return cloneTables(PLACEHOLDER_FLOOR_TABLES);
}

export function getDefaultFloorFixtures(): FloorFixture[] {
  return cloneFixtures(PLACEHOLDER_FLOOR_FIXTURES);
}

type FloorLayoutState = {
  tables: FloorTable[];
  fixtures: FloorFixture[];
  showCashier: boolean;
  setLayout: (input: {
    tables: readonly FloorTable[];
    fixtures: readonly FloorFixture[];
    showCashier: boolean;
  }) => void;
  setShowCashier: (showCashier: boolean) => void;
  resetToDefault: () => void;
};

export const useFloorLayoutStore = create<FloorLayoutState>((set) => ({
  tables: getDefaultFloorTables(),
  fixtures: getDefaultFloorFixtures(),
  showCashier: true,

  setLayout: ({ tables, fixtures, showCashier }) =>
    set({
      tables: cloneTables(tables),
      fixtures: cloneFixtures(fixtures),
      showCashier,
    }),

  setShowCashier: (showCashier) => set({ showCashier }),

  resetToDefault: () =>
    set({
      tables: getDefaultFloorTables(),
      fixtures: getDefaultFloorFixtures(),
      showCashier: true,
    }),
}));
