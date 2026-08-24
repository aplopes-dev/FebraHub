"use client";

import { Copy } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@citybox/ui/atoms";
import { toast } from "sonner";
import type { ProvisionalCredentials } from "@/features/shared/team/types";

type TeamMemberCredentialsDialogProps = {
  credentials: ProvisionalCredentials | null;
  onOpenChange: (open: boolean) => void;
};

export function TeamMemberCredentialsDialog({
  credentials,
  onOpenChange,
}: TeamMemberCredentialsDialogProps) {
  async function handleCopyCredentials() {
    if (!credentials) return;
    const text = `Usuário: ${credentials.username}\nSenha: ${credentials.password}`;
    await navigator.clipboard.writeText(text);
    toast.success("Usuário e senha copiados.");
  }

  async function handleCopyField(value: string, label: string) {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copiado.`);
  }

  return (
    <Dialog
      open={!!credentials}
      onOpenChange={(open) => !open && onOpenChange(false)}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Credenciais de acesso</DialogTitle>
          <DialogDescription>
            Compartilhe o usuário e a senha provisória com quem vai acessar o
            sistema. No primeiro acesso solicitará a criação de uma nova senha
            antes de concluir o login.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Username
            </p>
            <div className="flex items-center gap-2 rounded-md border bg-muted px-4 py-3">
              <span className="flex-1 font-mono text-base">
                {credentials?.username}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0 text-muted-foreground"
                onClick={() =>
                  void handleCopyField(credentials!.username, "Username")
                }
              >
                <Copy className="h-4 w-4" />
                <span className="sr-only">Copiar username</span>
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Senha provisória
            </p>
            <div className="flex items-center gap-2 rounded-md border bg-muted px-4 py-3">
              <span className="flex-1 font-mono text-base tracking-wider">
                {credentials?.password}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0 text-muted-foreground"
                onClick={() =>
                  void handleCopyField(credentials!.password, "Senha")
                }
              >
                <Copy className="h-4 w-4" />
                <span className="sr-only">Copiar senha</span>
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => void handleCopyCredentials()}>
            <Copy className="mr-2 h-4 w-4" />
            Copiar usuário e senha
          </Button>
          <Button onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
