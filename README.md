# work-order-service

[![ci](https://github.com/tech-challenge-workshop/work-order-service/actions/workflows/ci.yml/badge.svg)](https://github.com/tech-challenge-workshop/work-order-service/actions/workflows/ci.yml)
[![Quality Gate](https://sonarcloud.io/api/project_badges/measure?project=tech-challenge-workshop_work-order-service&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=tech-challenge-workshop_work-order-service)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=tech-challenge-workshop_work-order-service&metric=coverage)](https://sonarcloud.io/component_measures?id=tech-challenge-workshop_work-order-service&metric=coverage)

Work order intake and lifecycle service for a vehicle repair shop platform — FIAP SOAT Tech Challenge (Phase 4).

This is one of four independent services:

| Service | Responsibility |
|---|---|
| **work-order-service** (this repo) | Customers, vehicles, service catalog, work order lifecycle, **saga orchestration** |
| [billing-service](https://github.com/tech-challenge-workshop/billing-service) | Quotes and payments (Mercado Pago) |
| [execution-service](https://github.com/tech-challenge-workshop/execution-service) | Parts inventory, stock control, repair execution |
| [auth-service](https://github.com/tech-challenge-workshop/auth-service) | Issues the JWTs this service validates |
| [tech-platform](https://github.com/tech-challenge-workshop/tech-platform) | Kong gateway, Datadog agent, Kubernetes manifests, OpenTofu |

Services communicate through RabbitMQ events (async, over a shared `saga` topic exchange) and REST (sync, only when strictly needed). Each service owns its database — no service touches another service's data store.

## Stack

- [NestJS 11](https://nestjs.com/) + TypeScript — HTTP API plus a RabbitMQ **message bus** (topic exchange) in a single process
- [Prisma 7](https://www.prisma.io/) with PostgreSQL (driver adapter)
- RabbitMQ for asynchronous messaging (saga orchestrator)
- `@nestjs/jwt` for token verification, Zod for environment validation, class-validator for HTTP DTOs
- `dd-trace` for Datadog APM, with structured JSON logs correlated by trace id
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
│   └── saga/                # orchestrator, event subscribers
└── shared/
    ├── auth/                # JWT guard, roles guard, @Roles / @Public decorators
    ├── notifications/       # customer notification on every status change
    ├── observability/       # Datadog tracing port + structured logger
    ├── config/ database/ messaging/ health/
tests/                       # all tests, mirroring the src/ structure
```

Dependency rule: `domain` → nothing, `application` → domain, `presentation`/`infra` → application. Framework and database code never leaks into domain or application layers.

## Authentication

This service **validates** tokens, it never issues them — that is `auth-service`'s job. Both share the same HS256 `JWT_SECRET`.

Two guards are registered globally via `APP_GUARD`: `JwtAuthGuard` verifies the bearer token and populates `request.user`, then `RolesGuard` enforces `@Roles(...)`. A route marked `@Public()` skips both.

| Route | Role |
|---|---|
| `POST/GET/PATCH/DELETE /customers`, `/vehicles`, `/repair-services` | `admin` |
| `GET /customers/lookup?document=` | **public** — called by `auth-service` before issuing a customer token |
| `POST /work-orders`, `GET /work-orders` | `admin` |
| `GET /work-orders/metrics/execution-time` | `admin` |
| `GET /work-orders/:id` | `admin` or `customer` (a customer only sees their own) |
| `GET /health` | **public** |

In production the same token is also checked at the edge by Kong's `jwt` plugin — defence in depth, so a misrouted request never reaches an unauthenticated handler.

## Why the saga is orchestrated

The requirements allow either strategy. We chose **orchestration**, with the
orchestrator living in this service.

**The decision follows data ownership.** A work order's status *is* the state of
the distributed transaction: `AWAITING_APPROVAL` means the quote step is
pending, `IN_EXECUTION` means payment cleared. This service already owns that
status and its history, and no other service is allowed to write it. Putting the
coordinator anywhere else would mean the component that decides the next step is
not the one that owns the state it depends on.

**Choreography would scatter a rule that is genuinely central.** The compensation
order is not symmetric: when execution fails we refund the payment, cancel the
quote and release the parts — in that order, and only the steps that actually
happened. Under choreography that ordering lives implicitly in who listens to
what, spread across three codebases. Here it is one `compensate()` method you
can read top to bottom, and the `SagaInstance` entity records which steps
completed so compensation never undoes something that never happened.

**It is also what makes the flow testable.** The
[BDD scenarios](tests/bdd/features/work-order-saga.feature) drive the whole
transaction — happy path and all four failure branches — by replaying messages
against the orchestrator, with no broker and no database. That is only possible
because the decisions are in one place.

**What we give up.** The orchestrator is a coupling point: adding a saga step
means changing this service, and it is a single point of failure for
coordination. We accept that trade-off because the alternative — debugging an
emergent ordering bug across three services — is worse at this scale. The
participants stay decoupled regardless: they receive commands and reply with
events, and none of them knows the others exist.

The failure paths and the compensating action for each step are specified in
the [feature file](tests/bdd/features/work-order-saga.feature).

## Business rules worth knowing

**Status machine.** `RECEIVED → IN_DIAGNOSIS → AWAITING_APPROVAL → IN_EXECUTION → FINISHED → DELIVERED`, plus `CANCELLED` through saga compensation. Status is never updated directly; every transition goes through a use case and is appended to the status history.

**Listing.** Ordered by status priority (`IN_EXECUTION > AWAITING_APPROVAL > IN_DIAGNOSIS > RECEIVED`), oldest first within a status. `FINISHED` and `DELIVERED` are hidden — logical exclusion, never a physical delete.

**Price snapshot.** Opening a work order fetches part prices from `execution-service` over REST (`GET /parts/prices?ids=`) and stores a snapshot of items and prices on the order. `billing-service` computes the quote from that snapshot, so a later price change never rewrites history.

**Customer notification.** Every status transition fires `NotificationPort.notifyStatusChange()`. The current adapter emits a structured log event (`work_order.status_changed`); swapping in e-mail or SMS is a one-adapter change.

**Average execution time.** `GET /work-orders/metrics/execution-time` derives the mean `IN_EXECUTION → FINISHED` duration from the status history, returning `{ sampleSize, averageSeconds }`.

## Requirements

Node 24+, pnpm 10, Docker.

The service is deployed continuously: every push to `main` builds, tests, scans
and rolls the new image out to the cluster, pinned to the commit SHA.

## Run this service

```bash
pnpm install
cp .env.example .env
docker compose up -d          # PostgreSQL + RabbitMQ (RabbitMQ is shared with the other services)
npx prisma migrate dev        # create/apply the database schema
pnpm start:dev                # http://localhost:3000
```

| Endpoint | URL |
|---|---|
| API | http://localhost:3000 |
| Swagger UI | http://localhost:3000/docs |
| Health check | http://localhost:3000/health |
| RabbitMQ management UI | http://localhost:15672 (user/pass: `workorder`) |

> This service also hosts the **RabbitMQ broker** used by the whole system (in its `docker-compose.yml`). Start this service's containers first; the other services connect to the same broker.

## Run the full system (distributed saga demo)

This shows the orchestrated saga crossing service boundaries. Clone all four service repos side by side.

**1. Start the infrastructure and every service** (four terminals):

```bash
# terminal 1 — work-order-service
docker compose up -d          # Postgres + RabbitMQ (shared broker)
npx prisma migrate dev
pnpm start:dev                # port 3000

# terminal 2 — billing-service
docker compose up -d          # Postgres on 5433
npx prisma migrate dev
pnpm start:dev                # port 3001

# terminal 3 — execution-service
docker compose up -d          # MongoDB
pnpm start:dev                # port 3002

# terminal 4 — auth-service
pnpm start:dev                # port 3003
```

**2. Get an admin token.** Every write route is protected, so this comes first:

```bash
ADMIN_TOKEN=$(curl -s -X POST localhost:3003/auth/admin \
  -H "X-Api-Key: $ADMIN_API_KEY" | jq -r .token)
```

**3. Seed data** (a part in execution, and customer/vehicle/service here):

```bash
AUTH="Authorization: Bearer $ADMIN_TOKEN"

curl -X POST localhost:3002/parts -H "$AUTH" -H 'content-type: application/json' \
  -d '{"name":"Brake pad","priceCents":5000,"initialQuantity":100}'

curl -X POST localhost:3000/customers -H "$AUTH" -H 'content-type: application/json' \
  -d '{"name":"John","document":"390.533.447-05"}'
curl -X POST localhost:3000/vehicles -H "$AUTH" -H 'content-type: application/json' \
  -d '{"customerId":"<CUSTOMER_ID>","plate":"ABC1D23","brand":"Toyota","model":"Corolla","year":2024}'
curl -X POST localhost:3000/repair-services -H "$AUTH" -H 'content-type: application/json' \
  -d '{"name":"Oil change","priceCents":15000}'
```

**4. Open a work order.** Part prices are fetched from execution over REST, and the saga starts:

```bash
curl -X POST localhost:3000/work-orders -H "$AUTH" -H 'content-type: application/json' \
  -d '{"customerId":"<CUSTOMER_ID>","vehicleId":"<VEHICLE_ID>","serviceIds":["<SERVICE_ID>"],"parts":[{"partId":"<PART_ID>","quantity":3}]}'
```

Within a second the order reaches `AWAITING_APPROVAL` — execution reserved the parts and billing generated the quote:

```bash
curl localhost:3000/work-orders/<WORK_ORDER_ID> -H "$AUTH"   # status: AWAITING_APPROVAL
curl localhost:3002/parts/<PART_ID> -H "$AUTH"               # availableQuantity: 97, reservedQuantity: 3
curl localhost:3001/quotes/<WORK_ORDER_ID> -H "$AUTH"        # the generated quote
```

**5. Approve the quote as the customer.** Approval is the customer's decision, so it needs a customer token — issued by `auth-service` against the CPF seeded in step 3:

```bash
CUSTOMER_TOKEN=$(curl -s -X POST localhost:3003/auth \
  -H 'content-type: application/json' \
  -d '{"document":"39053344705"}' | jq -r .token)

curl -X POST localhost:3001/quotes/<WORK_ORDER_ID>/approve \
  -H "Authorization: Bearer $CUSTOMER_TOKEN"
```

Payment is confirmed and the order moves to `IN_EXECUTION`, sitting in execution-service's queue.

**6. Run the repair** in execution-service, which consumes the reserved parts and closes the saga:

```bash
curl -X POST localhost:3002/executions/<WORK_ORDER_ID>/start-repair -H "$AUTH"
curl -X POST localhost:3002/executions/<WORK_ORDER_ID>/complete -H "$AUTH"

curl localhost:3000/work-orders/<WORK_ORDER_ID> -H "$AUTH"   # status: FINISHED
curl localhost:3002/parts/<PART_ID> -H "$AUTH"               # availableQuantity: 97, reservedQuantity: 0
```

To exercise **compensation** instead, call `/fail` rather than `/complete`: the reservation is released, the payment refunded, the quote cancelled and the order ends `CANCELLED`.

### Through the gateway

`tech-platform`'s local compose boots Kong on `:8000` in front of all four services. Swap `localhost:3000` for `localhost:8000` in any of the commands above and the flow is identical — Kong validates the JWT at the edge before proxying.

## BDD

The saga is specified in Gherkin at
[`tests/bdd/features/work-order-saga.feature`](tests/bdd/features/work-order-saga.feature),
written in the domain's own language — parts, quote, payment, repair — rather
than in message names. Six scenarios cover the happy path plus every
compensation branch: reservation failure, quote rejection, payment failure,
execution failure, and a redelivered message that must not advance the saga
twice.

```bash
pnpm test:bdd
```

The steps drive the real `WorkOrderSagaOrchestrator` against the same in-memory
fakes the unit tests use. The saga spans three services in production, but the
transaction is coordinated entirely here: every step is a message this
orchestrator sends or reacts to, so replaying those messages exercises the whole
flow without a database or a broker. That keeps the scenarios fast and
deterministic in CI, where they run right after the coverage gate.

> **Running the e2e suite locally:** stop `execution-service` and
> `billing-service` first. They subscribe to the same RabbitMQ exchange, so a
> running instance will consume the messages the e2e tests publish and advance
> their work orders mid-assertion.

## Observability

`dd-trace` reports APM traces to the Datadog Agent that `tech-platform`'s compose provides on `localhost:8126`. Application logs are JSON and carry `dd.trace_id` / `dd.span_id`, so a log line links back to its trace. Each saga step is wrapped in a custom span through `TracingPort.withSpan()`, which makes the whole distributed transaction one connected trace rather than four unrelated ones.

Without `DD_API_KEY` set the agent still runs and accepts traces locally; nothing is shipped.

## Deployment

Kubernetes manifests (`Deployment`, `Service`, `ConfigMap`, `Secret`, `HPA`) live in [`tech-platform/k8s/work-order-service`](https://github.com/tech-challenge-workshop/tech-platform/tree/main/k8s/work-order-service). The AWS infrastructure behind them — VPC, EKS, RDS, Amazon MQ — is OpenTofu in [`tech-platform/terraform`](https://github.com/tech-challenge-workshop/tech-platform/tree/main/terraform).

**Why the manifests are not in this repository.** The four services are always
deployed to the same cluster, behind the same Kong gateway, by the same
pipeline. Keeping a `k8s/` directory per repository would duplicate the
namespace, the Kong ingresses and plugins and the Datadog values four times
over, and those copies would drift the first time a route changed. Centralising them keeps one kustomize tree that renders the whole
platform and is validated by `kubeconform` on every pull request. The trade-off
is deliberate: this repository owns its application and its image, the platform
repository owns how the platform is assembled.

CI builds and pushes the image to `ghcr.io/tech-challenge-workshop/work-order-service` on every push to `main`.

## Scripts

| Command | Description |
|---|---|
| `pnpm start:dev` | Run in watch mode |
| `pnpm build` | Production build |
| `pnpm test` | Unit tests |
| `pnpm test:cov` | Unit tests with coverage (minimum 80%) |
| `pnpm test:e2e` | End-to-end tests (requires `docker compose up -d`) |
| `pnpm test:ci` | Combined unit + e2e coverage — the gate CI enforces |
| `pnpm test:bdd` | Cucumber scenarios for the saga (no database or broker needed) |
| `pnpm lint` / `pnpm lint:check` | ESLint with/without autofix |
| `pnpm format` | Prettier |

## Test coverage

The badges at the top are live: they come from the SonarCloud analysis CI runs
on every push to `main`. Full report, file by file:
**[sonarcloud.io › work-order-service](https://sonarcloud.io/component_measures?id=tech-challenge-workshop_work-order-service&metric=coverage)**

`pnpm test:ci` merges unit and e2e runs into a single report and **fails the
build below 80%** on statements, branches, functions and lines — the threshold
lives in [`tests/jest-cov.json`](tests/jest-cov.json), so the gate is enforced
locally and in CI by the same config.

To reproduce:

```bash
docker compose up -d
pnpm test:ci        # prints the coverage summary, writes coverage/lcov.info
```

> Stop `execution-service` and `billing-service` before running it — see the
> note in the BDD section above.

## Docker

```bash
docker build -t work-order-service .
docker run --env-file .env -p 3000:3000 work-order-service
```

## Contributing

`main` is protected: changes land through pull requests with code owner review. All code, comments and commit messages are written in English. Tests live in `tests/`, mirroring the `src/` structure.
