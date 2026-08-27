"use client";

import AddIcon from "@mui/icons-material/Add";
import Stack from "@mui/material/Stack";
import { Button } from "@/ui";
import { CustomerAddressCard } from "@/features/customers/components/customer-address-card";
import { CustomerSection } from "@/features/customers/components/customer-section";
import {
  createEmptyAddress,
  type AddressType,
  type CustomerAddressForm,
} from "@/features/customers/types/customer-form";

type CustomerAddressesSectionProps = {
  addresses: CustomerAddressForm[];
  onChange: (addresses: CustomerAddressForm[]) => void;
};

export function CustomerAddressesSection({
  addresses,
  onChange,
}: CustomerAddressesSectionProps) {
  function addAddress() {
    const nextType: AddressType =
      addresses.length === 0 ? "principal" : "entrega";
    onChange([...addresses, createEmptyAddress(nextType)]);
  }

  function updateAddress(id: string, partial: Partial<CustomerAddressForm>) {
    onChange(
      addresses.map((address) => {
        if (address.id !== id) {
          if (
            partial.addressType === "principal" &&
            address.addressType === "principal"
          ) {
            return { ...address, addressType: "outro" };
          }
          return address;
        }
        return { ...address, ...partial };
      }),
    );
  }

  function removeAddress(id: string) {
    onChange(addresses.filter((address) => address.id !== id));
  }

  return (
    <CustomerSection
      title="Endereços"
      description="Detalhes necessários para localizar o cliente de forma precisa, seja para envio de produtos ou outros fins."
    >
      {addresses.length === 0 ? (
        <Button
          type="button"
          variant="outlined"
          fullWidth
          startIcon={<AddIcon fontSize="small" />}
          onClick={addAddress}
          sx={{
            borderStyle: "dashed",
            py: 4,
          }}
        >
          Adicionar endereço
        </Button>
      ) : (
        <Stack spacing={3}>
          {addresses.map((address, index) => (
            <CustomerAddressCard
              key={address.id}
              address={address}
              index={index}
              onChange={(partial) => updateAddress(address.id, partial)}
              onRemove={() => removeAddress(address.id)}
            />
          ))}

          <Button
            type="button"
            variant="text"
            startIcon={<AddIcon fontSize="small" />}
            onClick={addAddress}
            sx={{ alignSelf: "flex-start", px: 0 }}
          >
            Novo endereço
          </Button>
        </Stack>
      )}
    </CustomerSection>
  );
}
