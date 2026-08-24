"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@citybox/ui/atoms";
import { Button } from "@citybox/ui/atoms";
import { Eye, User, MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import type { WebhookLog } from "../../types";

interface WebhookLogActionsMenuProps {
  log: WebhookLog;
  onViewPayload: (log: WebhookLog) => void;
}

export function WebhookLogActionsMenu({
  log,
  onViewPayload,
}: WebhookLogActionsMenuProps) {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Abrir ações"
          className="h-8 w-8"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => onViewPayload(log)}>
            <Eye className="mr-2 h-4 w-4" />
            Ver Payload
          </DropdownMenuItem>
          {log.clientId && (
            <DropdownMenuItem onClick={() => router.push(`/clientes/${log.clientId}`)}>
              <User className="mr-2 h-4 w-4" />
              Ver Cliente
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
