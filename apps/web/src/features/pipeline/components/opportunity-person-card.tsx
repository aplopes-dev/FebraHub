"use client";

import Link from "next/link";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import MailOutlineIcon from "@mui/icons-material/MailOutlined";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import { Badge, Box, Divider, Paper, Stack, Typography } from "@/ui";
import { OriginChip } from "@/features/pipeline/components/origin-chip";
import { formatPhone } from "@/lib/br-format";
import { formatIsoDate } from "@/lib/date";
import { formatCents } from "@/lib/money";
import type { OpportunityDetail } from "@/features/pipeline/types/pipeline-view";

const ROLE_LABEL: Record<string, string> = {
  lead: "Lead",
  participante: "Participante",
  aluno: "Aluno",
  ex_aluno: "Ex-aluno",
  indicador: "Indicador",
};

/**
 * A pessoa por trás da oportunidade — com a **escada** dela.
 *
 * O histórico de compras não é enfeite de ficha: na Febracis a recompra é o
 * motor (imersão → formação → pacote). Saber que a pessoa já fez o Método CIS
 * muda a conversa e o preço que faz sentido oferecer.
 */
export function OpportunityPersonCard({ detail }: { detail: OpportunityDetail }) {
  const { person, history, attendance } = detail;

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Stack spacing={1.5}>
        <Stack spacing={0.5}>
          <Box
            component={Link}
            href="/clientes"
            sx={{ textDecoration: "none", color: "inherit" }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {person.name}
            </Typography>
          </Box>
          <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5 }}>
            {person.roles.map((role) => (
              <Badge
                key={role}
                label={ROLE_LABEL[role] ?? role}
                size="small"
                variant="outlined"
                sx={{ height: 20, fontSize: "0.6875rem" }}
              />
            ))}
          </Stack>
        </Stack>

        <Stack spacing={0.75}>
          <InfoLine icon={<PhoneOutlinedIcon sx={{ fontSize: 15 }} />}>
            {formatPhone(person.phone)}
          </InfoLine>
          <InfoLine icon={<MailOutlineIcon sx={{ fontSize: 15 }} />}>
            {person.email}
          </InfoLine>
          <InfoLine icon={<PlaceOutlinedIcon sx={{ fontSize: 15 }} />}>
            {person.city} · {person.state}
          </InfoLine>
          {person.company ? (
            <InfoLine icon={<BusinessOutlinedIcon sx={{ fontSize: 15 }} />}>
              {person.company}
            </InfoLine>
          ) : null}
        </Stack>

        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Origem:
          </Typography>
          <OriginChip origin={person.origin} />
        </Stack>

        <Divider />

        <Stack spacing={0.75}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
            JORNADA — O QUE JÁ COMPROU
          </Typography>
          {history.length === 0 ? (
            <Typography variant="caption" sx={{ color: "text.disabled" }}>
              Primeira compra em negociação.
            </Typography>
          ) : (
            history.map((item) => (
              <Stack
                key={item.saleId}
                direction="row"
                spacing={1}
                sx={{ justifyContent: "space-between" }}
              >
                <Typography variant="caption">
                  {item.productName}
                  <Typography
                    component="span"
                    variant="caption"
                    sx={{ color: "text.disabled" }}
                  >
                    {" "}
                    · {formatIsoDate(item.createdAt)}
                  </Typography>
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  {formatCents(item.netCents)}
                </Typography>
              </Stack>
            ))
          )}
        </Stack>

        <Stack spacing={0.75}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
            EVENTOS EM QUE ESTEVE
          </Typography>
          {attendance.length === 0 ? (
            <Typography variant="caption" sx={{ color: "text.disabled" }}>
              Nunca esteve numa sala nossa.
            </Typography>
          ) : (
            attendance.map((item) => (
              <Typography key={item.attendee.id} variant="caption">
                {item.editionName}
                <Typography
                  component="span"
                  variant="caption"
                  sx={{ color: "text.disabled" }}
                >
                  {" "}
                  · {item.attendee.status.replace("_", " ")}
                </Typography>
              </Typography>
            ))
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}

function InfoLine({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center", color: "text.secondary" }}>
      <Box sx={{ display: "flex", color: "text.disabled" }}>{icon}</Box>
      <Typography variant="caption" sx={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
        {children}
      </Typography>
    </Stack>
  );
}
