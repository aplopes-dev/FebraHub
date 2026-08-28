"use client";

import { Badge, Divider, Drawer, Stack, Typography } from "@/ui";
import { CustomerRolesCell } from "@/features/customers/components/customer-roles-cell";
import { useCustomerJourneyQuery } from "@/features/customers/hooks/use-customer-journey-query";
import type { Customer, CustomerRole } from "@/features/customers/types/customer";

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

/**
 * A jornada da pessoa.
 *
 * A ordem das seções é a ordem da escada: o que ela **comprou**, os eventos em
 * que **esteve** e quem ela **indicou**. Ler de cima para baixo conta a
 * história do relacionamento — e mostra o próximo passo natural da venda.
 */
export function CustomerJourneyDrawer({
  customer,
  onClose,
}: {
  customer: Customer | null;
  onClose: () => void;
}) {
  const query = useCustomerJourneyQuery(customer?.id);
  const journey = query.data;

  const totalCents =
    journey?.purchases.reduce((total, purchase) => total + purchase.netCents, 0) ?? 0;

  return (
    <Drawer
      anchor="right"
      open={Boolean(customer)}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: { xs: "100%", sm: 480 }, p: 3 } } }}
    >
      {customer ? (
        <Stack spacing={2.5}>
          <Stack spacing={0.75}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {customer.name}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {customer.email} · {customer.phone}
            </Typography>
            <CustomerRolesCell
              roles={(journey?.roles as CustomerRole[] | undefined) ?? customer.roles}
            />
          </Stack>

          {journey?.referredBy ? (
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Indicada por <strong>{journey.referredBy}</strong>.
            </Typography>
          ) : null}

          <Divider />

          <Stack spacing={1}>
            <Stack direction="row" sx={{ justifyContent: "space-between" }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
                O QUE JÁ COMPROU
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                {formatCents(totalCents)}
              </Typography>
            </Stack>

            {query.isPending ? (
              <Typography variant="caption" sx={{ color: "text.disabled" }}>
                Carregando…
              </Typography>
            ) : journey && journey.purchases.length > 0 ? (
              journey.purchases.map((purchase) => (
                <Stack
                  key={purchase.id}
                  direction="row"
                  spacing={1}
                  sx={{ justifyContent: "space-between", alignItems: "baseline" }}
                >
                  <Stack spacing={0}>
                    <Typography variant="body2">{purchase.productName}</Typography>
                    <Typography variant="caption" sx={{ color: "text.disabled" }}>
                      {purchase.number} · {formatDate(purchase.createdAt)} ·{" "}
                      {purchase.financialStatus}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatCents(purchase.netCents)}
                  </Typography>
                </Stack>
              ))
            ) : (
              <Typography variant="caption" sx={{ color: "text.disabled" }}>
                Ainda não comprou nada — é lead ou participante de evento.
              </Typography>
            )}
          </Stack>

          <Divider />

          <Stack spacing={1}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
              EVENTOS EM QUE ESTEVE
            </Typography>
            {journey && journey.events.length > 0 ? (
              journey.events.map((event) => (
                <Stack
                  key={event.id}
                  direction="row"
                  spacing={1}
                  sx={{ justifyContent: "space-between" }}
                >
                  <Typography variant="body2">{event.editionName}</Typography>
                  <Badge
                    label={event.status.replace(/_/g, " ")}
                    size="small"
                    variant="outlined"
                    sx={{ height: 20 }}
                  />
                </Stack>
              ))
            ) : (
              <Typography variant="caption" sx={{ color: "text.disabled" }}>
                Nunca esteve numa sala nossa.
              </Typography>
            )}
          </Stack>

          <Divider />

          <Stack spacing={1}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
              QUEM ESTA PESSOA INDICOU
            </Typography>
            {journey && journey.referrals.length > 0 ? (
              journey.referrals.map((referral) => (
                <Typography key={referral.id} variant="body2">
                  {referral.name}
                  <Typography component="span" variant="caption" sx={{ color: "text.disabled" }}>
                    {" "}
                    · {formatDate(referral.createdAt)}
                  </Typography>
                </Typography>
              ))
            ) : (
              <Typography variant="caption" sx={{ color: "text.disabled" }}>
                Nenhuma indicação registrada.
              </Typography>
            )}
          </Stack>
        </Stack>
      ) : null}
    </Drawer>
  );
}
