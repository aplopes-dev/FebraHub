"use client";

import { useMemo } from "react";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import {
  Autocomplete,
  Button,
  FormControlLabel,
  IconButton,
  NumberInput,
  Radio,
  RadioGroup,
} from "@/ui";
import {
  PromotionField,
  PromotionSection,
} from "@/features/promotions/components/promotion-form/promotion-form-primitives";
import { createEmptyGiftItem } from "@/features/promotions/lib/promotion-form-values";
import { useCatalogProductsQuery } from "@/features/products/hooks/use-product-queries";
import type {
  GiftItem,
  GiftLimitMode,
  PromotionRules,
} from "@/features/promotions/types/promotion-form";

type GiftProductOption = {
  id: string;
  label: string;
  sku: string;
};

type PromotionGiftConfigProps = {
  rules: PromotionRules;
  onRulesChange: <K extends keyof PromotionRules>(
    key: K,
    value: PromotionRules[K],
  ) => void;
};

export function PromotionGiftConfig({
  rules,
  onRulesChange,
}: PromotionGiftConfigProps) {
  const productsQuery = useCatalogProductsQuery();
  const productOptions = useMemo<GiftProductOption[]>(
    () =>
      (productsQuery.data ?? []).map((product) => ({
        id: product.id,
        label: product.name,
        sku: product.sku,
      })),
    [productsQuery.data],
  );

  function updateGift(id: string, patch: Partial<GiftItem>) {
    onRulesChange(
      "gifts",
      rules.gifts.map((gift) =>
        gift.id === id ? { ...gift, ...patch } : gift,
      ),
    );
  }

  function addGift() {
    onRulesChange("gifts", [...rules.gifts, createEmptyGiftItem()]);
  }

  function removeGift(id: string) {
    onRulesChange(
      "gifts",
      rules.gifts.filter((gift) => gift.id !== id),
    );
  }

  return (
    <PromotionSection
      title="Configuração de brindes"
      description="Escolha os produtos oferecidos como brinde ao atingir a condição definida e defina os limites."
    >
      <Stack spacing={2.5}>
        <PromotionField label="Limitar por">
          <RadioGroup
            value={rules.giftLimitMode}
            onChange={(_, next) =>
              onRulesChange("giftLimitMode", next as GiftLimitMode)
            }
          >
            <Stack spacing={1}>
              <FormControlLabel
                value="per_gift_product"
                control={
                  <Radio
                    id="gift-limit-per-product"
                    size="small"
                    sx={{ mt: -0.25 }}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Produto de brinde
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary" }}
                    >
                      Define um limite individual para cada item de brinde
                      adicionado.
                    </Typography>
                  </Box>
                }
                sx={{ alignItems: "flex-start", m: 0 }}
              />
              <FormControlLabel
                value="total_units"
                control={
                  <Radio
                    id="gift-limit-total"
                    size="small"
                    sx={{ mt: -0.25 }}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Total de unidades
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary" }}
                    >
                      Define um limite total de brindes por pedido, somando
                      todas as unidades.
                    </Typography>
                  </Box>
                }
                sx={{ alignItems: "flex-start", m: 0 }}
              />
            </Stack>
          </RadioGroup>
        </PromotionField>

        <Box
          sx={{
            border: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
            borderRadius: 1,
            p: 2,
          }}
        >
          <Stack spacing={1.5}>
            <Stack
              direction="row"
              spacing={1.5}
              sx={{
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Brindes da promoção
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Escolha os produtos oferecidos como brinde e a quantidade
                  permitida.
                </Typography>
              </Box>
              <Button
                type="button"
                variant="outlined"
                size="small"
                startIcon={<AddIcon fontSize="small" />}
                onClick={addGift}
              >
                Adicionar brinde
              </Button>
            </Stack>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Produto brinde</TableCell>
                    <TableCell sx={{ width: 160 }}>Quantidade</TableCell>
                    <TableCell align="right" sx={{ width: 64 }}>
                      Ações
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rules.gifts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                        <Typography
                          variant="body2"
                          sx={{ color: "text.secondary" }}
                        >
                          Nenhum brinde adicionado.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    rules.gifts.map((gift) => {
                      const selected =
                        productOptions.find(
                          (option) => option.id === gift.productId,
                        ) ?? null;

                      return (
                        <TableRow key={gift.id}>
                          <TableCell>
                            <Autocomplete
                              options={productOptions}
                              value={selected}
                              onChange={(_, option) =>
                                updateGift(gift.id, {
                                  productId: option?.id ?? "",
                                })
                              }
                              getOptionLabel={(option) => option.label}
                              isOptionEqualToValue={(a, b) => a.id === b.id}
                              renderOption={(props, option) => (
                                <li {...props} key={option.id}>
                                  <Box>
                                    <Typography variant="body2">
                                      {option.label}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      sx={{ color: "text.secondary" }}
                                    >
                                      {option.sku}
                                    </Typography>
                                  </Box>
                                </li>
                              )}
                              placeholder="Selecionar produto"
                              noOptionsText="Nenhum produto encontrado."
                            />
                          </TableCell>
                          <TableCell>
                            <NumberInput
                              minValue={1}
                              value={gift.quantity}
                              onValueChange={(value) =>
                                updateGift(gift.id, { quantity: value })
                              }
                              aria-label="Quantidade do brinde"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              type="button"
                              size="small"
                              onClick={() => removeGift(gift.id)}
                              aria-label="Remover brinde"
                            >
                              <DeleteOutlinedIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </Box>

        <Box sx={{ maxWidth: 320 }}>
          <PromotionField
            label="Quantidade máxima total de brindes"
            htmlFor="gift-max-total"
            info="Limite total de brindes por cliente, somando todos os itens configurados acima."
          >
            <NumberInput
              id="gift-max-total"
              minValue={1}
              value={rules.maxTotalGifts}
              onValueChange={(value) => onRulesChange("maxTotalGifts", value)}
            />
          </PromotionField>
        </Box>
      </Stack>
    </PromotionSection>
  );
}
