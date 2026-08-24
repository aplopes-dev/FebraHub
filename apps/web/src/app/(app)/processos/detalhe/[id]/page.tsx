"use client";
import { useParams } from 'next/navigation';
import { GuardaPermissao } from '@/components/auth/GuardaPermissao';
import { WorkspaceProcesso } from '@/components/processos/WorkspaceProcesso';
import '@/app/processos.css';
import '@/app/processos-fluxo.css';
export default function PaginaDetalheProcesso(){const {id}=useParams<{id:string}>();return <GuardaPermissao permissoes={['processos.ver']}><WorkspaceProcesso id={id}/></GuardaPermissao>}
