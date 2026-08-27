"use client";

import { useEffect, useMemo, useState } from "react";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import {
  Autocomplete,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  Link,
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
import { useAddGroupParticipantsMutation } from "@/hooks/conversations/use-conversation-mutations";
import { useCustomersQuery } from "@/hooks/customers/use-customers";
import {
  CUSTOMER_LIFECYCLE_STAGE_LABEL,
  type CustomerListItem,
} from "@/types/api/customer";

type AddGroupParticipantsDialogProps = {
  open: boolean;
  conversationId: string | null;
  groupName: string;
  onClose: () => void;
  onDone: (message: string, severity?: "success" | "warning" | "error") => void;
};

type SelectedParticipant = {
  key: string;
  phone: string;
  label: string;
  stageLabel?: string;
};

type ParticipantTab = "cadastrados" | "telefone";

const SEARCH_DEBOUNCE_MS = 300;

function parsePhones(raw: string): string[] {
  return raw
    .split(/[\n,;]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export default function AddGroupParticipantsDialog({
  open,
  conversationId,
  groupName,
  onClose,
  onDone,
}: AddGroupParticipantsDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{ paper: { sx: conversasDialogPaperSx } }}
    >
      {open ? (
        <AddGroupParticipantsDialogBody
          key={String(open)}
          conversationId={conversationId}
          groupName={groupName}
          onClose={onClose}
          onDone={onDone}
        />
      ) : null}
    </Dialog>
  );
}

function AddGroupParticipantsDialogBody({
  conversationId,
  groupName,
  onClose,
  onDone,
}: Omit<AddGroupParticipantsDialogProps, "open">) {
  const [phonesRaw, setPhonesRaw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [tab, setTab] = useState<ParticipantTab>("cadastrados");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerSearchDebounced, setCustomerSearchDebounced] = useState("");
  const [selected, setSelected] = useState<SelectedParticipant[]>([]);
  const mutation = useAddGroupParticipantsMutation();

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
    Boolean(conversationId) &&
    allPhones.length > 0 &&
    !mutation.isPending &&
    !inviteLink;

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
          stageLabel: CUSTOMER_LIFECYCLE_STAGE_LABEL[customer.lifecycleStage],
        },
      ];
    });
    setCustomerSearch("");
  };

  const removeSelected = (key: string) => {
    setSelected((prev) => prev.filter((p) => p.key !== key));
  };

  const handleConfirm = () => {
    if (!canSubmit || !conversationId) return;
    setError(null);
    mutation.mutate(
      { conversationId, participantPhones: allPhones },
      {
        onSuccess: (result) => {
          setInviteLink(result.inviteLink);
          const parts: string[] = [];
          if (result.inviteMessagesSent > 0) {
            parts.push(
              `Link de convite enviado para ${result.inviteMessagesSent} contato(s).`,
            );
          }
          if (result.warning) parts.push(result.warning);
          if (result.inviteLink) parts.push(`Link: ${result.inviteLink}`);
          onDone(
            parts.join(" ") || "Convite enviado.",
            result.warning ? "warning" : "success",
          );
          if (!result.inviteLink) onClose();
        },
        onError: (err) => {
          const message =
            err instanceof Error && err.message.trim()
              ? err.message
              : "Não foi possível enviar o convite. Verifique se você é admin do grupo e se os números têm WhatsApp.";
          setError(message);
        },
      },
    );
  };

  return (
    <>
      <ConversasDialogHeader
        icon={<PersonAddAltOutlinedIcon />}
        title="Convidar participantes"
        description={`Envia o link do grupo “${groupName || "Grupo"}” por WhatsApp para leads/clientes ou números. Eles entram ao aceitar o convite.`}
      />

      <ConversasDialogContent>
        <Stack spacing={2}>
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
                  autoFocus
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
              autoFocus
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
                {allPhones.length} participante(s) a adicionar
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

          {inviteLink ? (
            <Typography variant="body2">
              Link de convite:{" "}
              <Link href={inviteLink} target="_blank" rel="noopener noreferrer">
                {inviteLink}
              </Link>
            </Typography>
          ) : null}
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
          disabled={mutation.isPending}
        >
          {inviteLink ? "Fechar" : "Cancelar"}
        </Button>
        {!inviteLink ? (
          <Button
            variant="contained"
            disabled={!canSubmit}
            onClick={handleConfirm}
            startIcon={
              mutation.isPending ? (
                <CircularProgress size={14} color="inherit" />
              ) : null
            }
          >
            {mutation.isPending ? "Enviando…" : "Enviar convite"}
          </Button>
        ) : null}
      </ConversasDialogActions>
    </>
  );
}
