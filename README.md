# work-order-service

Work order intake and lifecycle service for a vehicle repair shop platform — FIAP SOAT Tech Challenge (Phase 4).

This is one of three independent microservices:

| Service | Responsibility |
|---|---|
| **work-order-service** (this repo) | Customers, vehicles, service catalog, work order lifecycle, **saga orchestration** |
| billing-service | Quotes and payments (Mercado Pago) — _not built yet; stubbed here_ |
| execution-service | Parts inventory, stock control, repair execution |

Services communicate through RabbitMQ events (async, over a shared `saga` topic exchange) and REST (sync, only when strictly needed). Each service owns its database — no service touches another service's data store.

## Stack

- [NestJS 11](https://nestjs.com/) + TypeScript — HTTP API plus a RabbitMQ **message bus** (topic exchange) in a single process
- [Prisma 7](https://www.prisma.io/) with PostgreSQL (driver adapter)
- RabbitMQ for asynchronous messaging (saga orchestrator)
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
│   └── saga/                # orchestrator, event subscribers, billing stub
└── shared/                  # config, database, messaging, health
tests/                       # all tests, mirroring the src/ structure
```

Dependency rule: `domain` → nothing, `application` → domain, `presentation`/`infra` → application. Framework and database code never leaks into domain or application layers.

## Requirements

Node 24+, pnpm 10, Docker.

## Run this service

```bash
pnpm install
cp .env.example .env
docker compose up -d          # PostgreSQL + RabbitMQ (RabbitMQ is shared with execution-service)
npx prisma migrate dev        # create/apply the database schema
pnpm start:dev                # http://localhost:3000
```

| Endpoint | URL |
|---|---|
| API | http://localhost:3000 |
| Swagger UI | http://localhost:3000/docs |
| Health check | http://localhost:3000/health |
| RabbitMQ management UI | http://localhost:15672 (user/pass: `workorder`) |

> This service also hosts the **RabbitMQ broker** used by the whole system (in its `docker-compose.yml`). Start this service's containers first; `execution-service` connects to the same broker.

Opening a work order with parts calls `execution-service` over REST for part prices, so for the full flow run both services (next section). Without execution running, open work orders using services only (`serviceIds`) and no `parts`.

## Run the full system (distributed saga demo)

This shows the orchestrated saga crossing service boundaries. You need **both** repositories cloned side by side.

**1. Start the infrastructure and both services** (two terminals):

```bash
# terminal 1 — work-order-service
docker compose up -d          # Postgres + RabbitMQ
npx prisma migrate dev
pnpm start:dev                # port 3000

# terminal 2 — execution-service
docker compose up -d          # MongoDB
pnpm start:dev                # port 3002
```

**2. Seed data** (a part in execution, and customer/vehicle/service in work-order):

```bash
# a part in execution-service (note the returned id)
curl -X POST localhost:3002/parts -H 'content-type: application/json' \
  -d '{"name":"Brake pad","priceCents":5000,"initialQuantity":100}'

# customer, vehicle and service in work-order-service (note each id)
curl -X POST localhost:3000/customers -H 'content-type: application/json' \
  -d '{"name":"John","document":"390.533.447-05"}'
curl -X POST localhost:3000/vehicles -H 'content-type: application/json' \
  -d '{"customerId":"<CUSTOMER_ID>","plate":"ABC1D23","brand":"Toyota","model":"Corolla","year":2024}'
curl -X POST localhost:3000/repair-services -H 'content-type: application/json' \
  -d '{"name":"Oil change","priceCents":15000}'
```

**3. Open a work order** (with the part). Its price is fetched from execution over REST, and the saga starts:

```bash
curl -X POST localhost:3000/work-orders -H 'content-type: application/json' \
  -d '{"customerId":"<CUSTOMER_ID>","vehicleId":"<VEHICLE_ID>","serviceIds":["<SERVICE_ID>"],"parts":[{"partId":"<PART_ID>","quantity":3}]}'
```

Within a second the order reaches `AWAITING_APPROVAL` (execution reserved the parts, the billing stub generated the quote). Check it:

```bash
curl localhost:3000/work-orders/<WORK_ORDER_ID>     # status: AWAITING_APPROVAL
curl localhost:3002/parts/<PART_ID>                 # availableQuantity: 97, reservedQuantity: 3
```

**4. Approve the quote.** Approval is an external decision (it will come from `billing-service`). For now, publish it to the `saga` topic exchange via the RabbitMQ management UI:

- Open http://localhost:15672 (`workorder` / `workorder`) → **Exchanges** → **saga** → **Publish message**
- Routing key: `quote.approved`
- Payload: `{"workOrderId":"<WORK_ORDER_ID>"}`

The saga finishes on its own: payment confirmed → execution runs → parts consumed → order `FINISHED`.

```bash
curl localhost:3000/work-orders/<WORK_ORDER_ID>     # status: FINISHED
curl localhost:3002/parts/<PART_ID>                 # availableQuantity: 97, reservedQuantity: 0 (consumed)
```

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
