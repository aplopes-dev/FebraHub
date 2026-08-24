import { describe, expect, it } from 'vitest';
import {
  aniversarioStepTwoSchema,
  DEFAULT_ANIVERSARIO_MESSAGE,
} from './aniversario-form.schema';

describe('aniversarioStepTwoSchema', () => {
  it('accepts empty filters with message', () => {
    const parsed = aniversarioStepTwoSchema.parse({
      planIds: [],
      specialtyIds: [],
      genders: [],
      messageBody: DEFAULT_ANIVERSARIO_MESSAGE,
    });
    expect(parsed.messageBody.length).toBeGreaterThan(0);
  });

  it('rejects blank message', () => {
    const result = aniversarioStepTwoSchema.safeParse({
      planIds: [],
      specialtyIds: [],
      genders: [],
      messageBody: '   ',
    });
    expect(result.success).toBe(false);
  });
});
