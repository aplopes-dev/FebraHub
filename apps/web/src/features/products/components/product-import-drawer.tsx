"use client";

import CloudUploadOutlined from "@mui/icons-material/CloudUploadOutlined";
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import DownloadOutlined from "@mui/icons-material/DownloadOutlined";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { toast } from "@/ui";
import { Button, Drawer, Typography } from "@/ui";
import {
  downloadProductImportTemplateFromApi,
  importProducts,
} from "@/features/products/api/products.service";
import { productKeys } from "@/features/products/hooks/query-keys";
import { ApiError } from "@/lib/api/client";
import { useCatalogScope } from "@/lib/organization-context";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_VISIBLE_IMPORT_ERRORS = 3;

type ProductImportDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ProductImportDrawer({
  open,
  onOpenChange,
}: ProductImportDrawerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { scope } = useCatalogScope();
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  function reset() {
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleClose() {
    reset();
    onOpenChange(false);
  }

  function handleFileChange(nextFile: File | null) {
    if (!nextFile) {
      setFile(null);
      return;
    }

    const isXlsx =
      nextFile.name.toLowerCase().endsWith(".xlsx") ||
      nextFile.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    if (!isXlsx) {
      reset();
      toast.error("Formato inválido", {
        description: "Envie um arquivo XLSX.",
      });
      return;
    }

    if (nextFile.size > MAX_FILE_BYTES) {
      reset();
      toast.error("Arquivo muito grande", {
        description: "O tamanho máximo é 5MB.",
      });
      return;
    }

    setFile(nextFile);
  }

  async function handleImport() {
    if (!file) return;
    setIsImporting(true);
    try {
      const result = await importProducts(file);
      await queryClient.invalidateQueries({
        queryKey: productKeys.all(scope),
      });

      if (result.created > 0) {
        toast.success(
          result.created === 1
            ? "1 produto importado"
            : `${result.created} produtos importados`,
        );
      }

      if (result.failed > 0) {
        const details = result.errors
          .slice(0, MAX_VISIBLE_IMPORT_ERRORS)
          .map((error) => `Linha ${error.row}: ${error.message}`)
          .join(" • ");
        toast.error(
          `${result.failed} ${result.failed === 1 ? "linha falhou" : "linhas falharam"}`,
          {
            description: [
              details,
            ]
              .filter(Boolean)
              .join(" "),
          },
        );
        return;
      }

      if (result.created === 0) {
        toast.success("Importação concluída", {
          description: "Nenhum produto novo foi criado.",
        });
      }
      handleClose();
    } catch (error) {
      toast.error("Não foi possível importar os produtos", {
        description:
          error instanceof ApiError || error instanceof Error
            ? error.message
            : "Erro inesperado",
      });
    } finally {
      setIsImporting(false);
    }
  }

  async function handleTemplateDownload() {
    setIsDownloading(true);
    try {
      await downloadProductImportTemplateFromApi();
    } catch (error) {
      toast.error("Não foi possível baixar o modelo", {
        description:
          error instanceof ApiError || error instanceof Error
            ? error.message
            : "Erro inesperado",
      });
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      title="Importar produtos"
      width={480}
      footer={
        <Stack direction="row" spacing={1} sx={{
          justifyContent: "flex-end"
        }}>
          <Button type="button" variant="outlined" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="contained"
            disabled={!file || isImporting}
            onClick={() => void handleImport()}
          >
            {isImporting ? "Importando…" : "Importar"}
          </Button>
        </Stack>
      }
    >
      <Typography
        variant="body2"
        sx={{
          color: "text.secondary",
          mb: 3
        }}>
        Baixe o modelo, preencha os produtos e envie a planilha XLSX.
      </Typography>
      <Stack spacing={3}>
        <Box
          component="button"
          type="button"
          disabled={isDownloading}
          onClick={() => void handleTemplateDownload()}
          sx={{
            display: "flex",
            width: "100%",
            alignItems: "flex-start",
            gap: 1.5,
            p: 1.5,
            textAlign: "left",
            border: 1,
            borderColor: "divider",
            borderRadius: 2,
            bgcolor: "background.paper",
            cursor: "pointer",
            "&:hover": { bgcolor: "action.hover" },
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 1,
              bgcolor: "action.hover",
            }}
          >
            <DescriptionOutlined sx={{ fontSize: 20, color: "text.secondary" }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{
              fontWeight: 600
            }}>
              Planilha modelo - Produtos
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                display: "block"
              }}>
              Tamanho máximo da planilha: 500 linhas ou 5MB
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                display: "block"
              }}>
              Formato de arquivo permitido: XLSX
            </Typography>
          </Box>
          <DownloadOutlined sx={{ fontSize: 16, color: "text.secondary", mt: 0.5, flexShrink: 0 }} />
        </Box>

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Arquivo para importar
          </Typography>
          <Box
            component="label"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const dropped = event.dataTransfer.files?.[0] ?? null;
              handleFileChange(dropped);
            }}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              px: 2,
              py: 5,
              cursor: "pointer",
              border: 1,
              borderStyle: "dashed",
              borderColor: "divider",
              borderRadius: 2,
              bgcolor: "action.hover",
              textAlign: "center",
              "&:hover": { bgcolor: "action.selected" },
            }}
          >
            <CloudUploadOutlined sx={{ fontSize: 24, color: "text.secondary" }} />
            <Typography variant="body2" sx={{
              color: "text.secondary"
            }}>
              {file
                ? file.name
                : "Arraste um arquivo XLSX ou clique para selecionar"}
            </Typography>
            <Box
              component="input"
              ref={inputRef}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              sx={{
                position: "absolute",
                width: 1,
                height: 1,
                p: 0,
                m: -1,
                overflow: "hidden",
                clip: "rect(0,0,0,0)",
                whiteSpace: "nowrap",
                border: 0,
              }}
              onChange={(event) =>
                handleFileChange(
                  (event.target as HTMLInputElement).files?.[0] ?? null,
                )
              }
            />
          </Box>
        </Box>
      </Stack>
    </Drawer>
  );
}
