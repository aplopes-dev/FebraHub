import { AppointmentCategoryHasAppointmentsError } from '../../../domain/errors/appointment-category.errors';
import { DeleteAppointmentCategoryUseCase } from './delete-appointment-category.use-case';
import { InMemoryAppointmentCategoryRepository } from '../../../tests/in-memory-appointment-category.repository';
import { AppointmentCategory } from '../../../domain/entities/appointment-category.entity';

describe('DeleteAppointmentCategoryUseCase', () => {
  const storeId = 'store-a';
  let repo: InMemoryAppointmentCategoryRepository;
  let useCase: DeleteAppointmentCategoryUseCase;

  beforeEach(() => {
    repo = new InMemoryAppointmentCategoryRepository();
    useCase = new DeleteAppointmentCategoryUseCase(repo);
  });

  it('blocks delete when appointments are linked', async () => {
    const category = await repo.save(
      AppointmentCategory.create({ storeId, name: 'Consulta', color: 'blue' }),
    );
    repo.setAppointmentCount(category.id, 2);

    await expect(
      useCase.execute({ storeId, id: category.id }),
    ).rejects.toBeInstanceOf(AppointmentCategoryHasAppointmentsError);
  });

  it('deletes when no appointments linked', async () => {
    const category = await repo.save(
      AppointmentCategory.create({ storeId, name: 'Retorno', color: 'green' }),
    );

    await useCase.execute({ storeId, id: category.id });
    expect(await repo.findById(storeId, category.id)).toBeNull();
  });
});
