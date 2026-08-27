"use client";

/* SHIM (FebraHub) — mesma API do <Can> da origem, sobre o use-ability local
   (permite tudo, exceto o que o FebraHub não tem — ver use-ability). */

import type { ReactNode } from "react";
import { useCan, useCanPermission } from "@/hooks/permissions/use-ability";

type CanByActionProps = {
  action: string;
  subject: string;
  permission?: never;
};

type CanByPermissionProps = {
  permission: string;
  action?: never;
  subject?: never;
};

type CanProps = (CanByActionProps | CanByPermissionProps) & {
  children: ReactNode;
  fallback?: ReactNode;
};

export function Can({ children, fallback = null, ...props }: CanProps) {
  const canByAction = useCan(props.action ?? "read", props.subject ?? "all");
  const canByPermission = useCanPermission(props.permission ?? "");
  const allowed = "permission" in props ? canByPermission : canByAction;

  return allowed ? <>{children}</> : <>{fallback}</>;
}
