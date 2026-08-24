import type { OpportunityUser } from "../types";

/** Usuário logado mockado — substitui o `useAuth`/`currentUser` do OdontoTech. */
export const CURRENT_USER: OpportunityUser = {
  id: "user-mock-1",
  name: "Dr. Leonardo Ramos",
  avatar: undefined,
};

export function useCurrentUser(): OpportunityUser {
  return CURRENT_USER;
}
