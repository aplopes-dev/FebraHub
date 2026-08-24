import { Injectable } from '@nestjs/common';
import { PatientCategoryRepository } from '../../patient-categories/domain/repositories/patient-category.repository.interface';
import { PatientCategoryNotFoundError } from '../../patient-categories/domain/errors/patient-category-not-found.error';
import { PatientReferralOriginRepository } from '../../patient-referral-origins/domain/repositories/patient-referral-origin.repository.interface';
import { PatientReferralOriginNotFoundError } from '../../patient-referral-origins/domain/errors/patient-referral-origin-not-found.error';
import { ExternalReferralProfessionalRepository } from '../../patient-external-professionals/domain/repositories/external-referral-professional.repository.interface';
import { ExternalReferralProfessionalNotFoundError } from '../../patient-external-professionals/domain/errors/external-referral-professional-not-found.error';
import { ClinicPlanRepository } from '../../../clinic-plans/domain/repositories/clinic-plan.repository.interface';
import { PatientPlanNotFoundError } from '../../domain/errors/patient-plan-not-found.error';
import { PatientRepository } from '../../domain/repositories/patient.repository.interface';
import { PatientCpfTakenError } from '../../domain/errors/patient-cpf-taken.error';
import { PatientReferralInvalidError } from '../../domain/errors/patient-referral-invalid.error';
import { PatientNotFoundError } from '../../domain/errors/patient-not-found.error';
import type { PatientUpsertInput } from '../../domain/entities/patient.entity';

export type ResolvedReferralFields = {
  referralOriginId: string | null;
  referredByPatientId: string | null;
  referredByMemberId: string | null;
  referredByMemberName: string | null;
  referredByExternalProfessionalId: string | null;
};

@Injectable()
export class ValidatePatientReferencesService {
  constructor(
    private readonly categoryRepository: PatientCategoryRepository,
    private readonly referralOriginRepository: PatientReferralOriginRepository,
    private readonly externalProfessionalRepository: ExternalReferralProfessionalRepository,
    private readonly planRepository: ClinicPlanRepository,
    private readonly patientRepository: PatientRepository,
  ) {}

  async resolveCategoryId(
    storeId: string,
    categoryId?: string,
  ): Promise<string> {
    const trimmed = categoryId?.trim();
    if (trimmed) {
      const category = await this.categoryRepository.findById(storeId, trimmed);
      if (!category) {
        throw new PatientCategoryNotFoundError(
          ValidatePatientReferencesService.name,
          trimmed,
        );
      }
      return category.id;
    }

    const protectedCategory =
      await this.categoryRepository.findProtected(storeId);
    if (!protectedCategory) {
      throw new PatientCategoryNotFoundError(
        ValidatePatientReferencesService.name,
        'protected-default',
      );
    }
    return protectedCategory.id;
  }

  async assertPlanExists(
    storeId: string,
    planId: string | null,
  ): Promise<void> {
    if (!planId) return;
    const plan = await this.planRepository.findById(storeId, planId);
    if (!plan) {
      throw new PatientPlanNotFoundError(
        ValidatePatientReferencesService.name,
        planId,
      );
    }
  }

  async assertCpfAvailable(
    storeId: string,
    cpf: string | null,
    excludePatientId?: string,
  ): Promise<void> {
    if (!cpf) return;
    const existing = await this.patientRepository.findByCpf(
      storeId,
      cpf,
      excludePatientId,
    );
    if (existing) {
      throw new PatientCpfTakenError(
        ValidatePatientReferencesService.name,
        storeId,
      );
    }
  }

  async resolveReferralFields(
    storeId: string,
    upsert: PatientUpsertInput,
    patientId?: string,
  ): Promise<ResolvedReferralFields> {
    const originId = upsert.referralOriginId?.trim() || null;
    if (!originId) {
      return {
        referralOriginId: null,
        referredByPatientId: null,
        referredByMemberId: null,
        referredByMemberName: null,
        referredByExternalProfessionalId: null,
      };
    }

    const origin = await this.referralOriginRepository.findById(
      storeId,
      originId,
    );
    if (!origin) {
      throw new PatientReferralOriginNotFoundError(
        ValidatePatientReferencesService.name,
        originId,
      );
    }

    if (origin.systemKey === 'indicacao') {
      const referredByPatientId = upsert.referredByPatientId?.trim() || null;
      if (!referredByPatientId) {
        throw new PatientReferralInvalidError(
          ValidatePatientReferencesService.name,
          'Selecione o paciente que indicou',
        );
      }
      if (patientId && referredByPatientId === patientId) {
        throw new PatientReferralInvalidError(
          ValidatePatientReferencesService.name,
          'O paciente não pode indicar a si mesmo',
        );
      }
      const referrer = await this.patientRepository.findById(
        storeId,
        referredByPatientId,
      );
      if (!referrer) {
        throw new PatientNotFoundError(
          ValidatePatientReferencesService.name,
          referredByPatientId,
        );
      }
      return {
        referralOriginId: origin.id,
        referredByPatientId,
        referredByMemberId: null,
        referredByMemberName: null,
        referredByExternalProfessionalId: null,
      };
    }

    if (origin.systemKey === 'indicacao_profissional') {
      const referredByMemberId = upsert.referredByMemberId?.trim() || null;
      const referredByMemberName = upsert.referredByMemberName?.trim() || null;
      if (!referredByMemberId || !referredByMemberName) {
        throw new PatientReferralInvalidError(
          ValidatePatientReferencesService.name,
          'Selecione o profissional que indicou',
        );
      }
      return {
        referralOriginId: origin.id,
        referredByPatientId: null,
        referredByMemberId,
        referredByMemberName,
        referredByExternalProfessionalId: null,
      };
    }

    if (origin.systemKey === 'indicacao_profissional_externo') {
      const referredByExternalProfessionalId =
        upsert.referredByExternalProfessionalId?.trim() || null;
      if (!referredByExternalProfessionalId) {
        throw new PatientReferralInvalidError(
          ValidatePatientReferencesService.name,
          'Selecione o profissional externo que indicou',
        );
      }
      const professional = await this.externalProfessionalRepository.findById(
        storeId,
        referredByExternalProfessionalId,
      );
      if (!professional) {
        throw new ExternalReferralProfessionalNotFoundError(
          ValidatePatientReferencesService.name,
          referredByExternalProfessionalId,
        );
      }
      return {
        referralOriginId: origin.id,
        referredByPatientId: null,
        referredByMemberId: null,
        referredByMemberName: null,
        referredByExternalProfessionalId,
      };
    }

    return {
      referralOriginId: origin.id,
      referredByPatientId: null,
      referredByMemberId: null,
      referredByMemberName: null,
      referredByExternalProfessionalId: null,
    };
  }
}
