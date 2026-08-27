"use client";

import { useRef, useState } from "react";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Select,
  Typography,
  toast,
} from "@/ui";
import { useBankAccountOptionsQuery } from "@/features/bank-accounts/hooks/use-bank-account-options-query";
import {
  useImportBankStatementMutation,
  usePreviewBankStatementMutation,
} from "@/features/bank-reconciliation/hooks/use-bank-reconciliation-mutations";

type StatementImportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pré-seleciona a conta quando aberto a partir da ação "Importar extrato
   *  (OFX)" de uma conta bancária específica. */
  initialBankAccountId?: string;
  onImported?: (bankStatementId: string) => void;
};

export function StatementImportDialog({
  open,
  onOpenChange,
  initialBankAccountId,
  onImported,
}: StatementImportDialogProps) {
  const [bankAccountId, setBankAccountId] = useState(initialBankAccountId ?? "");
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: bankAccountOptions = [] } = useBankAccountOptionsQuery();
  const importMutation = useImportBankStatementMutation();
  const previewMutation = usePreviewBankStatementMutation();

  // FR-001/D26 — a conta é obrigatória. Sem nenhuma cadastrada não há o que
  // escolher, então a tela orienta a cadastrar em vez de deixar o operador
  // importar e descobrir depois que a conciliação está travada.
  const hasBankAccounts = bankAccountOptions.length > 0;
  const canSubmit = Boolean(file) && Boolean(bankAccountId) && hasBankAccounts;

  function handleClose() {
    if (importMutation.isPending) return;
    onOpenChange(false);
    setFile(null);
  }

  function handleFileSelected(fileList: FileList | null) {
    const selected = fileList?.[0];
    if (!selected) return;
    if (!/\.ofx$/i.test(selected.name)) {
      toast.error("Selecione um arquivo .ofx");
      return;
    }
    setFile(selected);

    // FR-007a: lê o código do banco do próprio arquivo e pré-seleciona a
    // conta quando existe exatamente uma correspondência ativa — o campo
    // continua editável, e a falta de sugestão não bloqueia nada (FR-007b).
    previewMutation.mutate(selected, {
      onSuccess: (result) => {
        if (result.suggestedBankAccountId) {
          setBankAccountId(result.suggestedBankAccountId);
        }
      },
    });
  }

  function handleSubmit() {
    if (!file) {
      toast.error("Selecione o arquivo .ofx do extrato.");
      return;
    }
    if (!bankAccountId) {
      toast.error("Selecione a conta bancária deste extrato.");
      return;
    }
    importMutation.mutate(
      { bankAccountId, file },
      {
        onSuccess: (result) => {
          onOpenChange(false);
          setFile(null);
          setBankAccountId("");
          onImported?.(result.data.id);
        },
      },
    );
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Importar extrato bancário</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <Box>
            <Typography
              id="statement-import-bank-account-label"
              variant="body2"
              sx={{ fontWeight: 500, mb: 1 }}
            >
              Conta bancária *
            </Typography>
            <FormControl
              fullWidth
              disabled={previewMutation.isPending || !hasBankAccounts}
            >
              <Select
                id="statement-import-bank-account"
                labelId="statement-import-bank-account-label"
                aria-labelledby="statement-import-bank-account-label"
                value={bankAccountId}
                onChange={(event) =>
                  setBankAccountId(event.target.value as string)
                }
              >
                <MenuItem value="">
                  <em>Selecione…</em>
                </MenuItem>
                {bankAccountOptions.map((option) => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {hasBankAccounts ? (
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", mt: 0.5, display: "block" }}
              >
                O arquivo OFX não identifica com segurança qual conta cadastrada
                ele representa — escolha a conta de onde baixou o extrato.
              </Typography>
            ) : (
              <Typography
                variant="caption"
                sx={{ color: "warning.dark", mt: 0.5, display: "block" }}
              >
                Nenhuma conta bancária cadastrada. Cadastre uma conta em Finanças
                &rsaquo; Contas bancárias antes de importar um extrato.
              </Typography>
            )}
          </Box>
          <Box>
            <Typography
              id="statement-import-ofx-file-label"
              variant="body2"
              sx={{ fontWeight: 500, mb: 1 }}
            >
              Arquivo OFX *
            </Typography>
            <Button
              variant="outlined"
              onClick={() => inputRef.current?.click()}
              aria-describedby="statement-import-ofx-file-label"
              sx={{ justifyContent: "flex-start", width: "100%" }}
            >
              {file ? file.name : "Escolher arquivo…"}
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept=".ofx"
              required
              aria-required="true"
              aria-labelledby="statement-import-ofx-file-label"
              hidden
              onChange={(event) => handleFileSelected(event.target.files)}
            />
          </Box>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Tamanho máximo: 10MB. Reimportar o mesmo extrato não duplica transações.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={handleClose} disabled={importMutation.isPending}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={
            !canSubmit || importMutation.isPending || previewMutation.isPending
          }
        >
          {importMutation.isPending ? "Importando…" : "Importar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
