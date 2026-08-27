"use client";

import { create } from "zustand";
import type {
  MemberListParams,
  UserListTab,
} from "@/features/users-permissions/types/user";

export const DEFAULT_USER_PER_PAGE = 10;

type UserListState = {
  tab: UserListTab;
  search: string;
  debouncedSearch: string;
  matrixId: string;
  branchId: string;
  functionalRole: string;
  page: number;
  perPage: number;

  setTab: (tab: UserListTab) => void;
  setSearch: (search: string) => void;
  commitSearch: (search: string) => void;
  setMatrixId: (matrixId: string) => void;
  setBranchId: (branchId: string) => void;
  setFunctionalRole: (functionalRole: string) => void;
  setPage: (page: number) => void;
  setPerPage: (perPage: number) => void;
};

export const useUserListStore = create<UserListState>((set) => ({
  tab: "active",
  search: "",
  debouncedSearch: "",
  matrixId: "all",
  branchId: "all",
  functionalRole: "all",
  page: 1,
  perPage: DEFAULT_USER_PER_PAGE,

  setTab: (tab) => set({ tab, page: 1 }),
  setSearch: (search) => set({ search }),
  commitSearch: (debouncedSearch) => set({ debouncedSearch, page: 1 }),
  setMatrixId: (matrixId) => set({ matrixId, branchId: "all", page: 1 }),
  setBranchId: (branchId) => set({ branchId, page: 1 }),
  setFunctionalRole: (functionalRole) => set({ functionalRole, page: 1 }),
  setPage: (page) => set({ page }),
  setPerPage: (perPage) => set({ perPage, page: 1 }),
}));

export function selectUserListParams(state: UserListState): MemberListParams {
  return {
    tab: state.tab,
    search: state.debouncedSearch,
    matrixId: state.matrixId,
    branchId: state.branchId,
    functionalRole: state.functionalRole,
    page: state.page,
    perPage: state.perPage,
  };
}
