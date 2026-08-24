import { SetMemberPdvPinUseCase } from './set-member-pdv-pin.use-case';
import { MembershipPdvCodeTakenError } from '../../../domain/errors/membership-pdv-code-taken.error';
import {
  makeRepositories,
  MEMBERSHIP_ID,
  ORGANIZATION_ID,
} from '../../../tests/tenancy-test-factory';

describe('SetMemberPdvPinUseCase', () => {
  async function setup() {
    const repos = makeRepositories();
    await repos.seedOwner();
    await repos.seedMember();
    const useCase = new SetMemberPdvPinUseCase(repos.membershipRepository);
    return { ...repos, useCase };
  }

  it('grava código e PIN juntos quando o membro ainda não tem pdvCode (create no ERP)', async () => {
    const { useCase, membershipRepository } = await setup();

    const detail = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      membershipId: MEMBERSHIP_ID,
      pin: '1234',
      pdvCode: '01',
    });

    expect(detail.membership.pdvCode).toBe('01');
    expect(detail.membership.hasPdvPin).toBe(true);

    const stored = await membershipRepository.findById(
      ORGANIZATION_ID,
      MEMBERSHIP_ID,
    );
    expect(stored?.membership.pdvCode).toBe('01');
    expect(stored?.membership.pdvPinHash).toMatch(/^scrypt\$/);
  });

  it('recusa PIN sem código quando o membro ainda não tem pdvCode', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        membershipId: MEMBERSHIP_ID,
        pin: '1234',
      }),
    ).rejects.toBeInstanceOf(MembershipPdvCodeTakenError);
  });

  it('aceita só o PIN quando o código já está gravado', async () => {
    const { useCase, membershipRepository } = await setup();
    const existing = await membershipRepository.findById(
      ORGANIZATION_ID,
      MEMBERSHIP_ID,
    );
    await membershipRepository.save(
      existing!.membership.update({
        role: existing!.membership.role,
        active: existing!.membership.active,
        pdvCode: '07',
      }),
    );

    const detail = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      membershipId: MEMBERSHIP_ID,
      pin: '9876',
    });

    expect(detail.membership.pdvCode).toBe('07');
    expect(detail.membership.hasPdvPin).toBe(true);
  });
});
