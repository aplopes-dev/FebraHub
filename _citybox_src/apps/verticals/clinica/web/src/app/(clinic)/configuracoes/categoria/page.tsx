import { redirect } from 'next/navigation';

/** Compat: rota antiga com abas → categorias de paciente. */
export default function ClinicSettingsCategoriaRedirectPage() {
  redirect('/configuracoes/categoria-paciente');
}
