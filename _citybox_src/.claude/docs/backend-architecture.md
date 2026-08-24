# Arquitetura Backend — Clean Architecture + SOLID com NestJS

> Documentação de referência para implementação da arquitetura de backend usada no projeto Citybox.
> Objetivo: qualquer IA ou desenvolvedor deve conseguir replicar esta estrutura em um novo projeto lendo somente este arquivo.

---

## Índice

1. [Stack e Dependências](#1-stack-e-dependências)
2. [Princípio da Arquitetura](#2-princípio-da-arquitetura)
3. [Estrutura de Diretórios](#3-estrutura-de-diretórios)
4. [Infraestrutura Compartilhada (shared/)](#4-infraestrutura-compartilhada-shared)
   - 4.1 [Hierarquia de Erros](#41-hierarquia-de-erros)
   - 4.2 [Entity Base](#42-entity-base)
   - 4.3 [IUseCase Interface](#43-iusecase-interface)
   - 4.4 [Validator Interface](#44-validator-interface)
   - 4.5 [IHasher Interface](#45-ihasher-interface)
   - 4.6 [ZodUtils](#46-zodutils)
   - 4.7 [Optional Type](#47-optional-type)
   - 4.8 [PrismaService e PrismaModule](#48-prismaservice-e-prismamodule)
   - 4.9 [BcryptHasher](#49-bcrypthasher)
   - 4.10 [AppExceptionFilter](#410-appexceptionfilter)
   - 4.11 [FakeHasher (testes)](#411-fakehasher-testes)
5. [Estrutura de um Módulo de Domínio](#5-estrutura-de-um-módulo-de-domínio)
   - 5.1 [Domain — Entity](#51-domain--entity)
   - 5.2 [Domain — Validadores Zod](#52-domain--validadores-zod)
   - 5.3 [Domain — Factories de Validação](#53-domain--factories-de-validação)
   - 5.4 [Domain — Erros](#54-domain--erros)
   - 5.5 [Domain — Interface do Repositório](#55-domain--interface-do-repositório)
   - 5.6 [Application — Use Cases](#56-application--use-cases)
   - 5.7 [Infrastructure — PrismaRepository](#57-infrastructure--prismarepository)
   - 5.8 [Presentation — Controller](#58-presentation--controller)
   - 5.9 [Presentation — DTOs HTTP](#59-presentation--dtos-http)
   - 5.10 [Tests — InMemoryRepository](#510-tests--inmemoryrepository)
   - 5.11 [Module — Wire-up](#511-module--wire-up)
6. [Bootstrap da Aplicação](#6-bootstrap-da-aplicação)
7. [Banco de Dados — Prisma 7](#7-banco-de-dados--prisma-7)
8. [Padrões de Teste](#8-padrões-de-teste)
9. [Convenções de Nomenclatura](#9-convenções-de-nomenclatura)
10. [Mapeamento Erro → HTTP](#10-mapeamento-erro--http)
11. [Regras TypeScript Críticas](#11-regras-typescript-críticas)
12. [Checklist para Novo Módulo](#12-checklist-para-novo-módulo)
13. [package.json de Referência](#13-packagejson-de-referência)

---

## 1. Stack e Dependências

| Pacote | Versão | Propósito |
|--------|--------|-----------|
| `@nestjs/core` | ^11 | Framework Web/API |
| `@nestjs/common` | ^11 | Decorators, pipes, filters |
| `@nestjs/platform-express` | ^11 | Adapter Express |
| `@nestjs/testing` | ^11 | Testes com TestingModule |
| `prisma` | ^7 | ORM + CLI de migrações |
| `@prisma/client` | ^7 | Cliente gerado do banco |
| `typescript` | ^5.9 | Linguagem |
| `zod` | ^4 | Validação no domínio |
| `class-validator` | ^0.15 | Validação de DTOs HTTP |
| `class-transformer` | ^0.5 | Transformação de DTOs |
| `bcrypt` | ^6 | Hashing de senhas |
| `@types/bcrypt` | ^5 | Tipos TypeScript para bcrypt |
| `dotenv` | ^16 | Carregamento de `.env` |
| `jest` | ^30 | Testes unitários |
| `supertest` | ^7 | Testes E2E |
| `@types/supertest` | ^6 | Tipos TypeScript para supertest |
| `reflect-metadata` | ^0.2 | Necessário para decorators NestJS |
| `rxjs` | ^7 | Requerido pelo NestJS |

### tsconfig.json mínimo

```json
{
  "compilerOptions": {
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "target": "ES2022",
    "lib": ["ES2022"],
    "strict": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "isolatedModules": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "paths": {}
  }
}
```

> **`emitDecoratorMetadata: true`** é obrigatório para injeção de dependências do NestJS funcionar.
> **`isolatedModules: true`** exige `import type` para interfaces.
> **`nodenext`** exige extensão `.js` em imports de ESM.

---

## 2. Princípio da Arquitetura

### Regra de Dependência

```
Presentation  →  Application  →  Domain  ←  Infrastructure
(Controllers)   (Use Cases)   (Entities)   (Prisma, Bcrypt)
```

**A camada de Domínio não conhece NestJS, Prisma, Express ou qualquer framework.**
Toda dependência aponta para dentro (inward). Infraestrutura implementa interfaces definidas no Domínio.

### Camadas e Responsabilidades

| Camada | Pasta | Responsabilidade |
|--------|-------|------------------|
| **Domain** | `domain/` | Entidades, regras de negócio, interfaces de repositório, erros de domínio, validadores Zod |
| **Application** | `application/` | Use cases — orquestram entidades e repositórios para cumprir casos de uso |
| **Infrastructure** | `infrastructure/` | Implementações concretas: Prisma repositories, adapters externos |
| **Presentation** | `presentation/` | Controllers HTTP, DTOs de request/response, mapeamento HTTP |
| **Shared** | `shared/` | Abstrações reutilizáveis: entity base, erros base, interfaces, utils |

### SOLID Aplicado

| Princípio | Onde se manifesta |
|-----------|-------------------|
| **S** — Single Responsibility | Cada use case faz uma coisa; controller só mapeia HTTP |
| **O** — Open/Closed | Adicionar módulo = criar nova pasta, sem alterar shared/ |
| **L** — Liskov | `InMemoryRepository` substitui `PrismaRepository` nos testes sem quebrar |
| **I** — Interface Segregation | `IUserRepository` tem só métodos do domínio de usuário |
| **D** — Dependency Inversion | Use cases dependem de `IUserRepository` (interface), não de `PrismaUserRepository` |

---

## 3. Estrutura de Diretórios

Estrutura completa de uma API NestJS seguindo este padrão:

```
src/
├── main.ts                                   ← Bootstrap
├── app.module.ts                             ← Root module
├── app.controller.ts                         ← Health check
├── app.service.ts
│
├── modules/
│   └── users/                               ← Módulo de domínio (ex: users)
│       ├── domain/
│       │   ├── entities/
│       │   │   └── user.entity.ts
│       │   ├── errors/
│       │   │   ├── user-not-found.error.ts
│       │   │   └── user-email-taken.error.ts
│       │   ├── factories/
│       │   │   ├── user-validator.factory.ts
│       │   │   └── user-password-validator.factory.ts
│       │   ├── validators/
│       │   │   ├── user.zod.validator.ts
│       │   │   └── user-password.zod.validator.ts
│       │   └── repositories/
│       │       └── user.repository.interface.ts
│       │
│       ├── application/
│       │   └── use-cases/
│       │       ├── create-user/
│       │       │   ├── create-user.dto.ts
│       │       │   ├── create-user.use-case.ts
│       │       │   └── create-user.use-case.spec.ts
│       │       ├── find-user-by-id/
│       │       │   ├── find-user-by-id.use-case.ts
│       │       │   └── find-user-by-id.use-case.spec.ts
│       │       └── list-users/
│       │           ├── list-users.use-case.ts
│       │           └── list-users.use-case.spec.ts
│       │
│       ├── infrastructure/
│       │   └── database/
│       │       └── prisma-user.repository.ts
│       │
│       ├── presentation/
│       │   └── http/
│       │       ├── users.controller.ts
│       │       ├── users.controller.spec.ts
│       │       └── dtos/
│       │           ├── create-user.request.dto.ts
│       │           └── user.response.dto.ts
│       │
│       ├── tests/
│       │   └── in-memory-user.repository.ts
│       │
│       └── users.module.ts
│
└── shared/
    ├── core/
    │   ├── entity.ts
    │   ├── use-case.interface.ts
    │   ├── types/
    │   │   └── optional.type.ts
    │   ├── utils/
    │   │   └── zod-utils.ts
    │   └── errors/
    │       ├── app.error.ts
    │       ├── domain.error.ts
    │       ├── application.error.ts
    │       ├── infrastructure.error.ts
    │       └── validator-domain.error.ts
    │
    ├── domain/
    │   ├── cryptography/
    │   │   └── hasher.interface.ts
    │   └── validators/
    │       └── validator.interface.ts
    │
    ├── infra/
    │   ├── cryptography/
    │   │   └── bcrypt-hasher.ts
    │   ├── prisma/
    │   │   ├── prisma.service.ts
    │   │   └── prisma.module.ts
    │   └── http/
    │       └── filters/
    │           └── app-exception.filter.ts
    │
    └── tests/
        └── fake-hasher.ts
```

---

## 4. Infraestrutura Compartilhada (shared/)

Estes arquivos formam a fundação. Devem ser criados primeiro e **nunca modificados** quando se adiciona um novo módulo.

### 4.1 Hierarquia de Erros

```
AppError (abstract)                  ← raiz: internalMessage, externalMessage, context
  ├── DomainError (abstract)         ← erros de regra de negócio
  │     └── ValidatorDomainError     ← falhas Zod → HTTP 422
  ├── ApplicationError (abstract)    ← erros de orquestração de use case
  └── InfrastructureError (abstract) ← erros de banco, serviços externos
```

**`src/shared/core/errors/app.error.ts`**
```typescript
export interface AppErrorProps {
  internalMessage: string;  // detalhes técnicos — só vai para logs
  externalMessage: string;  // mensagem amigável — vai para o cliente
  context: string;          // nome da classe que lançou o erro
}

export abstract class AppError extends Error {
  readonly internalMessage: string;
  readonly externalMessage: string;
  readonly context: string;

  constructor(props: AppErrorProps) {
    super(props.internalMessage);
    this.name = this.constructor.name;  // nome real da subclasse
    this.internalMessage = props.internalMessage;
    this.externalMessage = props.externalMessage;
    this.context = props.context;
  }
}
```

**`src/shared/core/errors/domain.error.ts`**
```typescript
import { AppError } from './app.error';

export abstract class DomainError extends AppError {}
```

**`src/shared/core/errors/application.error.ts`**
```typescript
import { AppError } from './app.error';

export abstract class ApplicationError extends AppError {}
```

**`src/shared/core/errors/infrastructure.error.ts`**
```typescript
import { AppError } from './app.error';

export abstract class InfrastructureError extends AppError {}
```

**`src/shared/core/errors/validator-domain.error.ts`**
```typescript
import { DomainError } from './domain.error';

export class ValidatorDomainError extends DomainError {}
```

> `ValidatorDomainError` é instanciável (não abstract) — é lançado diretamente pelos validadores Zod. Sempre resulta em HTTP 422.

---

### 4.2 Entity Base

**`src/shared/core/entity.ts`**
```typescript
import { randomUUID } from 'crypto';

export abstract class Entity<T> {
  private readonly _id: string;
  public readonly props: T;

  constructor(props: T, id?: string) {
    this.props = props;
    this._id = id ?? randomUUID();
  }

  protected abstract validate(): void;

  get id(): string {
    return this._id;
  }

  public equals(entity: Entity<T>): boolean {
    if (!(entity instanceof Entity)) return false;
    return this._id === entity._id;
  }
}
```

**Contratos que toda subclasse deve honrar:**
- Chamar `this.validate()` no construtor, após `super(props, id)`
- Implementar `validate()` delegando para uma Factory de Validador
- Expor props via getters tipados (nunca acessar `this.props.xxx` diretamente fora da entidade)
- Ter duas factories estáticas: `create()` para novos objetos, `with()` para reconstrução do banco

---

### 4.3 IUseCase Interface

**`src/shared/core/use-case.interface.ts`**
```typescript
export interface IUseCase<Input, Output> {
  execute(input: Input): Promise<Output>;
}
```

Todos os use cases implementam esta interface. A tipagem genérica garante que `Input` e `Output` sejam explícitos para cada caso de uso.

---

### 4.4 Validator Interface

**`src/shared/domain/validators/validator.interface.ts`**
```typescript
export interface Validator<Input> {
  validate(input: Input): void;
}
```

Lança exceção quando inválido, retorna `void` quando válido. Não retorna boolean.

---

### 4.5 IHasher Interface

**`src/shared/domain/cryptography/hasher.interface.ts`**
```typescript
export const HASHER = Symbol('HASHER');

export interface IHasher {
  hash(plain: string): Promise<string>;
  compare(plain: string, hashed: string): Promise<boolean>;
}
```

> O `Symbol` exportado junto da interface é o **token de injeção de dependências**. Necessário porque interfaces TypeScript desaparecem em runtime — o NestJS não pode usar a interface como token, precisa do Symbol.

---

### 4.6 ZodUtils

**`src/shared/core/utils/zod-utils.ts`**
```typescript
import { ZodError } from 'zod';

export class ZodUtils {
  static formatZodError(error: ZodError): string {
    return error.issues
      .map((e) => (e.path.length ? `${e.path.join('.')}: ${e.message}` : e.message))
      .join('; ');
  }
}
```

> **ATENÇÃO Zod v4:** Usar `error.issues`, não `error.errors`. Em Zod v4, `error.errors` é `undefined`.

---

### 4.7 Optional Type

**`src/shared/core/types/optional.type.ts`**
```typescript
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
```

Usado para tornar campos opcionais na factory `create()` das entidades (ex: `createdAt` e `updatedAt` são opcionais na criação, mas obrigatórios em `with()`).

---

### 4.8 PrismaService e PrismaModule

**`src/shared/infra/prisma/prisma.service.ts`**
```typescript
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../../../generated/prisma/client.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

> O import usa extensão `.js` explícita porque `moduleResolution: "nodenext"` é obrigatório.
> O caminho `../../../../generated/prisma/client.js` aponta para o cliente gerado pelo Prisma fora de `src/`.

**`src/shared/infra/prisma/prisma.module.ts`**
```typescript
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

> `@Global()` faz o `PrismaService` disponível em todos os módulos sem precisar importar `PrismaModule` em cada um. Importar `PrismaModule` apenas no `AppModule` já é suficiente.

---

### 4.9 BcryptHasher

**`src/shared/infra/cryptography/bcrypt-hasher.ts`**
```typescript
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { IHasher } from '../../domain/cryptography/hasher.interface';

@Injectable()
export class BcryptHasher implements IHasher {
  private readonly SALT_ROUNDS = 12;

  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.SALT_ROUNDS);
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}
```

> `import type { IHasher }` — `import type` porque `IHasher` é uma interface (desaparece em runtime).
> `import * as bcrypt` — forma correta de importar bcrypt em ESM.
> `SALT_ROUNDS = 12` — custo computacional seguro para produção.

---

### 4.10 AppExceptionFilter

**`src/shared/infra/http/filters/app-exception.filter.ts`**
```typescript
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { AppError } from '../../../core/errors/app.error';
import { DomainError } from '../../../core/errors/domain.error';
import { ValidatorDomainError } from '../../../core/errors/validator-domain.error';

@Catch(AppError)
export class AppExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AppExceptionFilter.name);

  catch(exception: AppError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    this.logger.error(
      `[${exception.context}] ${exception.internalMessage}`,
      exception.stack,
    );

    const status = this.resolveStatus(exception);

    response.status(status).json({
      error: {
        code: exception.name,        // ex: "UserNotFoundError"
        message: exception.externalMessage,  // ex: "Usuário não encontrado"
      },
    });
  }

  private resolveStatus(error: AppError): number {
    if (error instanceof ValidatorDomainError) return HttpStatus.UNPROCESSABLE_ENTITY; // 422
    if (error instanceof DomainError) {
      if (error.name.includes('NotFound'))   return HttpStatus.NOT_FOUND;    // 404
      if (error.name.includes('EmailTaken') || error.name.includes('Conflict'))
                                             return HttpStatus.CONFLICT;      // 409
      if (error.name.includes('Forbidden'))  return HttpStatus.FORBIDDEN;    // 403
      if (error.name.includes('Unauthorized')) return HttpStatus.UNAUTHORIZED; // 401
      return HttpStatus.UNPROCESSABLE_ENTITY;                                // 422 (default domain)
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;                                 // 500
  }
}
```

**Como funciona:**
- `@Catch(AppError)` — captura qualquer instância de `AppError` ou subclasses
- Loga `internalMessage` (com detalhes técnicos) via Logger do NestJS
- Responde ao cliente apenas `externalMessage` (sem vazar detalhes internos)
- `resolveStatus()` mapeia o nome da classe de erro para o status HTTP correto por convenção de nomenclatura

**Convenção de nomenclatura para mapeamento automático:**
- `XxxNotFoundError` → 404
- `XxxEmailTakenError` ou `XxxConflictError` → 409
- `XxxForbiddenError` → 403
- `XxxUnauthorizedError` → 401
- `ValidatorDomainError` → 422
- Qualquer outro `DomainError` → 422
- `InfrastructureError` ou não mapeado → 500

---

### 4.11 FakeHasher (testes)

**`src/shared/tests/fake-hasher.ts`**
```typescript
import type { IHasher } from '../domain/cryptography/hasher.interface';

export class FakeHasher implements IHasher {
  async hash(plain: string): Promise<string> {
    return `hashed:${plain}`;
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return hashed === `hashed:${plain}`;
  }
}
```

**Por quê usar FakeHasher em vez de jest.fn():**
- Determinístico — permite assertions exatas (`expect(saved.password).toBe('hashed:senha1234')`)
- `compare()` funciona corretamente — testa lógica de login sem bcrypt real
- Evita lentidão de bcrypt nos testes (bcrypt com salt 12 leva ~300ms por operação)

---

## 5. Estrutura de um Módulo de Domínio

Usando o módulo `users` como exemplo canônico. Para cada novo domínio (ex: `products`, `orders`), replicar exatamente esta estrutura.

### 5.1 Domain — Entity

**`src/modules/users/domain/entities/user.entity.ts`**
```typescript
import { Entity } from '../../../../shared/core/entity';
import { Optional } from '../../../../shared/core/types/optional.type';
import { UserValidatorFactory } from '../factories/user-validator.factory';

export type UserProps = {
  name: string;
  email: string;
  password: string;   // SEMPRE armazenado como hash, nunca plaintext
  createdAt: Date;
  updatedAt: Date;
};

export class User extends Entity<UserProps> {
  constructor(props: UserProps, id?: string) {
    super(props, id);
    this.validate();   // validação no construtor — invariante da entidade
  }

  protected validate(): void {
    UserValidatorFactory.create().validate(this);
  }

  // Factory para novos objetos — createdAt e updatedAt são opcionais (gerados automaticamente)
  public static create(
    props: Optional<UserProps, 'createdAt' | 'updatedAt'>,
    id?: string,
  ): User {
    return new User(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }

  // Factory para reconstrução do banco — id é obrigatório, sem re-validação extra
  public static with(props: UserProps, id: string): User {
    return new User(props, id);
  }

  // Getters — única forma de acessar props fora da entidade
  get name()      { return this.props.name; }
  get email()     { return this.props.email; }
  get password()  { return this.props.password; }
  get createdAt() { return this.props.createdAt; }
  get updatedAt() { return this.props.updatedAt; }

  // Métodos de negócio
  public touch(): void {
    (this.props as UserProps).updatedAt = new Date();
  }
}
```

**Padrão das Duas Factories:**

| Factory | Quando usar | `id` | Timestamps |
|---------|-------------|------|------------|
| `User.create(props)` | Criar novo usuário | opcional (gera UUID) | opcionais (default: `new Date()`) |
| `User.with(props, id)` | Reconstruir do banco | obrigatório | obrigatórios |

---

### 5.2 Domain — Validadores Zod

**`src/modules/users/domain/validators/user.zod.validator.ts`**
```typescript
import { z } from 'zod';
import { Validator } from '../../../../shared/domain/validators/validator.interface';
import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';
import { ZodUtils } from '../../../../shared/core/utils/zod-utils';
import { User } from '../entities/user.entity';

export class UserZodValidator implements Validator<User> {
  private constructor() {}  // construtor privado — usar factory estática

  public static create(): UserZodValidator {
    return new UserZodValidator();
  }

  public validate(input: User): void {
    try {
      this.getSchema().parse({
        id: input.id,
        name: input.props.name,
        email: input.props.email,
        password: input.props.password,
        createdAt: input.props.createdAt,
        updatedAt: input.props.updatedAt,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const msg = ZodUtils.formatZodError(error);
        throw new ValidatorDomainError({
          internalMessage: `Error validating User ${input.id}: ${msg}`,
          externalMessage: msg,
          context: UserZodValidator.name,
        });
      }
      const err = error as Error;
      throw new ValidatorDomainError({
        internalMessage: `Unexpected error validating User: ${err.message}`,
        externalMessage: 'Houve um erro ao validar os dados do usuário',
        context: UserZodValidator.name,
      });
    }
  }

  private getSchema() {
    return z.object({
      id: z.uuid(),
      name: z
        .string()
        .min(1, 'Nome é obrigatório')
        .max(120, 'Nome deve ter no máximo 120 caracteres'),
      email: z.email('E-mail inválido'),
      password: z.string().min(1),  // validar tamanho/força ANTES de criar a entidade, no use case
      createdAt: z.date(),
      updatedAt: z.date(),
    });
  }
}
```

**`src/modules/users/domain/validators/user-password.zod.validator.ts`**
```typescript
import { z } from 'zod';
import { Validator } from '../../../../shared/domain/validators/validator.interface';
import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';
import { ZodUtils } from '../../../../shared/core/utils/zod-utils';

export class UserPasswordZodValidator implements Validator<string> {
  private constructor() {}

  public static create(): UserPasswordZodValidator {
    return new UserPasswordZodValidator();
  }

  public validate(input: string): void {
    try {
      this.getSchema().parse(input);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const msg = ZodUtils.formatZodError(error);
        throw new ValidatorDomainError({
          internalMessage: `Invalid password: ${msg}`,
          externalMessage: `Senha inválida: ${msg}`,
          context: UserPasswordZodValidator.name,
        });
      }
      throw error;
    }
  }

  private getSchema() {
    return z
      .string()
      .min(8, 'A senha deve ter pelo menos 8 caracteres')
      .max(64, 'A senha deve ter no máximo 64 caracteres');
  }
}
```

> A senha plaintext é validada **antes** do hash. Após o hash, o password da entidade só precisa ser `min(1)` — o hash sempre tem o tamanho correto.

---

### 5.3 Domain — Factories de Validação

As factories desacoplam a entidade do validador concreto. A entidade chama `UserValidatorFactory.create()` em vez de `new UserZodValidator()`. Isso permite trocar o validador sem modificar a entidade (Open/Closed).

**`src/modules/users/domain/factories/user-validator.factory.ts`**
```typescript
import { Validator } from '../../../../shared/domain/validators/validator.interface';
import { User } from '../entities/user.entity';
import { UserZodValidator } from '../validators/user.zod.validator';

export class UserValidatorFactory {
  public static create(): Validator<User> {
    return UserZodValidator.create();
  }
}
```

**`src/modules/users/domain/factories/user-password-validator.factory.ts`**
```typescript
import { Validator } from '../../../../shared/domain/validators/validator.interface';
import { UserPasswordZodValidator } from '../validators/user-password.zod.validator';

export class UserPasswordValidatorFactory {
  public static create(): Validator<string> {
    return UserPasswordZodValidator.create();
  }
}
```

---

### 5.4 Domain — Erros

**`src/modules/users/domain/errors/user-not-found.error.ts`**
```typescript
import { DomainError } from '../../../../shared/core/errors/domain.error';

export class UserNotFoundError extends DomainError {
  constructor(context: string, userId: string) {
    super({
      internalMessage: `User "${userId}" not found`,
      externalMessage: 'Usuário não encontrado',
      context,
    });
  }
}
```

**`src/modules/users/domain/errors/user-email-taken.error.ts`**
```typescript
import { DomainError } from '../../../../shared/core/errors/domain.error';

export class UserEmailTakenError extends DomainError {
  constructor(context: string, email: string) {
    super({
      internalMessage: `Attempt to register duplicate email: ${email}`,
      externalMessage: 'Este e-mail já está em uso',
      context,
    });
  }
}
```

**Padrão dos erros de domínio:**
- Nome da classe segue a convenção que o `AppExceptionFilter` usa para mapear o status HTTP
- Construtor recebe `context` (nome da classe que lançou) e dados relevantes para o `internalMessage`
- `externalMessage` é sempre uma string amigável para o usuário final

---

### 5.5 Domain — Interface do Repositório

**`src/modules/users/domain/repositories/user.repository.interface.ts`**
```typescript
import { User } from '../entities/user.entity';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(params?: { skip?: number; take?: number }): Promise<User[]>;
  count(): Promise<number>;
  save(user: User): Promise<User>;
  delete(id: string): Promise<void>;
}
```

**Pontos obrigatórios:**
- `Symbol` e `interface` no mesmo arquivo — sempre importados juntos
- `findById` retorna `User | null` (nunca lança erro se não encontrado — isso é responsabilidade do use case)
- `save()` usa upsert semanticamente — cria se não existe, atualiza se já existe
- Parâmetros de paginação em `findAll` são opcionais — o repositório não conhece regras de página

---

### 5.6 Application — Use Cases

#### CreateUserUseCase

**`src/modules/users/application/use-cases/create-user/create-user.dto.ts`**
```typescript
export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
}
```

**`src/modules/users/application/use-cases/create-user/create-user.use-case.ts`**
```typescript
import { Inject } from '@nestjs/common';
import { IUseCase } from '../../../../../shared/core/use-case.interface';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface';
import type { IHasher } from '../../../../../shared/domain/cryptography/hasher.interface';
import { HASHER } from '../../../../../shared/domain/cryptography/hasher.interface';
import { User } from '../../../domain/entities/user.entity';
import { UserEmailTakenError } from '../../../domain/errors/user-email-taken.error';
import { UserPasswordValidatorFactory } from '../../../domain/factories/user-password-validator.factory';
import { CreateUserDto } from './create-user.dto';

export class CreateUserUseCase implements IUseCase<CreateUserDto, User> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(HASHER) private readonly hasher: IHasher,
  ) {}

  async execute(dto: CreateUserDto): Promise<User> {
    // 1. Validar senha ANTES de qualquer operação (falha rápida)
    UserPasswordValidatorFactory.create().validate(dto.password);

    // 2. Verificar unicidade de email
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      throw new UserEmailTakenError(CreateUserUseCase.name, dto.email);
    }

    // 3. Hash da senha ANTES de criar a entidade
    const passwordHash = await this.hasher.hash(dto.password);

    // 4. Criar entidade (valida internamente via Zod)
    const user = User.create({
      name: dto.name,
      email: dto.email,
      password: passwordHash,
    });

    // 5. Persistir e retornar
    return this.userRepository.save(user);
  }
}
```

**Ordem obrigatória das operações em CreateUser:**
1. Validação de senha plaintext (Zod) — falha antes de qualquer I/O
2. Verificação de email único (I/O de leitura)
3. Hash da senha (CPU-bound)
4. Criação da entidade (validação Zod dos campos da entidade)
5. Persistência (I/O de escrita)

#### FindUserByIdUseCase

**`src/modules/users/application/use-cases/find-user-by-id/find-user-by-id.use-case.ts`**
```typescript
import { Inject } from '@nestjs/common';
import { IUseCase } from '../../../../../shared/core/use-case.interface';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface';
import { User } from '../../../domain/entities/user.entity';
import { UserNotFoundError } from '../../../domain/errors/user-not-found.error';

export interface FindUserByIdDto {
  id: string;
}

export class FindUserByIdUseCase implements IUseCase<FindUserByIdDto, User> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
  ) {}

  async execute({ id }: FindUserByIdDto): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new UserNotFoundError(FindUserByIdUseCase.name, id);
    }
    return user;
  }
}
```

> DTOs simples podem ser interfaces inline no mesmo arquivo do use case. Interfaces complexas devem ter seu próprio arquivo `.dto.ts`.

#### ListUsersUseCase

**`src/modules/users/application/use-cases/list-users/list-users.use-case.ts`**
```typescript
import { Inject } from '@nestjs/common';
import { IUseCase } from '../../../../../shared/core/use-case.interface';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface';
import { User } from '../../../domain/entities/user.entity';

export interface ListUsersDto {
  page?: number;
  perPage?: number;
}

export interface ListUsersResult {
  users: User[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export class ListUsersUseCase implements IUseCase<ListUsersDto, ListUsersResult> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
  ) {}

  async execute({ page = 1, perPage = 20 }: ListUsersDto): Promise<ListUsersResult> {
    const skip = (page - 1) * perPage;

    // Paralelizar consultas independentes
    const [users, total] = await Promise.all([
      this.userRepository.findAll({ skip, take: perPage }),
      this.userRepository.count(),
    ]);

    return {
      users,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }
}
```

---

### 5.7 Infrastructure — PrismaRepository

**`src/modules/users/infrastructure/database/prisma-user.repository.ts`**
```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { User, UserProps } from '../../domain/entities/user.entity';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { email } });
    return row ? this.toEntity(row) : null;
  }

  async findAll(params?: { skip?: number; take?: number }): Promise<User[]> {
    const rows = await this.prisma.user.findMany({
      skip: params?.skip,
      take: params?.take,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.toEntity(row));
  }

  async count(): Promise<number> {
    return this.prisma.user.count();
  }

  async save(user: User): Promise<User> {
    const row = await this.prisma.user.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        name: user.name,
        email: user.email,
        password: user.password,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      update: {
        name: user.name,
        email: user.email,
        password: user.password,
        updatedAt: user.updatedAt,
      },
    });
    return this.toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }

  private toEntity(row: {
    id: string;
    name: string;
    email: string;
    password: string;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    const props: UserProps = {
      name: row.name,
      email: row.email,
      password: row.password,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return User.with(props, row.id);  // with() para reconstrução — id obrigatório
  }
}
```

**Pontos críticos do repositório Prisma:**
- `@Injectable()` — necessário para ser injetado pelo NestJS
- `save()` usa `upsert` — funciona para create e update com o mesmo método
- `toEntity()` usa `User.with()` — reconstrução sem re-validação desnecessária
- `toEntity()` tipado explicitamente (não usa o tipo gerado do Prisma diretamente) — isola infraestrutura do domínio
- `findById`/`findByEmail` retornam `null`, nunca lançam erro

---

### 5.8 Presentation — Controller

**`src/modules/users/presentation/http/users.controller.ts`**
```typescript
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CreateUserUseCase } from '../../application/use-cases/create-user/create-user.use-case';
import { FindUserByIdUseCase } from '../../application/use-cases/find-user-by-id/find-user-by-id.use-case';
import { ListUsersUseCase } from '../../application/use-cases/list-users/list-users.use-case';
import { CreateUserRequestDto } from './dtos/create-user.request.dto';
import { UserResponseDto } from './dtos/user.response.dto';

@Controller('api/v1/users')
export class UsersController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly findUserByIdUseCase: FindUserByIdUseCase,
    private readonly listUsersUseCase: ListUsersUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateUserRequestDto) {
    const user = await this.createUserUseCase.execute(dto);
    return { data: UserResponseDto.fromEntity(user) };
  }

  @Get()
  async list(
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    const result = await this.listUsersUseCase.execute({
      page: page ? Number(page) : undefined,
      perPage: perPage ? Number(perPage) : undefined,
    });

    return {
      data: result.users.map(UserResponseDto.fromEntity),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
    };
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const user = await this.findUserByIdUseCase.execute({ id });
    return { data: UserResponseDto.fromEntity(user) };
  }
}
```

**Responsabilidade do Controller:**
- Receber request HTTP e extrair dados (`@Body`, `@Param`, `@Query`)
- Delegar para o use case correspondente
- Mapear o resultado para o DTO de resposta via `ResponseDto.fromEntity()`
- **Nunca** conter lógica de negócio

**Formato de resposta padrão:**
- Recurso único: `{ data: { ...campos } }`
- Lista: `{ data: [...], meta: { total, page, perPage, totalPages } }`
- Erro: `{ error: { code: "ErrorClassName", message: "..." } }` (gerado pelo filter)

---

### 5.9 Presentation — DTOs HTTP

#### Request DTO — usa class-validator

**`src/modules/users/presentation/http/dtos/create-user.request.dto.ts`**
```typescript
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateUserRequestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(64)
  password: string;
}
```

> `ValidationPipe({ whitelist: true })` em `main.ts` remove automaticamente campos não decorados do DTO.
> As validações aqui são redundantes com o Zod do domínio — isso é intencional: fail fast na borda HTTP antes de chegar ao domínio.

#### Response DTO — mapeamento explícito

**`src/modules/users/presentation/http/dtos/user.response.dto.ts`**
```typescript
import { User } from '../../../domain/entities/user.entity';

export class UserResponseDto {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  // password NÃO está aqui — nunca expor senha na resposta

  static fromEntity(user: User): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.name = user.name;
    dto.email = user.email;
    dto.createdAt = user.createdAt;
    dto.updatedAt = user.updatedAt;
    return dto;
  }
}
```

> Mapeamento **explícito** — cada campo é atribuído manualmente. Nunca usar spread `{ ...user.props }` pois isso poderia incluir `password` acidentalmente.

---

### 5.10 Tests — InMemoryRepository

**`src/modules/users/tests/in-memory-user.repository.ts`**
```typescript
import type { IUserRepository } from '../domain/repositories/user.repository.interface';
import { User } from '../domain/entities/user.entity';

export class InMemoryUserRepository implements IUserRepository {
  private items: User[] = [];

  async findById(id: string): Promise<User | null> {
    return this.items.find((u) => u.id === id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.items.find((u) => u.email === email) ?? null;
  }

  async findAll(params?: { skip?: number; take?: number }): Promise<User[]> {
    let result = [...this.items];
    if (params?.skip) result = result.slice(params.skip);
    if (params?.take !== undefined) result = result.slice(0, params.take);
    return result;
  }

  async count(): Promise<number> {
    return this.items.length;
  }

  async save(user: User): Promise<User> {
    const index = this.items.findIndex((u) => u.id === user.id);
    if (index >= 0) {
      this.items[index] = user;
    } else {
      this.items.push(user);
    }
    return user;
  }

  async delete(id: string): Promise<void> {
    this.items = this.items.filter((u) => u.id !== id);
  }

  // Métodos extras para assertions nos testes
  getAll(): User[] {
    return [...this.items];
  }

  clear(): void {
    this.items = [];
  }
}
```

**Por que `InMemoryRepository` em vez de `jest.fn()`:**
- Testa o contrato real do repositório (find, save, count)
- `getAll()` e `clear()` permitem assertions diretas e reset entre testes
- Sem `jest.fn()` em repositórios — mocks de repositório são frágeis e testam implementação, não comportamento
- `jest.fn()` só é aceitável em testes de **controller** (onde o use case é o colaborador mockado)

---

### 5.11 Module — Wire-up

**`src/modules/users/users.module.ts`**
```typescript
import { Module } from '@nestjs/common';
import { UsersController } from './presentation/http/users.controller';
import { CreateUserUseCase } from './application/use-cases/create-user/create-user.use-case';
import { FindUserByIdUseCase } from './application/use-cases/find-user-by-id/find-user-by-id.use-case';
import { ListUsersUseCase } from './application/use-cases/list-users/list-users.use-case';
import { PrismaUserRepository } from './infrastructure/database/prisma-user.repository';
import { USER_REPOSITORY } from './domain/repositories/user.repository.interface';
import { BcryptHasher } from '../../shared/infra/cryptography/bcrypt-hasher';
import { HASHER } from '../../shared/domain/cryptography/hasher.interface';

@Module({
  controllers: [UsersController],
  providers: [
    // Injeção por Symbol — necessário para interfaces TypeScript
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: HASHER, useClass: BcryptHasher },

    // Use cases — injetados diretamente pelo nome da classe
    CreateUserUseCase,
    FindUserByIdUseCase,
    ListUsersUseCase,
  ],
})
export class UsersModule {}
```

**Regras do módulo:**
- `PrismaModule` não precisa ser importado aqui porque é `@Global()`
- Injeção de interfaces usa `{ provide: SYMBOL, useClass: ConcreteClass }`
- Use cases são listados diretamente (não precisam de `provide`/`useClass`) porque são classes concretas
- Não exportar providers a menos que outro módulo precise deles

---

## 6. Bootstrap da Aplicação

**`src/main.ts`**
```typescript
import 'dotenv/config';  // DEVE ser o primeiro import — carrega .env antes de tudo
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AppExceptionFilter } from './shared/infra/http/filters/app-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,   // remove campos não decorados do DTO
    transform: true,   // converte tipos automaticamente (string → number, etc.)
  }));

  app.useGlobalFilters(new AppExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
```

**`src/app.module.ts`**
```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './shared/infra/prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    PrismaModule,   // global — disponibiliza PrismaService para toda a app
    UsersModule,    // adicionar novos módulos aqui
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

---

## 7. Banco de Dados — Prisma 7

### Schema

**`prisma/schema.prisma`**
```prisma
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"  // gerado FORA de src/, em generated/
}

datasource db {
  provider = "postgresql"
  schemas  = ["core"]               // multi-schema mode — declara os schemas usados
}

model User {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  password  String
  createdAt DateTime @default(now()) @map("created_at")    // snake_case no banco
  updatedAt DateTime @updatedAt @map("updated_at")         // atualizado automaticamente
  
  @@map("users")       // nome da tabela no banco
  @@schema("core")     // schema PostgreSQL onde a tabela vive
}
```

**Pontos do schema:**
- `output = "../generated/prisma"` — cliente gerado fora de `src/` para separar código gerado do código fonte
- `schemas = ["core"]` — multi-schema mode requer listar todos os schemas do datasource
- `@@schema("core")` — cada model deve declarar em qual schema PostgreSQL vive
- `@map("campo_snake")` — mapeia nomes camelCase do Prisma para snake_case no banco
- `@@map("tabela")` — nome da tabela no banco (plural, snake_case)

### Configuração Prisma

**`prisma.config.ts`** (na raiz da API, não dentro de `src/`)
```typescript
import 'dotenv/config';  // carrega .env para o Prisma CLI
import { defineConfig } from 'prisma/config';

export default defineConfig({});
```

### Variáveis de Ambiente

**`.env`** (não commitar — adicionar ao `.gitignore`)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/database_name"
```

### Comandos Prisma

```bash
# Aplicar schema ao banco (desenvolvimento, sem TTY necessário)
npx prisma db push

# Criar migration explícita (produção, requer TTY)
npx prisma migrate dev --name descricao_da_mudanca

# Aplicar migrations em outro ambiente (CI/CD)
npx prisma migrate deploy

# Regenerar cliente após alterar schema
npx prisma generate

# Explorar banco de dados visualmente
npx prisma studio
```

> **`db push` vs `migrate dev`:** Em ambientes de desenvolvimento não-interativos (CI, WSL sem TTY), usar `db push`. Para produção, usar `migrate dev` para gerar arquivo de migration versionado e `migrate deploy` para aplicar.

### Import do Cliente Gerado

```typescript
// CORRETO — extensão .js explícita (obrigatório com moduleResolution: "nodenext")
import { PrismaClient } from '../../../../generated/prisma/client.js';

// ERRADO — não resolve com nodenext
import { PrismaClient } from '../../../../generated/prisma';
import { PrismaClient } from '@prisma/client';  // também errado — output customizado
```

---

## 8. Padrões de Teste

### Teste de Use Case (padrão principal)

```typescript
import { CreateUserUseCase } from './create-user.use-case';
import { InMemoryUserRepository } from '../../../tests/in-memory-user.repository';
import { FakeHasher } from '../../../../../shared/tests/fake-hasher';
import { UserEmailTakenError } from '../../../domain/errors/user-email-taken.error';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import { User } from '../../../domain/entities/user.entity';

describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;
  let repo: InMemoryUserRepository;
  let hasher: FakeHasher;

  beforeEach(() => {
    repo = new InMemoryUserRepository();
    hasher = new FakeHasher();
    // Instanciação direta — sem TestingModule (use cases são classes puras)
    useCase = new CreateUserUseCase(repo, hasher);
  });

  it('should create user and persist it', async () => {
    const result = await useCase.execute({
      name: 'Bruno',
      email: 'bruno@test.com',
      password: 'senha1234',
    });

    expect(result).toBeInstanceOf(User);
    expect(repo.getAll()).toHaveLength(1);
    expect(repo.getAll()[0].email).toBe('bruno@test.com');
  });

  it('should store hashed password, not plaintext', async () => {
    await useCase.execute({ name: 'Bruno', email: 'bruno@test.com', password: 'senha1234' });

    const saved = repo.getAll()[0];
    expect(saved.password).toBe('hashed:senha1234');
    expect(saved.password).not.toBe('senha1234');
  });

  it('should throw UserEmailTakenError if email already registered', async () => {
    await useCase.execute({ name: 'Bruno', email: 'bruno@test.com', password: 'senha1234' });

    await expect(
      useCase.execute({ name: 'Outro', email: 'bruno@test.com', password: 'outrasenha1234' }),
    ).rejects.toBeInstanceOf(UserEmailTakenError);
  });

  it('error should carry correct externalMessage and context', async () => {
    await useCase.execute({ name: 'Bruno', email: 'bruno@test.com', password: 'senha1234' });

    try {
      await useCase.execute({ name: 'Outro', email: 'bruno@test.com', password: 'outrasenha1234' });
    } catch (e) {
      expect((e as UserEmailTakenError).externalMessage).toBe('Este e-mail já está em uso');
      expect((e as UserEmailTakenError).context).toBe('CreateUserUseCase');
    }
  });

  it('should throw ValidatorDomainError for short password', async () => {
    await expect(
      useCase.execute({ name: 'Bruno', email: 'bruno@test.com', password: '123' }),
    ).rejects.toBeInstanceOf(ValidatorDomainError);
  });

  it('should not persist user when password is invalid', async () => {
    await expect(
      useCase.execute({ name: 'Bruno', email: 'bruno@test.com', password: '123' }),
    ).rejects.toThrow();

    expect(repo.getAll()).toHaveLength(0);  // rollback lógico — nada foi salvo
  });
});
```

### Teste de Controller

Controllers testam **mapeamento HTTP** — aqui `jest.fn()` é aceitável porque o colaborador mockado é o use case, não o repositório.

```typescript
import { randomUUID } from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { CreateUserUseCase } from '../../application/use-cases/create-user/create-user.use-case';
import { FindUserByIdUseCase } from '../../application/use-cases/find-user-by-id/find-user-by-id.use-case';
import { ListUsersUseCase } from '../../application/use-cases/list-users/list-users.use-case';
import { User } from '../../domain/entities/user.entity';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';

// Helper para criar usuário de teste sem tocar no banco
const makeUser = (email = 'bruno@test.com') =>
  User.with(
    {
      name: 'Bruno',
      email,
      password: 'hash_stored',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    },
    randomUUID(),
  );

describe('UsersController', () => {
  let controller: UsersController;
  let createUseCase: jest.Mocked<CreateUserUseCase>;
  let findUseCase: jest.Mocked<FindUserByIdUseCase>;
  let listUseCase: jest.Mocked<ListUsersUseCase>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: CreateUserUseCase, useValue: { execute: jest.fn() } },
        { provide: FindUserByIdUseCase, useValue: { execute: jest.fn() } },
        { provide: ListUsersUseCase, useValue: { execute: jest.fn() } },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    createUseCase = module.get(CreateUserUseCase);
    findUseCase = module.get(FindUserByIdUseCase);
    listUseCase = module.get(ListUsersUseCase);
  });

  describe('POST /api/v1/users', () => {
    it('should return created user wrapped in data', async () => {
      const user = makeUser();
      createUseCase.execute.mockResolvedValue(user);

      const result = await controller.create({
        name: 'Bruno',
        email: 'bruno@test.com',
        password: 'senha1234',
      });

      expect(result.data.id).toBeDefined();
      expect(result.data.email).toBe('bruno@test.com');
      expect((result.data as any).password).toBeUndefined();  // senha nunca na resposta
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('should return user wrapped in data', async () => {
      const user = makeUser();
      findUseCase.execute.mockResolvedValue(user);

      const result = await controller.findById(user.id);
      expect(result.data.id).toBe(user.id);
    });

    it('should propagate UserNotFoundError', async () => {
      findUseCase.execute.mockRejectedValue(
        new UserNotFoundError('FindUserByIdUseCase', 'nonexistent'),
      );

      await expect(controller.findById('nonexistent')).rejects.toBeInstanceOf(UserNotFoundError);
    });
  });

  describe('GET /api/v1/users', () => {
    it('should return paginated users with meta', async () => {
      listUseCase.execute.mockResolvedValue({
        users: [makeUser()],
        total: 1,
        page: 1,
        perPage: 20,
        totalPages: 1,
      });

      const result = await controller.list();

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });
  });
});
```

### Regra geral de testes

| Camada | Colaboradores | Ferramenta |
|--------|---------------|------------|
| Use Case | Repository, Hasher | `InMemoryRepository`, `FakeHasher` (sem jest.fn()) |
| Controller | Use Cases | `jest.fn()` via `useValue: { execute: jest.fn() }` |
| Entity | — | Instanciar diretamente, verificar throws |
| Repository Prisma | Banco real | Testes E2E (não testes unitários) |

---

## 9. Convenções de Nomenclatura

### Arquivos e Pastas

| Elemento | Convenção | Exemplo |
|----------|-----------|---------|
| Pastas | kebab-case | `create-user/`, `find-user-by-id/` |
| Arquivos de entidade | `<nome>.entity.ts` | `user.entity.ts` |
| Arquivos de erro | `<nome>-<tipo>.error.ts` | `user-not-found.error.ts` |
| Arquivos de use case | `<acao>-<dominio>.use-case.ts` | `create-user.use-case.ts` |
| Arquivos de repositório | `<impl>-<dominio>.repository.ts` | `prisma-user.repository.ts` |
| Arquivos de interface | `<dominio>.repository.interface.ts` | `user.repository.interface.ts` |
| Arquivos de validador | `<dominio>.zod.validator.ts` | `user.zod.validator.ts` |
| Arquivos de factory | `<dominio>-validator.factory.ts` | `user-validator.factory.ts` |
| Arquivos de DTO (HTTP) | `<acao>-<dominio>.request.dto.ts` | `create-user.request.dto.ts` |
| Arquivos de DTO (resposta) | `<dominio>.response.dto.ts` | `user.response.dto.ts` |
| Testes unitários | `<arquivo>.spec.ts` | `create-user.use-case.spec.ts` |
| Testes E2E | `<arquivo>.e2e-spec.ts` | `app.e2e-spec.ts` |

### Classes e Interfaces

| Elemento | Convenção | Exemplo |
|----------|-----------|---------|
| Classes | PascalCase | `User`, `CreateUserUseCase` |
| Interfaces | PascalCase com prefixo `I` | `IUserRepository`, `IUseCase`, `IHasher` |
| Erros | PascalCase + sufixo `Error` | `UserNotFoundError`, `UserEmailTakenError` |
| Symbols (tokens DI) | SCREAMING_SNAKE_CASE | `USER_REPOSITORY`, `HASHER` |
| Métodos | camelCase | `findById()`, `execute()`, `validate()` |
| Propriedades | camelCase | `internalMessage`, `externalMessage` |
| Tipos | PascalCase | `UserProps`, `ListUsersResult` |

### Rotas REST

```
POST   /api/v1/<dominio-plural>         → criar
GET    /api/v1/<dominio-plural>         → listar (com paginação)
GET    /api/v1/<dominio-plural>/:id     → buscar por ID
PUT    /api/v1/<dominio-plural>/:id     → atualizar completo
PATCH  /api/v1/<dominio-plural>/:id     → atualizar parcial
DELETE /api/v1/<dominio-plural>/:id     → remover
```

---

## 10. Mapeamento Erro → HTTP

O `AppExceptionFilter` converte automaticamente por convenção de nomenclatura:

| Nome da classe de erro | Status HTTP | Situação |
|------------------------|-------------|----------|
| `ValidatorDomainError` | 422 | Falha de validação Zod |
| `XxxNotFoundError` | 404 | Recurso não encontrado |
| `XxxEmailTakenError` | 409 | Conflito de email único |
| `XxxConflictError` | 409 | Conflito genérico |
| `XxxForbiddenError` | 403 | Acesso proibido |
| `XxxUnauthorizedError` | 401 | Não autenticado |
| Qualquer outro `DomainError` | 422 | Regra de negócio violada |
| `InfrastructureError` | 500 | Erro de infraestrutura |
| Exceção não capturada | 500 | Erro desconhecido |

**Formato de resposta de erro:**
```json
{
  "error": {
    "code": "UserNotFoundError",
    "message": "Usuário não encontrado"
  }
}
```

---

## 11. Regras TypeScript Críticas

### 1. `import type` para interfaces em construtores com `@Inject()`

**ERRADO:**
```typescript
import { IUserRepository } from '...';

constructor(
  @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
) {}
```

**CORRETO:**
```typescript
import type { IUserRepository } from '...';   // import type
import { USER_REPOSITORY } from '...';         // import normal para o Symbol

constructor(
  @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
) {}
```

**Por quê:** Com `isolatedModules: true` e `emitDecoratorMetadata: true`, TypeScript precisa emitir metadata de tipo no construtor. Interfaces não existem em runtime. `import type` sinaliza ao compilador que o import não existe em runtime e evita erro de compilação.

### 2. Extensão `.js` em imports com `nodenext`

**ERRADO:**
```typescript
import { PrismaClient } from '../../../../generated/prisma';
```

**CORRETO:**
```typescript
import { PrismaClient } from '../../../../generated/prisma/client.js';
```

**Por quê:** `moduleResolution: "nodenext"` segue a especificação ESM do Node.js que requer extensão de arquivo explícita. O TypeScript compila `.ts` para `.js`, mas os imports precisam referenciar o arquivo `.js` final.

### 3. Zod v4 — `error.issues` não `error.errors`

**ERRADO:**
```typescript
error.errors.map(e => e.message)  // undefined no Zod v4
```

**CORRETO:**
```typescript
error.issues.map(e => e.message)  // correto no Zod v4
```

### 4. `import 'dotenv/config'` deve ser o primeiro import em `main.ts`

**ERRADO:**
```typescript
import { NestFactory } from '@nestjs/core';
import 'dotenv/config';  // tarde demais — NestJS já carregou módulos sem as env vars
```

**CORRETO:**
```typescript
import 'dotenv/config';   // PRIMEIRO — garante que process.env está populado
import { NestFactory } from '@nestjs/core';
```

### 5. `prisma.config.ts` vs `main.ts` — dois carregamentos separados de env

- `main.ts` carrega `dotenv/config` para a **aplicação NestJS em runtime**
- `prisma.config.ts` carrega `dotenv/config` para o **Prisma CLI** (migrate, generate, studio)

São dois processos separados — cada um precisa do seu próprio carregamento de `.env`.

---

## 12. Checklist para Novo Módulo

Ao adicionar um novo domínio (ex: `products`), seguir nesta ordem:

### Fase 1 — Domínio

- [ ] Criar `src/modules/products/domain/entities/product.entity.ts` estendendo `Entity<ProductProps>`
- [ ] Criar `src/modules/products/domain/validators/product.zod.validator.ts` implementando `Validator<Product>`
- [ ] Criar `src/modules/products/domain/factories/product-validator.factory.ts`
- [ ] Criar erros de domínio em `src/modules/products/domain/errors/`
- [ ] Criar `src/modules/products/domain/repositories/product.repository.interface.ts` com Symbol `PRODUCT_REPOSITORY`

### Fase 2 — Testes de Suporte

- [ ] Criar `src/modules/products/tests/in-memory-product.repository.ts` com `getAll()` e `clear()`

### Fase 3 — Use Cases (com testes unitários)

- [ ] Criar `src/modules/products/application/use-cases/create-product/create-product.dto.ts`
- [ ] Criar `src/modules/products/application/use-cases/create-product/create-product.use-case.ts`
- [ ] Criar `src/modules/products/application/use-cases/create-product/create-product.use-case.spec.ts`
- [ ] Repetir para cada use case adicional

### Fase 4 — Infraestrutura

- [ ] Adicionar model ao `prisma/schema.prisma` com `@@schema("core")` e `@@map("table_name")`
- [ ] Executar `npx prisma db push && npx prisma generate`
- [ ] Criar `src/modules/products/infrastructure/database/prisma-product.repository.ts`

### Fase 5 — Apresentação

- [ ] Criar `src/modules/products/presentation/http/dtos/create-product.request.dto.ts` com class-validator
- [ ] Criar `src/modules/products/presentation/http/dtos/product.response.dto.ts` com `fromEntity()`
- [ ] Criar `src/modules/products/presentation/http/products.controller.ts`
- [ ] Criar `src/modules/products/presentation/http/products.controller.spec.ts`

### Fase 6 — Wire-up

- [ ] Criar `src/modules/products/products.module.ts` com providers e injeções por Symbol
- [ ] Adicionar `ProductsModule` ao `imports` de `src/app.module.ts`

### Verificação

- [ ] `npm test` — todos os testes passam
- [ ] `npm run check-types` — sem erros TypeScript
- [ ] `npm run lint` — sem erros de lint

---

## 13. package.json de Referência

```json
{
  "name": "@myapp/api",
  "version": "0.0.1",
  "scripts": {
    "dev": "nest start --watch",
    "build": "nest build",
    "start": "node dist/main",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\"",
    "check-types": "tsc --noEmit"
  },
  "dependencies": {
    "@nestjs/common": "^11.0.0",
    "@nestjs/core": "^11.0.0",
    "@nestjs/platform-express": "^11.0.0",
    "@prisma/client": "^7.0.0",
    "bcrypt": "^6.0.0",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.15.1",
    "dotenv": "^16.0.0",
    "reflect-metadata": "^0.2.0",
    "rxjs": "^7.8.0",
    "zod": "^4.0.0"
  },
  "devDependencies": {
    "@nestjs/testing": "^11.0.0",
    "@types/bcrypt": "^5.0.0",
    "@types/express": "^4.17.0",
    "@types/jest": "^30.0.0",
    "@types/node": "^22.0.0",
    "@types/supertest": "^6.0.0",
    "jest": "^30.0.0",
    "prisma": "^7.0.0",
    "supertest": "^7.0.0",
    "ts-jest": "^29.0.0",
    "typescript": "^5.9.0"
  },
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": {
      "^.+\\.(t|j)s$": "ts-jest"
    },
    "collectCoverageFrom": ["**/*.(t|j)s"],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node"
  }
}
```

---

## Referência Rápida — Fluxo de uma Request

```
HTTP POST /api/v1/users
  │
  ├─ ValidationPipe (class-validator)
  │   └─ CreateUserRequestDto — valida tipos HTTP (400 se inválido)
  │
  ├─ UsersController.create()
  │   └─ Extrai DTO, delega para use case
  │
  ├─ CreateUserUseCase.execute()
  │   ├─ UserPasswordValidatorFactory → Zod (422 se senha fraca)
  │   ├─ IUserRepository.findByEmail() → UserEmailTakenError (409) se duplicado
  │   ├─ IHasher.hash() → hash bcrypt
  │   ├─ User.create() → UserZodValidator → ValidatorDomainError (422) se inválido
  │   └─ IUserRepository.save() → User persistido
  │
  ├─ UsersController.create()
  │   └─ UserResponseDto.fromEntity() — mapeia para resposta segura
  │
  └─ HTTP 201 Created
      { "data": { "id": "...", "name": "...", "email": "...", "createdAt": "...", "updatedAt": "..." } }
```

**Se qualquer `AppError` for lançado:**
```
  └─ AppExceptionFilter.catch()
      ├─ Logger.error(internalMessage) — log técnico
      └─ HTTP 4xx/5xx
          { "error": { "code": "ErrorClassName", "message": "mensagem amigável" } }
```
