# Microservices Architecture

Phase 4 evolves the previous modular monolith into three independent
microservices while reusing the Phase 3 platform assets: Kong, CPF
authentication Lambda, Kubernetes, CI/CD, Datadog, Docker, and database
infrastructure patterns.

## Service Ownership

| Service | Owns | Does not own |
| --- | --- | --- |
| `work-order-service` | Customers and vehicles needed for Work Orders, repair service catalog, Work Order lifecycle, item/price snapshots, status history, Saga orchestration. | Quote lifecycle, payment provider state, execution workflow internals. |
| `billing-service` | Quote generation from snapshots, quote approval/refusal, Mercado Pago payment creation, payment webhooks, payment status. | Work Order database, catalog database, execution workflow. |
| `execution-service` | Diagnosis workflow, repair execution queue, progress, completion and failure outcomes. | Work Order database, quote/payment database. |

No service may access another service's database. Integration happens through
RabbitMQ events/commands and controlled REST APIs when strictly needed.

## Runtime Architecture

```mermaid
flowchart TB
    Client["Customer / Staff"]
    Kong["Kong API Gateway"]
    Lambda["tech-lambda<br/>CPF auth + JWT"]
    WO["work-order-service<br/>Work Orders + Catalog + Saga"]
    Billing["billing-service<br/>Quotes + Mercado Pago"]
    Execution["execution-service<br/>Diagnosis + Repair Execution"]
    RMQ["RabbitMQ<br/>Events + Saga commands"]
    WODB["PostgreSQL<br/>work_order_db"]
    BillingDB["PostgreSQL<br/>billing_db"]
    ExecDB["NoSQL<br/>execution_db"]
    MP["Mercado Pago"]
    DD["Datadog<br/>Logs + Traces + Metrics"]

    Client --> Kong
    Kong --> Lambda
    Kong --> WO
    Kong --> Billing
    Kong --> Execution

    WO --> WODB
    Billing --> BillingDB
    Execution --> ExecDB

    WO <--> RMQ
    Billing <--> RMQ
    Execution <--> RMQ

    Billing --> MP
    MP --> Billing

    WO -.-> DD
    Billing -.-> DD
    Execution -.-> DD
    Kong -.-> DD
    Lambda -.-> DD
```

## Saga Strategy

The Saga is orchestrated by `work-order-service`.

Reasoning:

- The Work Order is the central business lifecycle.
- The orchestrator can keep one readable Saga state for evaluation and support.
- Billing and Execution keep local autonomy: they own their transactions and
  publish outcomes, but do not coordinate the whole process.
- Compensation steps are explicit messages, which makes failure handling easier
  to demonstrate in the final video.

## Happy Path

```mermaid
sequenceDiagram
    autonumber
    participant C as Customer/Staff
    participant WO as work-order-service
    participant B as billing-service
    participant MP as Mercado Pago
    participant E as execution-service
    participant Q as RabbitMQ

    C->>WO: Open Work Order
    WO->>WO: Persist WorkOrder + item/price snapshot
    WO->>Q: WorkOrderReadyForQuote
    Q->>B: WorkOrderReadyForQuote
    B->>B: Generate and persist Quote
    B->>Q: QuoteGenerated
    Q->>WO: QuoteGenerated
    C->>B: Approve Quote
    B->>Q: QuoteApproved
    B->>MP: Create payment/preference with idempotency key
    MP-->>B: Payment pending/created
    MP->>B: Webhook payment approved
    B->>Q: PaymentConfirmed
    Q->>WO: PaymentConfirmed
    WO->>Q: StartExecution
    Q->>E: StartExecution
    E->>E: Persist execution workflow
    E->>Q: ExecutionStarted
    E->>E: Complete repair workflow
    E->>Q: ExecutionCompleted
    Q->>WO: ExecutionCompleted
    WO->>WO: Mark Work Order finished
```

## Compensation Paths

```mermaid
sequenceDiagram
    autonumber
    participant WO as work-order-service
    participant B as billing-service
    participant E as execution-service
    participant Q as RabbitMQ

    WO->>Q: WorkOrderReadyForQuote
    Q->>B: WorkOrderReadyForQuote

    alt Quote generation fails
        B->>Q: QuoteGenerationFailed
        Q->>WO: QuoteGenerationFailed
        WO->>WO: Cancel Work Order + record compensation
    else Payment fails or expires
        B->>Q: PaymentFailed
        Q->>WO: PaymentFailed
        WO->>WO: Mark payment failure terminal state
    else Execution fails after payment
        E->>Q: ExecutionFailed
        Q->>WO: ExecutionFailed
        WO->>WO: Mark manual review / operational failure
        WO->>Q: RequestBillingCompensation
        Q->>B: RequestBillingCompensation
        B->>B: Record refund/manual compensation request
        B->>Q: BillingCompensationRecorded
    end
```

## Data Ownership

| Data | Owner | Notes |
| --- | --- | --- |
| Customer data needed for Work Orders | `work-order-service` | Stored locally for intake and customer status queries. |
| Vehicle data | `work-order-service` | Linked to customer and Work Order. |
| Repair service catalog | `work-order-service` | Source of pricing snapshot at Work Order opening. |
| Quote | `billing-service` | Generated automatically from `WorkOrderReadyForQuote`. |
| Payment | `billing-service` | Stores Mercado Pago IDs, local external reference, idempotency key, and status. |
| Execution workflow | `execution-service` | Stored in the selected NoSQL database. |
| Saga state | `work-order-service` | Tracks orchestration step, outcomes, and compensation status. |

## Observability

All services must log and propagate:

- `correlationId`
- `messageId`
- `workOrderId` when available
- service name, environment, and version

Kubernetes manifests must keep Datadog service labels so logs, metrics, and
traces can be filtered per service during the final demonstration.
