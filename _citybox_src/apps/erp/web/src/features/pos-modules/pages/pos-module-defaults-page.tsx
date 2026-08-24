"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import { Button, FormField, PageHeader, ScrollArea } from "@citybox/mui";
import { FormSection } from "@/components/ui/form";
import { ListLoadErrorAlert } from "@/components/ui/list-page";
import { ModuleSwitchList } from "@/features/pos-modules/components/module-switch-list";
import {
  usePosModuleDefaultsQuery,
  useSavePosModuleDefaultsMutation,
} from "@/features/pos-modules/hooks/use-pos-modules";
import {
  withModule,
  type PosModuleDefaults,
  type PosModuleStateMap,
} from "@/features/pos-modules/types/pos-module";

/** Full-bleed: o `main` do shell é `overflow: hidden`, e o scroll nasce aqui. */
const pageSx = {
  display: "flex",
  flexDirection: "column",
  flex: 1,
  minHeight: 0,
  minWidth: 0,
  overflow: "hidden",
  m: -3,
  width: (theme: { spacing: (n: number) => string }) =>
    `calc(100% + ${theme.spacing(6)})`,
  maxWidth: "none",
} as const;

const headerSx = { flexShrink: 0, mb: 0, px: 3, pt: 3, pb: 2 } as const;

export function PosModuleDefaultsPage() {
  const query = usePosModuleDefaultsQuery();

  if (query.isError) {
    return (
      <Box sx={pageSx}>
        <PageHeader sx={headerSx} title="Módulos" />
        <Box sx={{ px: 3 }}>
          <ListLoadErrorAlert
            title="Não foi possível carregar os módulos"
            onRetry={query.refetch}
          />
        </Box>
      </Box>
    );
  }

  if (!query.data) {
    return (
      <Box sx={pageSx}>
        <PageHeader sx={headerSx} title="Módulos" />
        <Box sx={{ px: 3 }}>
          <Skeleton variant="rounded" height={280} />
        </Box>
      </Box>
    );
  }

  // `key` no lugar de sincronizar por efeito — mesmo padrão de Alçadas.
  return <PosModuleDefaultsEditor key={query.data.updatedAt} defaults={query.data} />;
}

function PosModuleDefaultsEditor({ defaults }: { defaults: PosModuleDefaults }) {
  const saveMutation = useSavePosModuleDefaultsMutation();
  const [profileName, setProfileName] = useState<string>(
    defaults.profileName ?? "",
  );
  const [modules, setModules] = useState<PosModuleStateMap>(defaults.modules);

  return (
    <Box sx={pageSx}>
      <PageHeader
        sx={headerSx}
        title="Módulos"
        actions={
          <Button
            type="button"
            variant="contained"
            loading={saveMutation.isPending}
            onClick={() =>
              saveMutation.mutate({
                applyProfile: profileName || undefined,
                modules,
              })
            }
          >
            Salvar
          </Button>
        }
      />

      <ScrollArea sx={{ flex: 1, minHeight: 0, minWidth: 0 }}>
        <Box sx={{ px: 3, pb: 4, minWidth: 0 }}>
          <FormSection
            title="Perfil da loja"
            description="Um ponto de partida. Escolher um perfil liga o conjunto que aquele tipo de loja costuma usar; depois dá para ajustar chave a chave."
          >
            <Box sx={{ maxWidth: 360 }}>
              <FormField
                id="pos-module-profile"
                label="Perfil"
                select
                value={profileName}
                helperText={
                  profileName
                    ? "Ajustar as chaves abaixo tira o perfil — o conjunto passa a ser personalizado."
                    : "Conjunto personalizado."
                }
                onChange={(event) => {
                  // Aplica na hora, no cliente: o gerente precisa ver o efeito
                  // do perfil antes de salvar, não depois.
                  const next = event.target.value;
                  setProfileName(next);
                  setModules(profilePreview(defaults, next) ?? modules);
                }}
              >
                <MenuItem value="">Personalizado</MenuItem>
                {defaults.catalog.profiles.map((name) => (
                  <MenuItem key={name} value={name}>
                    {name}
                  </MenuItem>
                ))}
              </FormField>
            </Box>
          </FormSection>

          <FormSection
            title="Módulos disponíveis"
            description="O que os PDVs desta loja mostram. Cada caixa pode sobrescrever no próprio cadastro."
          >
            <ModuleSwitchList
              catalog={defaults.catalog.optional}
              modules={modules}
              onChange={(moduleId, on) => {
                setModules((current) => withModule(current, moduleId, on));
                // O conjunto deixou de ser o perfil — o seletor não pode
                // continuar afirmando que é.
                setProfileName("");
              }}
            />

            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Desligar um módulo <strong>esconde</strong> a tela; não apaga o
              que já existe. Pedido de delivery em rota continua no sistema,
              invisível até religar. Mesas e comandas ainda não entram nesta
              lista — feature em implementação.
            </Typography>
          </FormSection>
        </Box>
      </ScrollArea>
    </Box>
  );
}

/**
 * Prévia local do perfil.
 *
 * O servidor é quem tem os perfis, mas aplicar só no save deixaria o gerente
 * escolhendo às cegas. Como a resposta do save traz o conjunto real, uma
 * divergência aqui se corrige sozinha na volta — o custo de errar é zero.
 */
function profilePreview(
  defaults: PosModuleDefaults,
  profileName: string,
): PosModuleStateMap | null {
  if (!profileName) return null;
  return POS_MODULE_PROFILE_PREVIEW[profileName] ?? defaults.modules;
}

/** Espelho de `POS_MODULE_PROFILES` na API — ver o aviso lá. */
const POS_MODULE_PROFILE_PREVIEW: Record<string, PosModuleStateMap> = {
  Restaurante: {
    tables: "disabled",
    tabs: "disabled",
    service: "available",
    delivery: "available",
    delivery_orders: "available",
    price_check: "disabled",
  },
  "Lanchonete com delivery": {
    tables: "disabled",
    tabs: "disabled",
    service: "available",
    delivery: "available",
    delivery_orders: "available",
    price_check: "disabled",
  },
  Loja: {
    tables: "disabled",
    tabs: "disabled",
    service: "disabled",
    delivery: "disabled",
    delivery_orders: "disabled",
    price_check: "available",
  },
  Mercado: {
    tables: "disabled",
    tabs: "disabled",
    service: "disabled",
    delivery: "disabled",
    delivery_orders: "disabled",
    price_check: "available",
  },
};
