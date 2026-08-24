import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import { Button } from "@citybox/mui/atoms";
import { FormField } from "@citybox/mui/molecules";
import { AuthShell } from "../AuthShell";
import { getThemeVariant } from "../theme-variant";
import type { KcContext } from "../KcContext";

type LoginUpdateProfileKcContext = Extract<
  KcContext,
  { pageId: "login-update-profile.ftl" }
>;

type ProfileAttribute =
  LoginUpdateProfileKcContext["profile"]["attributesByName"][string];

const FIELD_LABELS: Record<string, string> = {
  username: "Usuário",
  email: "E-mail",
  firstName: "Nome",
  lastName: "Sobrenome",
};

function attributeValue(attr: ProfileAttribute): string {
  if (typeof attr.value === "string") return attr.value;
  if (attr.values?.length) return attr.values[0] ?? "";
  return "";
}

function orderedAttributes(
  attributesByName: LoginUpdateProfileKcContext["profile"]["attributesByName"],
) {
  const order = ["firstName", "lastName", "email", "username"];
  const entries = Object.values(attributesByName);
  return entries.sort((a, b) => {
    const ai = order.indexOf(a.name);
    const bi = order.indexOf(b.name);
    if (ai === -1 && bi === -1) return a.name.localeCompare(b.name);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

/** Completar/atualizar perfil — exigido por required action do realm. */
export default function LoginUpdateProfile({
  kcContext,
}: {
  kcContext: LoginUpdateProfileKcContext;
}) {
  const { url, message, messagesPerField, profile, isAppInitiatedAction } =
    kcContext;
  const variant = getThemeVariant(kcContext);
  const [isLoading, setIsLoading] = useState(false);

  const attributes = useMemo(
    () =>
      orderedAttributes(profile.attributesByName).filter(
        (attr) => attr.name !== "password",
      ),
    [profile.attributesByName],
  );

  const allReadOnly =
    attributes.length > 0 && attributes.every((attr) => attr.readOnly);

  return (
    <AuthShell
      variant={variant}
      title="Confirmar perfil"
      subtitle={
        allReadOnly
          ? "Revise seus dados e continue para acessar o sistema."
          : "Confirme ou atualize seus dados para concluir o acesso."
      }
      message={message?.type === "error" || message?.type === "warning" ? message : undefined}
    >
      <Box
        component="form"
        id="kc-update-profile-form"
        action={url.loginAction}
        method="post"
        onSubmit={() => setIsLoading(true)}
      >
        <Stack spacing={2.5}>
          {attributes.map((attr) => {
            const value = attributeValue(attr);
            const label = FIELD_LABELS[attr.name] ?? attr.displayName ?? attr.name;

            if (attr.readOnly) {
              return (
                <Box key={attr.name}>
                  <input type="hidden" name={attr.name} value={value} />
                  <Box
                    sx={{
                      borderRadius: 1,
                      border: 1,
                      borderColor: "divider",
                      bgcolor: "muted.main",
                      px: 1.75,
                      py: 1.25,
                    }}
                  >
                    <Typography
                      variant="caption"
                      component="p"
                      sx={{ color: "text.secondary" }}
                    >
                      {label}
                    </Typography>
                    <Typography variant="body2">{value || "—"}</Typography>
                  </Box>
                </Box>
              );
            }

            return (
              <FormField
                key={attr.name}
                id={attr.name}
                name={attr.name}
                label={label}
                type={attr.name === "email" ? "email" : "text"}
                defaultValue={value}
                autoComplete={attr.autocomplete}
                required={attr.required}
                errorMessage={
                  messagesPerField.existsError(attr.name)
                    ? messagesPerField.getFirstError(attr.name)
                    : undefined
                }
              />
            );
          })}

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={isLoading}
            startIcon={
              isLoading ? <CircularProgress size={16} color="inherit" /> : undefined
            }
          >
            {isLoading ? "Salvando…" : "Continuar"}
          </Button>

          {isAppInitiatedAction && (
            <Button
              type="submit"
              name="cancel-aia"
              value="true"
              variant="text"
              color="inherit"
              fullWidth
              formNoValidate
            >
              Cancelar
            </Button>
          )}
        </Stack>
      </Box>
    </AuthShell>
  );
}
