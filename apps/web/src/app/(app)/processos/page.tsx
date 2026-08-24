"use client";
import { GuardaPermissao } from '@/components/auth/GuardaPermissao';
import { PainelProcessos } from '@/components/processos/PainelProcessos';
import '@/app/processos.css';
export default function PaginaProcessos(){return <GuardaPermissao permissoes={['processos.ver']}><PainelProcessos/></GuardaPermissao>}
