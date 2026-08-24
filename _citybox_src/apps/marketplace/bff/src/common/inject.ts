import { Inject, type Type } from '@nestjs/common';
export function InjectService<T>(token: Type<T> | string | symbol) {
  return Inject(token);
}
