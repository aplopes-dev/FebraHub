"use client";

import { useMemo, useState } from "react";
import PersonAddAlt1RoundedIcon from "@mui/icons-material/PersonAddAlt1Rounded";
import {
  Autocomplete,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
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
import { getInitials } from "./conversation-utils";
import { useMembersQuery } from "@/hooks/memberships/use-members";
import { MEMBERSHIP_ROLE_LABELS } from "@/types/api/membership";
import type { Membership } from "@/types/api/membership";

type AssignConversationDialogProps = {
  open: boolean;
  currentAssigneeMembershipId: string | null;
  contactName: string;
  submitting?: boolean;
  onClose: () => void;
  /** null = remover atribuição. */
  onConfirm: (assigneeMembershipId: string | null) => void;
};

export default function AssignConversationDialog({
  open,
  currentAssigneeMembershipId,
  contactName,
  submitting = false,
  onClose,
  onConfirm,
}: AssignConversationDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      fullWidth
      maxWidth="xs"
      slotProps={{ paper: { sx: conversasDialogPaperSx } }}
    >
      {open ? (
        <AssignConversationDialogBody
          key={`${currentAssigneeMembershipId ?? "none"}`}
          currentAssigneeMembershipId={currentAssigneeMembershipId}
          contactName={contactName}
          submitting={submitting}
          onClose={onClose}
          onConfirm={onConfirm}
        />
      ) : null}
    </Dialog>
  );
}

function AssignConversationDialogBody({
  currentAssigneeMembershipId,
  contactName,
  submitting = false,
  onClose,
  onConfirm,
}: Omit<AssignConversationDialogProps, "open">) {
  const membersQuery = useMembersQuery({ enabled: true });
  const options = useMemo(
    () =>
      (membersQuery.data ?? []).filter((member) => member.status === "active"),
    [membersQuery.data],
  );

  const [assignee, setAssignee] = useState<Membership | null>(() =>
    options.find((member) => member.id === currentAssigneeMembershipId) ?? null,
  );

  const [prevOptionsLen, setPrevOptionsLen] = useState(options.length);
  if (options.length !== prevOptionsLen) {
    setPrevOptionsLen(options.length);
    setAssignee(
      options.find((member) => member.id === currentAssigneeMembershipId) ??
        null,
    );
  }

  return (
    <>
      <ConversasDialogHeader
        icon={<PersonAddAlt1RoundedIcon />}
        title="Atribuir conversa"
        description={`Escolha quem vai cuidar do atendimento com ${contactName || "este contato"}.`}
      />

      <ConversasDialogContent>
        <Autocomplete
          options={options}
          value={assignee}
          loading={membersQuery.isLoading}
          onChange={(_, value) => setAssignee(value)}
          getOptionLabel={(option) =>
            `${option.user.name} · ${MEMBERSHIP_ROLE_LABELS[option.role]}`
          }
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderOption={(props, option) => {
            const { key, ...optionProps } = props;
            return (
              <Box
                key={key}
                component="li"
                {...optionProps}
                sx={{ display: "flex", alignItems: "center", gap: 1.25 }}
              >
                <Avatar
                  src={option.user.avatarUrl ?? undefined}
                  sx={{
                    width: 32,
                    height: 32,
                    fontSize: 12,
                    fontWeight: 700,
                    bgcolor:
                      "color-mix(in srgb, var(--mui-palette-primary-main) 12%, transparent)",
                    color: "primary.main",
                  }}
                >
                  {getInitials(option.user.name)}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {option.user.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {MEMBERSHIP_ROLE_LABELS[option.role]}
                  </Typography>
                </Box>
              </Box>
            );
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Responsável"
              placeholder="Buscar colega..."
              sx={conversasFieldSx}
            />
          )}
        />

        {currentAssigneeMembershipId &&
        assignee &&
        currentAssigneeMembershipId !== assignee.id ? (
          <Typography variant="caption" color="text.secondary">
            A atribuição atual será substituída.
          </Typography>
        ) : null}
      </ConversasDialogContent>

      <ConversasDialogActions>
        {currentAssigneeMembershipId ? (
          <Button
            color="error"
            disabled={submitting}
            onClick={() => onConfirm(null)}
            sx={{ mr: "auto" }}
          >
            Remover atribuição
          </Button>
        ) : null}
        <Button onClick={onClose} color="secondary" disabled={submitting}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          disabled={!assignee || submitting}
          onClick={() => {
            if (!assignee) return;
            onConfirm(assignee.id);
          }}
          startIcon={
            submitting ? <CircularProgress size={14} color="inherit" /> : null
          }
        >
          Atribuir
        </Button>
      </ConversasDialogActions>
    </>
  );
}
