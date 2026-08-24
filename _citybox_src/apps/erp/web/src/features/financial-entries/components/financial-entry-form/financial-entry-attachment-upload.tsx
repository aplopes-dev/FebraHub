"use client";

import CloudUploadOutlined from "@mui/icons-material/CloudUploadOutlined";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import InsertDriveFileOutlined from "@mui/icons-material/InsertDriveFileOutlined";

import { useRef } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import { Button, Typography, toast } from "@citybox/mui";
import { financialEntryAttachmentUrl } from "@/features/financial-entries/api/financial-entries.service";
import { formatFileSize } from "@/features/financial-entries/lib/financial-entry-format";
import type { FinancialEntryAttachment } from "@/features/financial-entries/types/financial-entry";

/** D14 de research.md — 5MB por arquivo, PDF ou imagem (RN-09). */
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = "application/pdf,image/png,image/jpeg,image/webp";

type FinancialEntryAttachmentUploadProps = {
  /** `null` no lançamento ainda não salvo — links de download ficam indisponíveis. */
  financialEntryId: string | null;
  existingAttachments: readonly FinancialEntryAttachment[];
  pendingFiles: readonly File[];
  onAddFiles: (files: File[]) => void;
  onRemovePendingFile: (index: number) => void;
  onRemoveExistingAttachment: (attachmentId: string) => void;
  readOnly?: boolean;
};

function validateFile(file: File): string | null {
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return `"${file.name}" excede o limite de 5MB.`;
  }
  const allowed = [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/webp",
  ];
  if (!allowed.includes(file.type)) {
    return `"${file.name}" não é PDF nem imagem (PNG/JPEG/WebP).`;
  }
  return null;
}

export function FinancialEntryAttachmentUpload({
  financialEntryId,
  existingAttachments,
  pendingFiles,
  onAddFiles,
  onRemovePendingFile,
  onRemoveExistingAttachment,
  readOnly,
}: FinancialEntryAttachmentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFilesSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    const errors: string[] = [];
    const valid: File[] = [];

    for (const file of files) {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
      } else {
        valid.push(file);
      }
    }

    if (errors.length > 0) {
      toast.error("Alguns arquivos não puderam ser adicionados", {
        description: errors.join(" "),
      });
    }
    if (valid.length > 0) onAddFiles(valid);
  }

  const hasAnyAttachment =
    existingAttachments.length > 0 || pendingFiles.length > 0;

  return (
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 500, mb: 1.5 }}>
        Anexos & comprovantes
      </Typography>

      {hasAnyAttachment ? (
        <Stack spacing={1} sx={{ mb: 1.5 }}>
          {existingAttachments.map((attachment) => (
            <Stack
              key={attachment.id}
              direction="row"
              spacing={1.5}
              sx={{
                alignItems: "center",
                border: 1,
                borderColor: "divider",
                borderRadius: 1,
                px: 1.5,
                py: 1,
              }}
            >
              <InsertDriveFileOutlined
                sx={{ fontSize: 20, color: "text.secondary" }}
              />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {financialEntryId ? (
                  <Box
                    component="a"
                    href={financialEntryAttachmentUrl(
                      financialEntryId,
                      attachment.id,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      display: "block",
                      typography: "body2",
                      color: "primary.main",
                      textDecoration: "none",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      "&:hover": { textDecoration: "underline" },
                    }}
                  >
                    {attachment.fileName}
                  </Box>
                ) : (
                  <Typography
                    variant="body2"
                    sx={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {attachment.fileName}
                  </Typography>
                )}
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {formatFileSize(attachment.sizeBytes)}
                </Typography>
              </Box>
              <IconButton
                size="small"
                disabled={readOnly}
                aria-label={`Remover ${attachment.fileName}`}
                onClick={() => onRemoveExistingAttachment(attachment.id)}
              >
                <DeleteOutlined sx={{ fontSize: 16 }} />
              </IconButton>
            </Stack>
          ))}

          {pendingFiles.map((file, index) => (
            <Stack
              key={`${file.name}-${file.lastModified}-${index}`}
              direction="row"
              spacing={1.5}
              sx={{
                alignItems: "center",
                border: 1,
                borderColor: "warning.main",
                borderStyle: "dashed",
                borderRadius: 1,
                px: 1.5,
                py: 1,
              }}
            >
              <InsertDriveFileOutlined
                sx={{ fontSize: 20, color: "text.secondary" }}
              />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="body2"
                  sx={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {file.name}
                </Typography>
                <Typography variant="caption" sx={{ color: "warning.dark" }}>
                  {formatFileSize(file.size)} · será enviado ao salvar
                </Typography>
              </Box>
              <IconButton
                size="small"
                disabled={readOnly}
                aria-label={`Remover ${file.name}`}
                onClick={() => onRemovePendingFile(index)}
              >
                <DeleteOutlined sx={{ fontSize: 16 }} />
              </IconButton>
            </Stack>
          ))}
        </Stack>
      ) : null}

      <Box
        component="input"
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED_TYPES}
        disabled={readOnly}
        onChange={(event) => {
          handleFilesSelected(event.target.files);
          event.target.value = "";
        }}
        sx={{
          position: "absolute",
          width: 1,
          height: 1,
          p: 0,
          m: -1,
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      />
      <Button
        type="button"
        variant="text"
        startIcon={<CloudUploadOutlined sx={{ fontSize: 16 }} />}
        onClick={() => inputRef.current?.click()}
        disabled={readOnly}
        sx={{ px: 0 }}
      >
        Adicionar anexo
      </Button>
      <Typography
        variant="caption"
        sx={{ display: "block", color: "text.secondary", mt: 0.5 }}
      >
        PDF ou imagem (PNG/JPEG/WebP), até 5MB por arquivo.
      </Typography>
    </Box>
  );
}
