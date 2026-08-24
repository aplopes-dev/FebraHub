"use client";
import { useParams } from 'next/navigation';
import { GuardaPermissao } from '@/components/auth/GuardaPermissao';
import { PainelProcessos } from '@/components/processos/PainelProcessos';
import '@/app/processos.css';
export default function PaginaSecao(){const {secao}=useParams<{secao:string}>();return <GuardaPermissao permissoes={['processos.ver']}><div aria-label={`Seção ${secao}`}><PainelProcessos/></div></GuardaPermissao>}
