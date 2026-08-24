"use client";

import Link from "next/link";
import { Ban, ExternalLink, Eye, MoreHorizontal, Pencil } from "lucide-react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@citybox/ui/atoms";
import type { Loja } from "../types";

interface StoreActionsMenuProps {
  loja: Loja;
  onEdit?: (loja: Loja) => void;
  onImpersonate?: (loja: Loja) => void;
  onBlock?: (loja: Loja) => void;
}

export function StoreActionsMenu({
  loja,
  onEdit,
  onImpersonate,
  onBlock,
}: StoreActionsMenuProps) {
  const isBlocked = loja.status === "BLOCKED";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Ações de {loja.tradeName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem asChild>
          <Link href={`/clientes/${loja.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            Ver detalhes
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit?.(loja)}>
          <Pencil className="mr-2 h-4 w-4" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onImpersonate?.(loja)} disabled>
          <ExternalLink className="mr-2 h-4 w-4" />
          Acessar como Lojista
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {isBlocked ? (
          <DropdownMenuItem disabled className="text-muted-foreground">
            <Ban className="mr-2 h-4 w-4" />
            Loja bloqueada
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => onBlock?.(loja)}
          >
            <Ban className="mr-2 h-4 w-4" />
            Bloquear Loja
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
