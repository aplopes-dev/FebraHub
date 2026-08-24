"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { toast } from "@citybox/mui";
import { EntityFormFooter, FormSection } from "@/components/ui/form";
import { useUnsavedChangesGuard } from "@/features/fiscal-settings/lib/unsaved-guard";
import type { FiscalTaxRegime } from "@/features/fiscal-settings/api/fiscal-settings.dto";
import {
  UF_INTERNAL_DEFAULTS,
  UFS,
  icmsSituacaoOptions,
  isSimplesRegime,
} from "../lib/icms-options";
import {
  UfRateMatrix,
  createEmptyMatrix,
  matrixAliquotaFor,
  type MatrixState,
} from "./uf-rate-matrix";
import {
  useCreateIcmsGroupMutation,
  useUpdateIcmsGroupMutation,
  useIcmsGroupProductsQuery,
} from "../hooks/use-icms-groups";
import { businessErrorMessage } from "@/lib/api/business-error-message";
import type {
  IcmsGroupDetailDto,
  IcmsUfRateDto,
  UfRateType,
} from "../api/icms-group.dto";

const LIST_PATH = "/configuracoes/fiscal/grupos-icms";
const UNSAVED_KEY = "icms-group";

function errorMessage(error: unknown): string {
  return businessErrorMessage(error);
}

function parseAliquota(value: string): number {
  const trimmed = value.trim().replace(",", ".");
  if (!trimmed) return 0;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Reconstrói o estado da matriz a partir das alíquotas carregadas (edição). */
function matrixFromRates(
  rates: IcmsUfRateDto[],
  rateType: UfRateType,
  defaults: Record<string, number>,
): MatrixState {
  const base = createEmptyMatrix(defaults);
  const relevant = rates.filter((rate) => rate.rateType === rateType);
  // Sem linhas para esse tipo: mostra os defaults em modo "personalizado" (não
  // "valor único" vazio, que salvaria 0 em todas as UFs ao salvar sem tocar).
  if (relevant.length === 0) return { ...base, mode: "custom" };
  const byUf = { ...base.byUf };
  for (const rate of relevant) byUf[rate.uf] = String(rate.aliquota);
  // Se todas as UFs carregadas têm o mesmo valor, oferece como "valor único".
  const values = new Set(relevant.map((rate) => rate.aliquota));
  if (values.size === 1 && relevant.length === UFS.length) {
    return { mode: "single", single: String([...values][0]), byUf };
  }
  return { mode: "custom", single: "", byUf };
}

function toUfRates(
  interna: MatrixState,
  interestadual: MatrixState,
): IcmsUfRateDto[] {
  const rates: IcmsUfRateDto[] = [];
  for (const uf of UFS) {
    rates.push({
      uf,
      rateType: "INTERNA",
      aliquota: parseAliquota(matrixAliquotaFor(interna, uf)),
    });
    rates.push({
      uf,
      rateType: "INTERESTADUAL",
      aliquota: parseAliquota(matrixAliquotaFor(interestadual, uf)),
    });
  }
  return rates;
}

type IcmsGroupFormViewProps = {
  group?: IcmsGroupDetailDto;
  regime?: FiscalTaxRegime;
};

export function IcmsGroupFormView({ group, regime }: IcmsGroupFormViewProps) {
  const router = useRouter();
  const isEditing = Boolean(group);
  const simples = isSimplesRegime(regime);
  const situacaoOptions = icmsSituacaoOptions(regime);

  const [tab, setTab] = useState<"config" | "products">("config");
  const [name, setName] = useState(group?.name ?? "");
  // A situação é CST ou CSOSN — guardamos o valor cru; o `kind` sai das opções.
  const [situacao, setSituacao] = useState(
    group?.icmsCst ?? group?.icmsCsosn ?? "",
  );
  const [interna, setInterna] = useState<MatrixState>(() =>
    group
      ? matrixFromRates(group.ufRates, "INTERNA", UF_INTERNAL_DEFAULTS)
      : { ...createEmptyMatrix(UF_INTERNAL_DEFAULTS), mode: "custom" },
  );
  const [interestadual, setInterestadual] = useState<MatrixState>(() =>
    group ? matrixFromRates(group.ufRates, "INTERESTADUAL", {}) : createEmptyMatrix({}),
  );

  const createMutation = useCreateIcmsGroupMutation();
  const updateMutation = useUpdateIcmsGroupMutation(group?.id ?? "");
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const [hasSavedOnce, setHasSavedOnce] = useState(false);

  // Estado inicial de referência (o mesmo usado para semear os campos acima),
  // recomputado durante o render — sem effect — para detectar alterações.
  const initialSituacao = group?.icmsCst ?? group?.icmsCsosn ?? "";
  const initialInterna = group
    ? matrixFromRates(group.ufRates, "INTERNA", UF_INTERNAL_DEFAULTS)
    : { ...createEmptyMatrix(UF_INTERNAL_DEFAULTS), mode: "custom" as const };
  const initialInterestadual = group
    ? matrixFromRates(group.ufRates, "INTERESTADUAL", {})
    : createEmptyMatrix({});
  const dirty =
    name !== (group?.name ?? "") ||
    situacao !== initialSituacao ||
    JSON.stringify(interna) !== JSON.stringify(initialInterna) ||
    JSON.stringify(interestadual) !== JSON.stringify(initialInterestadual);

  useUnsavedChangesGuard(UNSAVED_KEY, dirty);

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Informe o nome do grupo.");
      return;
    }
    if (!situacao) {
      toast.error("Selecione a situação do ICMS.");
      return;
    }
    const kind = situacaoOptions.find((option) => option.value === situacao)?.kind;
    // No Regime Normal (CST) as alíquotas por UF entram no XML — não deixa gravar
    // valores em branco/ inválidos (que virariam 0 silencioso). No Simples (CSOSN)
    // as matrizes não têm efeito, então não bloqueiam.
    if (kind === "cst") {
      const invalid = UFS.some((uf) => {
        for (const matrix of [interna, interestadual]) {
          const raw = matrixAliquotaFor(matrix, uf).trim();
          if (raw === "") return true;
          const parsed = Number(raw.replace(",", "."));
          if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) return true;
        }
        return false;
      });
      if (invalid) {
        toast.error(
          "Preencha as alíquotas de ICMS (0 a 100) para todas as UFs nas duas matrizes.",
        );
        return;
      }
    }
    const payload = {
      name: name.trim(),
      icmsCst: kind === "cst" ? situacao : null,
      icmsCsosn: kind === "csosn" ? situacao : null,
      ufRates: toUfRates(interna, interestadual),
    };
    try {
      if (isEditing) {
        await updateMutation.mutateAsync(payload);
        setHasSavedOnce(true);
        toast.success("Grupo atualizado.");
      } else {
        const created = await createMutation.mutateAsync(payload);
        toast.success("Grupo criado.");
        router.replace(`${LIST_PATH}/${created.id}`);
      }
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  function handleDiscard() {
    setName(group?.name ?? "");
    setSituacao(initialSituacao);
    setInterna(initialInterna);
    setInterestadual(initialInterestadual);
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <Tabs
        value={tab}
        onChange={(_event, next: "config" | "products") => setTab(next)}
        sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}
      >
        <Tab value="config" label="Configuração" />
        <Tab
          value="products"
          label="Produtos"
          disabled={!isEditing}
          title={isEditing ? undefined : "Salve o grupo para ver os produtos"}
        />
      </Tabs>

      {tab === "config" ? (
        <Stack spacing={3}>
          <FormSection
            title="Informações Gerais"
            description="Nome e situação tributária do ICMS deste grupo."
          >
            <Stack spacing={2} sx={{ maxWidth: 520 }}>
              <TextField
                label="Nome"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={isSaving}
                slotProps={{ htmlInput: { maxLength: 120 } }}
                required
              />
              <FormControl fullWidth required disabled={isSaving}>
                <InputLabel id="icms-situacao-label">
                  Situação do ICMS
                </InputLabel>
                <Select
                  labelId="icms-situacao-label"
                  label="Situação do ICMS"
                  value={situacao}
                  onChange={(event) => setSituacao(event.target.value)}
                >
                  {situacaoOptions.map((option) => (
                    <MenuItem
                      key={option.value}
                      value={option.value}
                      disabled={Boolean(option.disabledReason)}
                    >
                      {option.label}
                      {option.disabledReason
                        ? ` — ${option.disabledReason}`
                        : ""}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </FormSection>

          {simples ? (
            <Alert severity="info">
              No Simples Nacional a nota sai como CSOSN, que não carrega alíquota
              de ICMS — as matrizes por UF abaixo não têm efeito na emissão. O
              grupo serve para fixar o CSOSN.
            </Alert>
          ) : null}

          <FormSection
            title="ICMS Padrão para Estados"
            description="Alíquota interna do ICMS por UF (venda dentro do estado de destino)."
          >
            <UfRateMatrix
              title="ICMS interno"
              description="Aplicado quando a UF de destino é a mesma do Emitente."
              state={interna}
              disabled={isSaving}
              onChange={setInterna}
            />
          </FormSection>

          <FormSection
            title="ICMS Interestadual"
            description="Alíquota interestadual do ICMS por UF de destino."
          >
            <UfRateMatrix
              title="ICMS interestadual"
              description="Aplicado quando a UF de destino é diferente da do Emitente."
              state={interestadual}
              disabled={isSaving}
              onChange={setInterestadual}
            />
          </FormSection>

        </Stack>
      ) : (
        <ProductsTab groupId={group?.id ?? null} />
      )}

      {tab === "config" ? (
        <Box sx={{ position: "sticky", bottom: 0, zIndex: 1, mt: 3 }}>
          <EntityFormFooter
            mode="dirty"
            ariaLabel="Ações do formulário de Grupo de ICMS"
            isDirty={dirty}
            hasSavedOnce={hasSavedOnce}
            isSaving={isSaving}
            savedMessage="Grupo atualizado"
            onCancel={() => undefined}
            onDiscard={handleDiscard}
            onSave={() => void handleSave()}
          />
        </Box>
      ) : null}
    </Box>
  );
}

function ProductsTab({ groupId }: { groupId: string | null }) {
  const productsQuery = useIcmsGroupProductsQuery(groupId);

  if (productsQuery.isPending) {
    return (
      <Typography variant="body2" color="text.secondary">
        Carregando produtos…
      </Typography>
    );
  }
  if (productsQuery.isError) {
    return <Alert severity="error">Não foi possível carregar os produtos.</Alert>;
  }
  const products = productsQuery.data ?? [];
  if (products.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        Nenhum produto usa este grupo ainda.
      </Typography>
    );
  }
  return (
    <Stack spacing={1}>
      {products.map((product) => (
        <Box
          key={product.productId}
          sx={{
            display: "flex",
            justifyContent: "space-between",
            p: 1.5,
            border: 1,
            borderColor: "divider",
            borderRadius: 1.5,
          }}
        >
          <Typography variant="body2">{product.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {product.sku}
          </Typography>
        </Box>
      ))}
    </Stack>
  );
}
