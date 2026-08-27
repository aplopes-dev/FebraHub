"use client";
import { GuardaPermissao } from '@/components/auth/GuardaPermissao';
import { PainelImplantacao } from '@/components/processos/PainelImplantacao';
import '@/app/processos.css';
export default function PaginaImplantacao(){return <GuardaPermissao permissoes={['processos.implantacao']}><PainelImplantacao/></GuardaPermissao>}
