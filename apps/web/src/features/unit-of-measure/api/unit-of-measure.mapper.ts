import type { UnitOfMeasureDto } from "@/features/unit-of-measure/api/unit-of-measure.dto";
import type { UnitOfMeasure } from "@/features/unit-of-measure/types/unit-of-measure";

export function toUnitOfMeasure(dto: UnitOfMeasureDto): UnitOfMeasure {
  return {
    id: dto.id,
    name: dto.name,
    abbreviation: dto.abbreviation,
    kind: dto.kind,
    decimalPlaces: dto.decimalPlaces,
    active: dto.active,
  };
}
