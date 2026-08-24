import { Injectable } from '@nestjs/common';
import {
  StatusProbe,
  type ProbeInput,
  type ProbeResult,
} from '../domain/status-probe';

/// Sonda de disponibilidade para NFS-e (Sistema Nacional / Sefin Nacional).
///
/// ⚠️ Hoje retorna sempre `UNVERIFIABLE` (spec fiscal/001 R2). Não foi possível
/// confirmar que o Sistema Nacional exponha operação de disponibilidade — a
/// documentação exige certificado até para ser lida. Retornar `UNVERIFIABLE` é
/// honesto (FR-002/FR-003); a alternativa — chamar uma operação de emissão só
/// para "ver se responde" — consumiria cota do órgão e mentiria sobre o que
/// mede, então foi descartada.
///
/// Quando a operação for confirmada com um certificado utilizável, este probe
/// passa a fazer o contato real; o contrato da feature não muda (US2/T025).
///
/// 🚩 **Verificação pendente (não bloqueante, spec fiscal/001 R2):** ler a doc
/// do Sistema Nacional via mTLS (certificado de cliente) e checar se existe
/// operação de disponibilidade. Método em `specs/fiscal/001-sefaz-status/
/// research.md` R2. Enquanto não confirmada, `UNVERIFIABLE` é a resposta correta
/// — **não** substituir por sondagem sintética (consome cota e mente sobre o
/// que mede).
@Injectable()
export class NfseStatusProbe extends StatusProbe {
  probe(input: ProbeInput): Promise<ProbeResult> {
    void input;
    return Promise.resolve({
      status: 'UNVERIFIABLE',
      authority: 'SEFIN-NACIONAL',
      authorityMessage:
        'O Sistema Nacional da NFS-e não expõe operação de disponibilidade.',
      expectedReturnAt: null,
    });
  }
}
