import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';
import { isValidAccentColor } from '../../../../domain/entities/store-settings.entity';

export function IsValidAccentColor(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isValidAccentColor',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return typeof value === 'string' && isValidAccentColor(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a preset accent or #RRGGBB hex color`;
        },
      },
    });
  };
}
