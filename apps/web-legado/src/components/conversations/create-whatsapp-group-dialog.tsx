"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AddAPhotoOutlinedIcon from "@mui/icons-material/AddAPhotoOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import {
  Autocomplete,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  IconButton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import {
  ConversasDialogActions,
  ConversasDialogContent,
  ConversasDialogHeader,
  conversasDialogPaperSx,
  conversasFieldSx,
} from "@/components/common/dialog-form-ui";
import { useCreateWhatsappGroupMutation } from "@/hooks/conversations/use-conversation-mutations";
import { useCustomersQuery } from "@/hooks/customers/use-customers";
import {
  CUSTOMER_LIFECYCLE_STAGE_LABEL,
  type CustomerListItem,
} from "@/types/api/customer";
import type { ConversationDto } from "@/types/api/conversation";

type CreateWhatsappGroupDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (
    conversation: ConversationDto,
    meta?: { inviteLink: string | null; warning: string | null },
  ) => void;
};

type ParticipantSource = "customer" | "phone";

type SelectedParticipant = {
  key: string;
  phone: string;
  label: string;
  source: ParticipantSource;
  stageLabel?: string;
};

type ParticipantTab = "cadastrados" | "telefone";

const SEARCH_DEBOUNCE_MS = 300;
const MAX_PICTURE_BYTES = 2 * 1024 * 1024;

function parsePhones(raw: string): string[] {
  return raw
    .split(/[\n,;]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** Redimensiona e reencoda como JPEG (~640px) para caber no body e no WhatsApp. */
async function fileToGroupPictureDataUrl(file: File): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Falha ao carregar a imagem."));
      img.src = objectUrl;
    });

    const maxEdge = 640;
    const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas indisponível.");
    ctx.drawImage(image, 0, 0, width, height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    if (!dataUrl.startsWith("data:image/jpeg;base64,")) {
      throw new Error("Falha ao converter a imagem.");
    }
    return dataUrl;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export default function CreateWhatsappGroupDialog({
  open,
  onClose,
  onCreated,
}: CreateWhatsappGroupDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{ paper: { sx: conversasDialogPaperSx } }}
    >
      {open ? (
        <CreateWhatsappGroupDialogBody
          key={String(open)}
          onClose={onClose}
          onCreated={onCreated}
        />
      ) : null}
    </Dialog>
  );
}

function CreateWhatsappGroupDialogBody({
  onClose,
  onCreated,
}: Omit<CreateWhatsappGroupDialogProps, "open">) {
  const [subject, setSubject] = useState("");
  const [phonesRaw, setPhonesRaw] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<ParticipantTab>("cadastrados");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerSearchDebounced, setCustomerSearchDebounced] = useState("");
  const [selected, setSelected] = useState<SelectedParticipant[]>([]);
  const [pictureDataUrl, setPictureDataUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createMutation = useCreateWhatsappGroupMutation();

  useEffect(() => {
    const timeout = setTimeout(() => {
      setCustomerSearchDebounced(customerSearch.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [customerSearch]);

  const customersQuery = useCustomersQuery({
    page: 0,
    pageSize: 20,
    search: customerSearchDebounced || undefined,
    tab: "all",
    enabled: tab === "cadastrados",
  });

  const customerOptions = useMemo(() => {
    const items = customersQuery.data?.items ?? [];
    const selectedKeys = new Set(selected.map((p) => p.key));
    return items.filter(
      (c) =>
        Boolean(c.phone && digitsOnly(c.phone).length >= 10) &&
        !selectedKeys.has(`customer:${c.id}`),
    );
  }, [customersQuery.data?.items, selected]);

  const manualPhones = useMemo(() => parsePhones(phonesRaw), [phonesRaw]);

  const allPhones = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const participant of selected) {
      const phone = digitsOnly(participant.phone);
      if (phone.length < 10 || seen.has(phone)) continue;
      seen.add(phone);
      out.push(participant.phone);
    }
    for (const raw of manualPhones) {
      const phone = digitsOnly(raw);
      if (phone.length < 10 || seen.has(phone)) continue;
      seen.add(phone);
      out.push(raw);
    }
    return out;
  }, [selected, manualPhones]);

  const canSubmit =
    subject.trim().length > 0 &&
    allPhones.length > 0 &&
    !createMutation.isPending;

  const addCustomer = (customer: CustomerListItem | null) => {
    if (!customer?.phone) return;
    const phone = digitsOnly(customer.phone);
    if (phone.length < 10) return;
    setSelected((prev) => {
      if (prev.some((p) => p.key === `customer:${customer.id}`)) return prev;
      if (prev.some((p) => digitsOnly(p.phone) === phone)) return prev;
      return [
        ...prev,
        {
          key: `customer:${customer.id}`,
          phone: customer.phone!,
          label: customer.name,
          source: "customer",
          stageLabel: CUSTOMER_LIFECYCLE_STAGE_LABEL[customer.lifecycleStage],
        },
      ];
    });
    setCustomerSearch("");
  };

  const removeSelected = (key: string) => {
    setSelected((prev) => prev.filter((p) => p.key !== key));
  };

  const handlePicturePick = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Selecione uma imagem JPEG, PNG ou WebP.");
      return;
    }
    if (file.size > MAX_PICTURE_BYTES) {
      setError("A foto do grupo pode ter no máximo 2 MB.");
      return;
    }
    try {
      const dataUrl = await fileToGroupPictureDataUrl(file);
      setPictureDataUrl(dataUrl);
      setError(null);
    } catch {
      setError("Não foi possível carregar a imagem.");
    }
  };

  const handleConfirm = () => {
    if (!canSubmit) return;
    setError(null);
    createMutation.mutate(
      {
        subject: subject.trim(),
        participantPhones: allPhones,
        ...(description.trim() ? { description: description.trim() } : {}),
        ...(pictureDataUrl ? { pictureDataUrl } : {}),
      },
      {
        onSuccess: (result) => {
          onCreated(result.conversation, {
            inviteLink: result.inviteLink,
            warning: result.warning,
          });
        },
        onError: (err) => {
          const message =
            err instanceof Error && err.message.trim()
              ? err.message
              : "Não foi possível criar o grupo. Verifique a conexão WhatsApp e os telefones.";
          setError(message);
        },
      },
    );
  };

  return (
    <>
      <ConversasDialogHeader
        icon={<GroupsOutlinedIcon />}
        title="Novo grupo"
        description="Cria o grupo vazio no WhatsApp e envia o link de convite por mensagem aos participantes (foto e descrição opcionais)."
      />

      <ConversasDialogContent>
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <Box sx={{ position: "relative" }}>
              <Avatar
                src={pictureDataUrl ?? undefined}
                sx={{ width: 64, height: 64, bgcolor: "action.hover" }}
              >
                <GroupsOutlinedIcon />
              </Avatar>
              <IconButton
                size="small"
                aria-label="Escolher foto do grupo"
                onClick={() => fileInputRef.current?.click()}
                disabled={createMutation.isPending}
                sx={{
                  position: "absolute",
                  right: -6,
                  bottom: -6,
                  bgcolor: "background.paper",
                  border: 1,
                  borderColor: "divider",
                  "&:hover": { bgcolor: "background.paper" },
                }}
              >
                <AddAPhotoOutlinedIcon fontSize="small" />
              </IconButton>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={handlePicturePick}
              />
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Foto do grupo
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                component="div"
                sx={{ display: "block" }}
              >
                Opcional · JPEG, PNG ou WebP · até 2 MB
              </Typography>
              {pictureDataUrl ? (
                <Button
                  size="small"
                  color="secondary"
                  onClick={() => setPictureDataUrl(null)}
                  sx={{
                    mt: 0.5,
                    px: 0,
                    minWidth: 0,
                    display: "block",
                  }}
                >
                  Remover foto
                </Button>
              ) : null}
            </Box>
          </Stack>

          <TextField
            label="Nome do grupo"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            fullWidth
            autoFocus
            slotProps={{ htmlInput: { maxLength: 100 } }}
            sx={conversasFieldSx}
          />

          <Tabs
            value={tab}
            onChange={(_, value: ParticipantTab) => setTab(value)}
            variant="fullWidth"
            sx={{ minHeight: 36, "& .MuiTab-root": { minHeight: 36, py: 0.5 } }}
          >
            <Tab value="cadastrados" label="Leads / clientes" />
            <Tab value="telefone" label="Telefone" />
          </Tabs>

          {tab === "cadastrados" ? (
            <Autocomplete
              options={customerOptions}
              getOptionLabel={(option) =>
                `${option.name}${option.phone ? ` · ${option.phone}` : ""}`
              }
              filterOptions={(options) => options}
              loading={customersQuery.isFetching}
              inputValue={customerSearch}
              onInputChange={(_, value) => setCustomerSearch(value)}
              value={null}
              onChange={(_, value) => addCustomer(value)}
              noOptionsText={
                customerSearchDebounced
                  ? "Nenhum lead/cliente com telefone encontrado"
                  : "Digite para buscar leads ou clientes"
              }
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Stack spacing={0.25} sx={{ py: 0.5, minWidth: 0 }}>
                    <Typography variant="body2" noWrap>
                      {option.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {CUSTOMER_LIFECYCLE_STAGE_LABEL[option.lifecycleStage]}
                      {option.phone ? ` · ${option.phone}` : ""}
                    </Typography>
                  </Stack>
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Buscar lead ou cliente"
                  placeholder="Nome, documento ou telefone"
                  sx={conversasFieldSx}
                />
              )}
            />
          ) : (
            <TextField
              label="Telefones manuais"
              value={phonesRaw}
              onChange={(e) => setPhonesRaw(e.target.value)}
              fullWidth
              multiline
              minRows={3}
              placeholder={
                "Um por linha ou separados por vírgula\n11 99999-0000\n21 98888-1111"
              }
              helperText={`${manualPhones.length} telefone(s) digitado(s)`}
              sx={conversasFieldSx}
            />
          )}

          {selected.length > 0 || manualPhones.length > 0 ? (
            <Stack spacing={0.75}>
              <Typography variant="caption" color="text.secondary">
                {allPhones.length} participante(s)
              </Typography>
              <Stack
                direction="row"
                useFlexGap
                spacing={0.75}
                sx={{ flexWrap: "wrap" }}
              >
                {selected.map((participant) => (
                  <Chip
                    key={participant.key}
                    size="small"
                    label={
                      participant.stageLabel
                        ? `${participant.label} · ${participant.stageLabel}`
                        : participant.label
                    }
                    onDelete={() => removeSelected(participant.key)}
                  />
                ))}
                {manualPhones.slice(0, 12).map((phone) => (
                  <Chip key={`phone:${phone}`} size="small" label={phone} />
                ))}
                {manualPhones.length > 12 ? (
                  <Chip size="small" label={`+${manualPhones.length - 12}`} />
                ) : null}
              </Stack>
            </Stack>
          ) : null}

          <TextField
            label="Descrição do grupo"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            minRows={3}
            slotProps={{ htmlInput: { maxLength: 512 } }}
            helperText="Aparece como descrição do grupo no WhatsApp (opcional, máx. 512)."
            sx={conversasFieldSx}
          />
          {error ? (
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          ) : null}
        </Stack>
      </ConversasDialogContent>

      <ConversasDialogActions>
        <Button
          onClick={onClose}
          color="secondary"
          disabled={createMutation.isPending}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          disabled={!canSubmit}
          onClick={handleConfirm}
          startIcon={
            createMutation.isPending ? (
              <CircularProgress size={14} color="inherit" />
            ) : null
          }
        >
          Criar grupo
        </Button>
      </ConversasDialogActions>
    </>
  );
}
