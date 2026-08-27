"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useParams } from "next/navigation";
import { BackButton } from "@/components/ui/form";
import { PromotionCreateView } from "@/features/promotions/components/promotion-form/promotion-create-view";
import { promotionToFormValues } from "@/features/promotions/lib/promotion-form-values";
import { getPromotionById } from "@/features/promotions/services/promotion.service";

export function PromotionEditPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const promotion = getPromotionById(id);

  if (!promotion) {
    return (
      <Box
        sx={{
          display: "flex",
          height: "100%",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          textAlign: "center",
        }}
      >
        <Stack spacing={0.5}>
          <Typography variant="h6" component="h1" sx={{ fontWeight: 600 }}>
            Promoção não encontrada
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            A promoção que você tentou abrir não existe mais ou foi removida.
          </Typography>
        </Stack>
        <BackButton href="/vendas/promocoes" label="Voltar para Promoções" />
      </Box>
    );
  }

  return (
    <PromotionCreateView
      key={promotion.id}
      promotionId={promotion.id}
      initialValues={promotionToFormValues(promotion)}
    />
  );
}
