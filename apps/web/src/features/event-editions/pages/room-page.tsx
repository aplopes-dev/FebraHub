"use client";

import { useState } from "react";
import Link from "next/link";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import UndoIcon from "@mui/icons-material/Undo";
import {
  Avatar,
  Badge,
  Box,
  Button,
  IconButton,
  PageHeader,
  Paper,
  SearchInput,
  Stack,
  Tooltip,
  Typography,
} from "@/ui";
import { Page } from "@/components/ui/page";
import { ApproachDialog } from "@/features/event-editions/components/approach-dialog";
import { AttendeeStatusBadge } from "@/features/event-editions/components/attendee-status-badge";
import { RoomCountersBar } from "@/features/event-editions/components/room-counters-bar";
import { useRoomQuery } from "@/features/event-editions/hooks/use-edition-queries";
import {
  useCheckInMutation,
  useRegisterApproachMutation,
} from "@/features/event-editions/hooks/use-room-mutations";
import type { RoomFilter, RoomRow } from "@/features/event-editions/types/edition-view";
import { formatPhone } from "@/lib/br-format";

const FILTERS: Array<{ id: RoomFilter; label: string }> = [
  { id: "todos", label: "Todos" },
  { id: "aguardando", label: "A abordar" },
  { id: "na_sala", label: "Na sala" },
  { id: "esperado", label: "Ainda não chegou" },
  { id: "matriculado", label: "Matriculados" },
  { id: "pensando", label: "Vão pensar" },
  { id: "recusou", label: "Recusaram" },
];

/**
 * Operação de sala.
 *
 * É a tela que um CRM genérico não tem e que a Febracis usa o ano inteiro:
 * durante o evento, ela responde quem entrou, quem já foi abordado e quem
 * fechou — enquanto ainda dá tempo de mandar um consultor até a mesa 12.
 *
 * Por isso ela é densa e de ação rápida: busca grande, filtro de fila
 * ("a abordar") e um botão por linha. Nada de formulário longo em pé.
 */
export function RoomPage({ editionId }: { editionId: string }) {
  const [filter, setFilter] = useState<RoomFilter>("aguardando");
  const [search, setSearch] = useState("");
  const [target, setTarget] = useState<RoomRow | null>(null);

  const query = useRoomQuery(editionId, filter, search);
  const checkInMutation = useCheckInMutation();
  const approachMutation = useRegisterApproachMutation();

  const data = query.data;
  const edition = data?.edition;

  return (
    <Page scroll={false}>
      <PageHeader
        title={
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <Box
              component={Link}
              href={`/comercial/eventos/${editionId}`}
              sx={{ display: "flex" }}
            >
              <IconButton size="small" aria-label="Voltar para a edição">
                <ArrowBackIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
            <span>Sala — {edition?.name ?? "edição"}</span>
          </Stack>
        }
        description={
          edition
            ? `${edition.venue} · ${edition.instructor} · capacidade ${edition.capacity}`
            : "Carregando…"
        }
      />

      {data ? <RoomCountersBar counters={data.counters} /> : null}

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1.5}
        sx={{ alignItems: { md: "center" } }}
      >
        <SearchInput
          size="small"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nome ou telefone…"
          sx={{ width: "100%", maxWidth: 340 }}
          slotProps={{ htmlInput: { "aria-label": "Buscar participante" } }}
        />

        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
          {FILTERS.map((item) => (
            <Badge
              key={item.id}
              clickable
              onClick={() => setFilter(item.id)}
              label={item.label}
              size="small"
              variant={filter === item.id ? "filled" : "outlined"}
              sx={{
                cursor: "pointer",
                fontWeight: 600,
                bgcolor: filter === item.id ? "primary.main" : "transparent",
                color: filter === item.id ? "primary.contrastText" : "text.secondary",
              }}
            />
          ))}
        </Stack>
      </Stack>

      <Stack spacing={1} sx={{ flex: 1, minHeight: 0, overflowY: "auto", pb: 2 }}>
        {(data?.rows ?? []).map((row) => {
          const checkedIn = Boolean(row.attendee.checkedInAt);

          return (
            <Paper key={row.attendee.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                sx={{ alignItems: { sm: "center" } }}
              >
                <Stack sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {row.personName}
                    </Typography>
                    <Badge label={row.tierName} size="small" variant="outlined" sx={{ height: 20 }} />
                  </Stack>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {formatPhone(row.personPhone)} · {row.personCity}
                    {row.attendee.outcomeNote ? ` · ${row.attendee.outcomeNote}` : ""}
                  </Typography>
                </Stack>

                <AttendeeStatusBadge status={row.attendee.status} />

                {row.consultantInitials ? (
                  <Tooltip title={row.consultantName ?? ""} arrow>
                    <Avatar sx={{ width: 26, height: 26, fontSize: "0.6875rem" }}>
                      {row.consultantInitials}
                    </Avatar>
                  </Tooltip>
                ) : (
                  <Box sx={{ width: 26 }} />
                )}

                <Stack direction="row" spacing={1}>
                  {checkedIn ? (
                    <>
                      <Button
                        type="button"
                        size="small"
                        variant="contained"
                        onClick={() => setTarget(row)}
                      >
                        {row.attendee.approachedAt ? "Reabordar" : "Abordagem"}
                      </Button>
                      <Tooltip title="Desfazer check-in" arrow>
                        <IconButton
                          size="small"
                          aria-label="Desfazer check-in"
                          onClick={() =>
                            checkInMutation.mutate({
                              attendeeId: row.attendee.id,
                              undo: true,
                            })
                          }
                        >
                          <UndoIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </>
                  ) : (
                    <Button
                      type="button"
                      size="small"
                      variant="outlined"
                      startIcon={<HowToRegIcon sx={{ fontSize: 16 }} />}
                      onClick={() => checkInMutation.mutate({ attendeeId: row.attendee.id })}
                    >
                      Check-in
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Paper>
          );
        })}

        {data && data.rows.length === 0 ? (
          <Typography variant="body2" sx={{ color: "text.secondary", p: 2 }}>
            Ninguém neste recorte.
          </Typography>
        ) : null}
      </Stack>

      <ApproachDialog
        key={target?.attendee.id ?? "fechado"}
        open={Boolean(target)}
        personName={target?.personName}
        consultants={data?.consultants ?? []}
        products={data?.products ?? []}
        defaultConsultantId={target?.attendee.consultantId}
        onCancel={() => setTarget(null)}
        onConfirm={(input) => {
          if (!target) return;
          approachMutation.mutate({ attendeeId: target.attendee.id, ...input });
          setTarget(null);
        }}
      />
    </Page>
  );
}
