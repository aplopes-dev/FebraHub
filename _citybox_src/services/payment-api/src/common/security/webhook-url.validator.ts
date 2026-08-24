import {
  registerDecorator,
  type ValidationOptions,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from 'class-validator';
import { assertSafeWebhookUrl } from './webhook-url.js';

@ValidatorConstraint({ name: 'isSafeWebhookUrl', async: false })
export class IsSafeWebhookUrlConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'string' || value.trim().length === 0) return false;
    try {
      assertSafeWebhookUrl(value);
      return true;
    } catch {
      return false;
    }
  }

  defaultMessage(): string {
    return 'URL de webhook inválida, insegura ou aponta para endereço privado em produção';
  }
}

export function IsSafeWebhookUrl(options?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options,
      constraints: [],
      validator: IsSafeWebhookUrlConstraint,
    });
  };
}
