"use client";

import { Copy } from "lucide-react";
import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@citybox/ui/atoms";
import type { WebhookLog } from "../../types";

interface WebhookPayloadSheetProps {
  log: WebhookLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WebhookPayloadSheet({
  log,
  open,
  onOpenChange,
}: WebhookPayloadSheetProps) {
  const json = log ? JSON.stringify(log.payload, null, 2) : "";

  function handleCopyJson() {
    if (!json) return;
    navigator.clipboard.writeText(json).catch(() => null);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[500px] sm:max-w-[500px]">
        <SheetHeader>
          <SheetTitle>Payload do Webhook</SheetTitle>
          <SheetDescription>
            {log ? `Evento: ${log.event} · ${log.id}` : "Detalhes do payload"}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-auto px-4">
          <pre className="rounded-md border bg-muted/40 p-4 text-xs font-mono leading-relaxed whitespace-pre-wrap break-all">
            {json || "{}"}
          </pre>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={handleCopyJson} disabled={!json}>
            <Copy className="mr-2 h-4 w-4" />
            Copiar JSON
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
