"use client";

import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import CircularProgress from "@mui/material/CircularProgress";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import {
  FormControlLabel,
  FormField,
  IconButton,
  Radio,
  RadioGroup,
  Select,
} from "@/ui";
import { formatCep } from "@/lib/br-format";
import { useCustomerCepLookup } from "@/features/customers/hooks/use-customer-cep-lookup";
import { BR_STATES } from "@/lib/br-format";
import {
  ADDRESS_TYPE_LABELS,
  type AddressType,
  type CustomerAddressForm,
} from "@/features/customers/types/customer-form";

type CustomerAddressCardProps = {
  address: CustomerAddressForm;
  index: number;
  onChange: (partial: Partial<CustomerAddressForm>) => void;
  onRemove: () => void;
};

export function CustomerAddressCard({
  address,
  index,
  onChange,
  onRemove,
}: CustomerAddressCardProps) {
  const { isLoadingCep, cepFeedback, notifyCepUserChange } =
    useCustomerCepLookup({
      zipCode: address.zipCode,
      resetToken: address.id,
      onFill: (fields) => onChange(fields),
    });

  return (
    <Stack
      spacing={2.5}
      sx={{
        borderBottom: 1,
        borderColor: "divider",
        pb: 3,
        "&:last-of-type": { borderBottom: 0, pb: 0 },
      }}
    >
      <Box
        sx={{
          display: "grid",
          gap: 2.5,
          gridTemplateColumns: {
            sm: "10rem minmax(0, 1fr) 8rem",
          },
        }}
      >
        <div>
          <FormField
            id={`cus-zip-${address.id}`}
            label="CEP"
            value={address.zipCode}
            disabled={isLoadingCep}
            onChange={(event) => {
              notifyCepUserChange();
              onChange({ zipCode: formatCep(event.target.value) });
            }}
            slotProps={{
              input: {
                endAdornment: isLoadingCep ? (
                  <InputAdornment position="end">
                    <CircularProgress color="inherit" size={16} />
                  </InputAdornment>
                ) : undefined,
              },
            }}
          />
          {cepFeedback ? (
            <FormHelperText error sx={{ mt: 0.5, mx: 0 }}>
              {cepFeedback}
            </FormHelperText>
          ) : null}
        </div>
        <FormField
          id={`cus-street-${address.id}`}
          label="Rua"
          value={address.street}
          disabled={isLoadingCep}
          onChange={(event) => onChange({ street: event.target.value })}
        />
        <FormField
          id={`cus-number-${address.id}`}
          label="Número"
          value={address.number}
          disabled={isLoadingCep}
          onChange={(event) => onChange({ number: event.target.value })}
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 2.5,
          gridTemplateColumns: { sm: "repeat(3, minmax(0, 1fr))" },
        }}
      >
        <FormField
          id={`cus-district-${address.id}`}
          label="Bairro"
          value={address.district}
          disabled={isLoadingCep}
          onChange={(event) => onChange({ district: event.target.value })}
        />
        <FormField
          id={`cus-city-${address.id}`}
          label="Cidade"
          value={address.city}
          disabled={isLoadingCep}
          onChange={(event) => onChange({ city: event.target.value })}
        />
        <FormControl fullWidth disabled={isLoadingCep}>
          <InputLabel id={`cus-state-label-${address.id}`}>Estado</InputLabel>
          <Select
            labelId={`cus-state-label-${address.id}`}
            id={`cus-state-${address.id}`}
            value={address.state || ""}
            label="Estado"
            disabled={isLoadingCep}
            onChange={(event) =>
              onChange({ state: event.target.value as string })
            }
          >
            {BR_STATES.map((uf) => (
              <MenuItem key={uf} value={uf}>
                {uf}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "flex-end",
          gap: 1.5,
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <FormField
            id={`cus-complement-${address.id}`}
            label="Complemento (opcional)"
            value={address.complement}
            disabled={isLoadingCep}
            onChange={(event) => onChange({ complement: event.target.value })}
          />
        </Box>
        <IconButton
          aria-label={`Remover endereço ${index + 1}`}
          onClick={onRemove}
          disabled={isLoadingCep}
          sx={{ mb: 0.5 }}
        >
          <DeleteOutlined sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>

      <Box>
        <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
          Tipo de endereço
        </Typography>
        <RadioGroup
          row
          value={address.addressType}
          onChange={(event) =>
            onChange({
              addressType: event.target.value as AddressType,
            })
          }
          sx={{ flexWrap: "wrap", gap: 2 }}
        >
          {(Object.keys(ADDRESS_TYPE_LABELS) as AddressType[]).map((type) => (
            <FormControlLabel
              key={type}
              value={type}
              control={<Radio />}
              label={ADDRESS_TYPE_LABELS[type]}
              disabled={isLoadingCep}
            />
          ))}
        </RadioGroup>
      </Box>
    </Stack>
  );
}
