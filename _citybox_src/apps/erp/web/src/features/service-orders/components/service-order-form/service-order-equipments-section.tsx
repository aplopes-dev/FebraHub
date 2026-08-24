"use client";

import AddIcon from "@mui/icons-material/Add";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Button, Checkbox, FormField, MenuItem, Select } from "@citybox/mui";
import { ServiceOrderSection } from "@/features/service-orders/components/service-order-form/service-order-section";
import { createEmptyEquipment } from "@/features/service-orders/lib/service-order-form-values";
import { useAllStocksQuery } from "@/features/stock/hooks/use-stock-queries";
import { SERVICE_ORDER_EQUIPMENT_STATUS_LABELS } from "@/features/service-orders/types/service-order";
import type {
  ServiceOrderEquipment,
  ServiceOrderEquipmentStatus,
} from "@/features/service-orders/types/service-order";

const EQUIPMENT_STATUS_ORDER: ServiceOrderEquipmentStatus[] = [
  "received",
  "on_bench",
  "in_repair",
  "awaiting_part",
  "repaired",
  "returned",
];

type ServiceOrderEquipmentsSectionProps = {
  equipments: ServiceOrderEquipment[];
  onUpdate: (id: string, patch: Partial<ServiceOrderEquipment>) => void;
  onAdd: (equipment: ServiceOrderEquipment) => void;
  onRemove: (id: string) => void;
};

export function ServiceOrderEquipmentsSection({
  equipments,
  onUpdate,
  onAdd,
  onRemove,
}: ServiceOrderEquipmentsSectionProps) {
  const stocksQuery = useAllStocksQuery();
  const stocks = stocksQuery.data ?? [];

  return (
    <ServiceOrderSection
      title="Equipamentos recebidos"
      description="O que o cliente deixou na loja. Cada item tem seu próprio laudo técnico, estoque provisório e status de acompanhamento."
    >
      <Stack spacing={2.5}>
        {equipments.length === 0 ? (
          <Typography
            variant="body2"
            sx={{ py: 3, textAlign: "center", color: "text.secondary" }}
          >
            Nenhum equipamento adicionado.
          </Typography>
        ) : (
          equipments.map((equipment, index) => (
            <Box
              key={equipment.id}
              sx={{
                borderRadius: 2,
                border: 1,
                borderColor: "divider",
                p: 2.5,
              }}
            >
              <Stack spacing={2.5}>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: "center", justifyContent: "space-between" }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Equipamento {index + 1}
                    {equipment.name ? ` — ${equipment.name}` : ""}
                  </Typography>
                  <IconButton
                    type="button"
                    size="small"
                    aria-label={`Remover equipamento ${index + 1}`}
                    onClick={() => onRemove(equipment.id)}
                  >
                    <DeleteOutlinedIcon fontSize="small" />
                  </IconButton>
                </Stack>

                <Box
                  sx={{
                    display: "grid",
                    gap: 2,
                    gridTemplateColumns: { sm: "1fr 1fr" },
                  }}
                >
                  <FormField
                    id={`eq-name-${equipment.id}`}
                    label="Item"
                    value={equipment.name}
                    onChange={(event) =>
                      onUpdate(equipment.id, { name: event.target.value })
                    }
                    placeholder="Ex.: Notebook Dell Inspiron 15"
                  />
                  <FormField
                    id={`eq-brand-${equipment.id}`}
                    label="Marca / modelo"
                    value={equipment.brandModel}
                    onChange={(event) =>
                      onUpdate(equipment.id, {
                        brandModel: event.target.value,
                      })
                    }
                    placeholder="Ex.: Dell · Inspiron 5510"
                  />
                </Box>

                <Box
                  sx={{
                    display: "grid",
                    gap: 2,
                    gridTemplateColumns: { sm: "1fr 1fr 1fr" },
                  }}
                >
                  <FormField
                    id={`eq-serial-${equipment.id}`}
                    label="Nº de série / IMEI"
                    value={equipment.serialNumber}
                    onChange={(event) =>
                      onUpdate(equipment.id, {
                        serialNumber: event.target.value,
                      })
                    }
                    placeholder="Código de rastreio do item"
                  />

                  <FormControl fullWidth>
                    <InputLabel id={`eq-warehouse-label-${equipment.id}`}>
                      Estoque provisório
                    </InputLabel>
                    <Select
                      labelId={`eq-warehouse-label-${equipment.id}`}
                      id={`eq-warehouse-${equipment.id}`}
                      label="Estoque provisório"
                      value={equipment.warehouseId}
                      onChange={(event) =>
                        onUpdate(equipment.id, {
                          warehouseId: String(event.target.value),
                        })
                      }
                    >
                      {stocks.map((stock) => (
                        <MenuItem key={stock.id} value={stock.id}>
                          {stock.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel id={`eq-status-label-${equipment.id}`}>
                      Status do item
                    </InputLabel>
                    <Select
                      labelId={`eq-status-label-${equipment.id}`}
                      id={`eq-status-${equipment.id}`}
                      label="Status do item"
                      value={equipment.status}
                      onChange={(event) =>
                        onUpdate(equipment.id, {
                          status: event.target.value as ServiceOrderEquipmentStatus,
                        })
                      }
                    >
                      {EQUIPMENT_STATUS_ORDER.map((status) => (
                        <MenuItem key={status} value={status}>
                          {SERVICE_ORDER_EQUIPMENT_STATUS_LABELS[status]}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Stack direction="row" spacing={3} sx={{ flexWrap: "wrap" }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={equipment.received}
                        onChange={(event) =>
                          onUpdate(equipment.id, {
                            received: event.target.checked,
                          })
                        }
                      />
                    }
                    label="Item já foi recebido"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={equipment.returned}
                        onChange={(event) =>
                          onUpdate(equipment.id, {
                            returned: event.target.checked,
                          })
                        }
                      />
                    }
                    label="Item já foi devolvido"
                  />
                </Stack>

                <Divider />

                <Stack spacing={2}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Laudo técnico
                  </Typography>
                  <Box
                    sx={{
                      display: "grid",
                      gap: 2,
                      gridTemplateColumns: { sm: "1fr 1fr" },
                    }}
                  >
                    <FormField
                      id={`eq-reported-${equipment.id}`}
                      label="Defeito declarado"
                      value={equipment.reportedIssue}
                      onChange={(event) =>
                        onUpdate(equipment.id, {
                          reportedIssue: event.target.value,
                        })
                      }
                      placeholder="O que o cliente relatou na entrada."
                      multiline
                      minRows={3}
                    />
                    <FormField
                      id={`eq-found-${equipment.id}`}
                      label="Defeito encontrado"
                      value={equipment.foundIssue}
                      onChange={(event) =>
                        onUpdate(equipment.id, {
                          foundIssue: event.target.value,
                        })
                      }
                      placeholder="O que o técnico diagnosticou."
                      multiline
                      minRows={3}
                    />
                    <FormField
                      id={`eq-solution-${equipment.id}`}
                      label="Solução"
                      value={equipment.solution}
                      onChange={(event) =>
                        onUpdate(equipment.id, {
                          solution: event.target.value,
                        })
                      }
                      placeholder="O que foi feito para resolver."
                      multiline
                      minRows={3}
                    />
                    <FormField
                      id={`eq-notes-${equipment.id}`}
                      label="Observação"
                      value={equipment.notes}
                      onChange={(event) =>
                        onUpdate(equipment.id, { notes: event.target.value })
                      }
                      placeholder="Acessórios deixados, estado físico, avisos…"
                      multiline
                      minRows={3}
                    />
                  </Box>
                </Stack>
              </Stack>
            </Box>
          ))
        )}

        <Button
          type="button"
          variant="outlined"
          startIcon={<AddIcon fontSize="small" />}
          onClick={() => onAdd(createEmptyEquipment())}
          sx={{ alignSelf: "flex-start" }}
        >
          Adicionar equipamento
        </Button>
      </Stack>
    </ServiceOrderSection>
  );
}
