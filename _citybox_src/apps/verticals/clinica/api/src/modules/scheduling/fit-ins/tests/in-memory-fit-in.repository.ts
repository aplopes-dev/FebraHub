import type { FitInStatus } from '../../shared/domain/scheduling-enums';
import { FitIn } from '../domain/entities/fit-in.entity';
import {
  FitInRepository,
  type FitInDetail,
  type FitInListCriteria,
} from '../domain/repositories/fit-in.repository.interface';

/** Dublê mínimo para testes de deslocamento compromisso → encaixe. */
export class InMemoryFitInRepository extends FitInRepository {
  readonly items: FitInDetail[] = [];

  async findById(storeId: string, id: string): Promise<FitInDetail | null> {
    return (
      this.items.find(
        (row) => row.fitIn.id === id && row.fitIn.storeId === storeId,
      ) ?? null
    );
  }

  async findMany(
    storeId: string,
    criteria: FitInListCriteria,
  ): Promise<FitInDetail[]> {
    return this.items.filter((row) => {
      if (row.fitIn.storeId !== storeId) return false;
      if (criteria.status && row.fitIn.status !== criteria.status) return false;
      return true;
    });
  }

  async findPendingByPatient(
    storeId: string,
    patientId: string,
  ): Promise<FitInDetail[]> {
    return this.items.filter(
      (row) =>
        row.fitIn.storeId === storeId &&
        row.fitIn.patientId === patientId &&
        row.fitIn.status === 'pending',
    );
  }

  async save(fitIn: FitIn): Promise<FitInDetail> {
    const detail: FitInDetail = {
      fitIn,
      patientName: 'Paciente',
      patientPhone: null,
      category: null,
      appointmentId: null,
    };
    const index = this.items.findIndex((row) => row.fitIn.id === fitIn.id);
    if (index >= 0) {
      this.items[index] = detail;
    } else {
      this.items.push(detail);
    }
    return detail;
  }

  async updateStatus(
    storeId: string,
    id: string,
    status: FitInStatus,
  ): Promise<void> {
    const row = await this.findById(storeId, id);
    if (!row) return;
    row.fitIn.update({ status });
  }

  async delete(storeId: string, id: string): Promise<void> {
    const index = this.items.findIndex(
      (row) => row.fitIn.id === id && row.fitIn.storeId === storeId,
    );
    if (index >= 0) {
      this.items.splice(index, 1);
    }
  }
}
