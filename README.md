# work-order-service

Work order intake and lifecycle service for a vehicle repair shop platform — FIAP SOAT Tech Challenge (Phase 4).

This is one of three independent microservices:

| Service | Responsibility |
|---|---|
| **work-order-service** (this repo) | Customers, vehicles, repair service catalog, work order lifecycle, item/price snapshots, saga orchestration |
| billing-service | Quotes generated from work order snapshots, quote approval/refusal, payments, Mercado Pago webhooks |
| execution-service | Diagnosis workflow, repair execution queue, execution progress and completion/failure events |

Services communicate through RabbitMQ events (async) and REST (sync, when strictly needed). Each service owns its database — no service touches another service's data store.

`work-order-service` publishes immutable item/price snapshots for quote generation. `billing-service` generates and owns quotes from those snapshots; it must never read the `work-order-service` database.

## Stack

- [NestJS 11](https://nestjs.com/) + TypeScript, running as a hybrid application (HTTP + RabbitMQ consumer in a single process)
- [Prisma 7](https://www.prisma.io/) with PostgreSQL (driver adapter)
- RabbitMQ for messaging
- Zod for environment validation, class-validator for HTTP DTOs
- Jest (unit + e2e), Swagger for API docs

## Architecture

Clean Architecture with one module per bounded context:

```
src/
├── modules/
│   ├── customers/
│   │   ├── domain/          # entities, value objects, business rules
│   │   ├── application/     # use cases + ports (interfaces)
│   │   ├── presentation/    # HTTP controllers, DTOs, exception filters
│   │   └── infra/           # Prisma repositories, adapters
│   ├── vehicles/
│   ├── catalog/
│   ├── work-orders/
│   └── saga/
└── shared/                  # config, database, health
tests/                       # all tests, mirroring the src/ structure
├── e2e/
└── modules/
```

Dependency rule: `domain` → nothing, `application` → domain, `presentation`/`infra` → application. Framework and database code never leaks into domain or application layers.

## Getting started

Requirements: Node 24+, pnpm 10, Docker.

```bash
pnpm install
cp .env.example .env
docker compose up -d          # PostgreSQL + RabbitMQ
npx prisma migrate dev        # apply migrations
pnpm start:dev
```

The API is served at `http://localhost:3000`:

- Swagger UI: `http://localhost:3000/docs`
- Health check: `http://localhost:3000/health`
- RabbitMQ management UI: `http://localhost:15672` (user/pass: `workorder`)

## Scripts

| Command | Description |
|---|---|
| `pnpm start:dev` | Run in watch mode |
| `pnpm build` | Production build |
| `pnpm test` | Unit tests |
| `pnpm test:cov` | Unit tests with coverage (minimum 80%) |
| `pnpm test:e2e` | End-to-end tests (requires `docker compose up -d`) |
| `pnpm lint` / `pnpm lint:check` | ESLint with/without autofix |
| `pnpm format` | Prettier |

## Docker

```bash
docker build -t work-order-service .
docker run --env-file .env -p 3000:3000 work-order-service
```

## Contributing

`main` is protected: changes land through pull requests with code owner review. All code, comments and commit messages are written in English. Tests live in `tests/`, mirroring the `src/` structure.
