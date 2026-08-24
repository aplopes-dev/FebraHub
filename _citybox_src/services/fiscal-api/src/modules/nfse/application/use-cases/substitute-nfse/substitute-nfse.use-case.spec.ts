import {
  baseIssueNfseDto,
  buildIssueNfseTestContext,
  seedIlheusCompanyWithValidCertificate,
  type IssueNfseTestContext,
} from '../../../tests/fixtures/issue-nfse-test-context';
import { MunicipalParameters } from '../../../domain/entities/municipal-parameters.entity';
import { FiscalDocument } from '../../../../fiscal-documents/domain/entities/fiscal-document.entity';
import { NfseSubstitutionNotAllowedError } from '../../../domain/errors/nfse-substitution-not-allowed.error';
import { NfseDocumentNotAuthorizedError } from '../../../domain/errors/nfse-document-not-authorized.error';
import type { SubstituteNfseDto } from '../../dtos/nfse.dto';

const DAYS_10_MS = 10 * 24 * 60 * 60 * 1000;

async function publishParameters(
  ctx: IssueNfseTestContext,
  cityCodeIbge: string,
  parameters: Record<string, unknown>,
): Promise<void> {
  await ctx.municipalParametersRepository.save(
    MunicipalParameters.create({
      cityCodeIbge,
      parameters,
      fetchedAt: new Date(),
    }),
  );
}

/// A original precisa ter CHAVE DE NFS-e (50 dígitos) para ser substituída —
/// `chSubstda` a exige. O fake devolve só o `Id` da DPS por padrão, então os
/// testes de substituição a definem explicitamente.
const CHAVE_ORIGINAL = '9'.repeat(50);

function substitutionDto(
  originalId: string,
  companyId: string,
  overrides: Partial<SubstituteNfseDto> = {},
): SubstituteNfseDto {
  return {
    fiscalDocumentId: originalId,
    replacement: baseIssueNfseDto(companyId, {
      externalReference: 'SUBST-001',
      idempotencyKey: 'subst-001',
    }),
    reasonCode: '05',
    reasonText: 'Rejeicao da nota pelo tomador do servico prestado',
    ...overrides,
  };
}

/// US3/T029 — substituição e suas quatro recusas.
describe('SubstituteNfseUseCase', () => {
  it('issues the replacement and links it to the original through the event', async () => {
    const ctx = buildIssueNfseTestContext();
    const { company } = await seedIlheusCompanyWithValidCertificate(ctx);
    await publishParameters(ctx, company.cityCodeIbge, {
      prazoSubstituicao: 30,
    });
    ctx.fakeProvider.issueResult = {
      status: 'AUTHORIZED',
      accessKey: CHAVE_ORIGINAL,
      protocol: CHAVE_ORIGINAL,
    };
    const original = await ctx.issueNfseUseCase.execute(
      baseIssueNfseDto(company.id),
    );

    const result = await ctx.substituteNfseUseCase.execute(
      substitutionDto(original.id, company.id),
    );

    // Duas notas distintas: o Padrão Nacional gera uma NFS-e independente, e o
    // vínculo vive no evento, não na nota.
    expect(result.substitute.id).not.toBe(original.id);
    expect(result.substitute.status).toBe('AUTHORIZED');
    expect(result.original.status).toBe('CANCEL_AUTHORIZED');

    const events = await ctx.fiscalEventRepository.findByFiscalDocumentId(
      original.id,
    );
    const substitutionEvent = events.find(
      (event) => event.nationalEventCode === 'e105102',
    );
    expect(substitutionEvent).toBeDefined();
    // O vínculo: é por aqui que a auditoria chega da original à substituta.
    expect(substitutionEvent?.replacedByDocumentId).toBe(result.substitute.id);
  });

  it('refuses substitution once the published window has passed', async () => {
    const ctx = buildIssueNfseTestContext();
    const { company } = await seedIlheusCompanyWithValidCertificate(ctx);
    await publishParameters(ctx, company.cityCodeIbge, {
      prazoSubstituicao: 5,
    });
    ctx.fakeProvider.issueResult = {
      status: 'AUTHORIZED',
      accessKey: CHAVE_ORIGINAL,
      protocol: CHAVE_ORIGINAL,
    };
    const original = await ctx.issueNfseUseCase.execute(
      baseIssueNfseDto(company.id),
    );

    await ctx.fiscalDocumentRepository.save(
      FiscalDocument.with(
        { ...original.props, authorizedAt: new Date(Date.now() - DAYS_10_MS) },
        original.id,
      ).withItems(original.items),
    );

    await expect(
      ctx.substituteNfseUseCase.execute(
        substitutionDto(original.id, company.id),
      ),
    ).rejects.toBeInstanceOf(NfseSubstitutionNotAllowedError);

    // Nenhuma nota nova foi emitida: a recusa vem ANTES da emissão, senão
    // sobraria uma nota extra viva.
    expect(ctx.fakeProvider.issueCallCount).toBe(1);
  });

  it('refuses while the municipality holds an official block on the note', async () => {
    const ctx = buildIssueNfseTestContext();
    const { company } = await seedIlheusCompanyWithValidCertificate(ctx);
    await publishParameters(ctx, company.cityCodeIbge, {
      prazoSubstituicao: 30,
    });
    ctx.fakeProvider.issueResult = {
      status: 'AUTHORIZED',
      accessKey: CHAVE_ORIGINAL,
      protocol: CHAVE_ORIGINAL,
    };
    const original = await ctx.issueNfseUseCase.execute(
      baseIssueNfseDto(company.id),
    );

    await expect(
      ctx.substituteNfseUseCase.execute(
        substitutionDto(original.id, company.id, { hasOfficialBlock: true }),
      ),
    ).rejects.toBeInstanceOf(NfseSubstitutionNotAllowedError);
  });

  it('refuses a document that is not AUTHORIZED', async () => {
    const ctx = buildIssueNfseTestContext();
    const { company } = await seedIlheusCompanyWithValidCertificate(ctx);
    await publishParameters(ctx, company.cityCodeIbge, {
      prazoSubstituicao: 30,
    });
    ctx.fakeProvider.issueResult = {
      status: 'AUTHORIZED',
      accessKey: CHAVE_ORIGINAL,
      protocol: CHAVE_ORIGINAL,
    };
    const original = await ctx.issueNfseUseCase.execute(
      baseIssueNfseDto(company.id),
    );

    // Já substituída uma vez — a segunda tentativa não encontra AUTHORIZED.
    await ctx.substituteNfseUseCase.execute(
      substitutionDto(original.id, company.id),
    );

    await expect(
      ctx.substituteNfseUseCase.execute(
        substitutionDto(original.id, company.id, {
          replacement: baseIssueNfseDto(company.id, {
            externalReference: 'SUBST-002',
            idempotencyKey: 'subst-002',
          }),
        }),
      ),
    ).rejects.toBeInstanceOf(NfseDocumentNotAuthorizedError);
  });

  /// Se a nota nova não for autorizada, o evento NÃO pode ser registrado:
  /// `chSubstituta` apontaria para uma nota que não existe, e a original ficaria
  /// cancelada sem substituta — o serviço prestado sem nota nenhuma.
  it('leaves the original valid when the replacement is not authorized', async () => {
    const ctx = buildIssueNfseTestContext();
    const { company } = await seedIlheusCompanyWithValidCertificate(ctx);
    await publishParameters(ctx, company.cityCodeIbge, {
      prazoSubstituicao: 30,
    });
    ctx.fakeProvider.issueResult = {
      status: 'AUTHORIZED',
      accessKey: CHAVE_ORIGINAL,
      protocol: CHAVE_ORIGINAL,
    };
    const original = await ctx.issueNfseUseCase.execute(
      baseIssueNfseDto(company.id),
    );

    // Só a substituta é recusada; a original já foi autorizada acima.
    ctx.fakeProvider.issueResult = {
      status: 'REJECTED',
      errorMessage: 'Rejeicao simulada da nota substituta',
    };

    const result = await ctx.substituteNfseUseCase.execute(
      substitutionDto(original.id, company.id),
    );

    expect(result.substitute.status).toBe('REJECTED');
    expect(result.original.status).toBe('AUTHORIZED');
    expect(result.original.cancelledAt).toBeNull();

    const events = await ctx.fiscalEventRepository.findByFiscalDocumentId(
      original.id,
    );
    expect(
      events.find((event) => event.nationalEventCode === 'e105102'),
    ).toBeUndefined();
  });

  /// Sem prazo publicado a substituição agora PROSSEGUE — antes era bloqueada,
  /// e como Ilhéus não publica prazo nenhum o recurso nunca funcionava.
  it('proceeds when the municipality publishes no deadline', async () => {
    const ctx = buildIssueNfseTestContext();
    const { company } = await seedIlheusCompanyWithValidCertificate(ctx);
    await publishParameters(ctx, company.cityCodeIbge, {});
    ctx.fakeProvider.issueResult = {
      status: 'AUTHORIZED',
      accessKey: CHAVE_ORIGINAL,
      protocol: CHAVE_ORIGINAL,
    };
    const original = await ctx.issueNfseUseCase.execute(
      baseIssueNfseDto(company.id),
    );

    const resultado = await ctx.substituteNfseUseCase.execute(
      substitutionDto(original.id, company.id),
    );

    expect(resultado.substitute.status).toBe('AUTHORIZED');
    expect(resultado.original.status).toBe('CANCEL_AUTHORIZED');
  });
});
