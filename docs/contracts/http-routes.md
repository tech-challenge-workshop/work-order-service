# HTTP Route Catalog

Kong remains the public entry point for Phase 4. The three microservices expose
HTTP APIs internally through Kubernetes `ClusterIP` services. Public clients call
Kong; Kong routes requests to the correct service and applies gateway policies.

## Authentication Model

| Route type | Caller | Authentication |
| --- | --- | --- |
| Public health/docs | Evaluator, operator, platform | No JWT required. |
| Customer route | Customer | JWT issued by `tech-lambda` after CPF authentication. |
| Staff route | Admin, receptionist, mechanic | Internal JWT/role validation compatible with Phase 3 conventions. |
| Provider webhook | Mercado Pago | Public endpoint with provider verification/reconciliation handled by `billing-service`. |

Services validate the token they receive. They do not issue customer CPF tokens;
`tech-lambda` keeps that responsibility.

## Gateway Policies

Kong should keep these Phase 3 policies and apply them consistently:

- Correlation ID propagation through `X-Request-Id`.
- CORS for public API consumers.
- Rate limiting on public and customer-facing routes.
- JWT validation on protected routes.
- Dedicated public route for Mercado Pago webhook delivery.

## `work-order-service`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/work-orders/health` or `/health` | Public | Service health check. |
| `GET` | `/work-orders/docs` or `/docs` | Public/internal | Swagger documentation. |
| `POST` | `/customers` | Staff | Create customer data needed for Work Orders. |
| `GET` | `/customers` | Staff | List customers. |
| `GET` | `/customers/{customerId}` | Staff | Read customer details. |
| `PATCH` | `/customers/{customerId}` | Staff | Update customer details. |
| `DELETE` | `/customers/{customerId}` | Staff | Soft delete customer. |
| `POST` | `/customers/{customerId}/vehicles` | Staff | Add a vehicle for a customer. |
| `GET` | `/customers/{customerId}/vehicles` | Staff | List customer vehicles. |
| `PATCH` | `/vehicles/{vehicleId}` | Staff | Update vehicle details. |
| `DELETE` | `/vehicles/{vehicleId}` | Staff | Soft delete vehicle. |
| `POST` | `/catalog/repair-services` | Staff | Create repair service catalog item. |
| `GET` | `/catalog/repair-services` | Staff | List repair service catalog items. |
| `PATCH` | `/catalog/repair-services/{repairServiceId}` | Staff | Update repair service catalog item. |
| `DELETE` | `/catalog/repair-services/{repairServiceId}` | Staff | Disable repair service catalog item. |
| `POST` | `/work-orders` | Staff | Open Work Order and persist item/price snapshot. |
| `GET` | `/work-orders` | Staff | Operational listing sorted by status priority and age. |
| `GET` | `/work-orders/{workOrderId}` | Staff | Work Order detail and status history. |
| `GET` | `/customers/me/work-orders/{workOrderId}` | Customer | Customer status/history query for their own Work Order. |

### Work Order Route Rules

- Opening a Work Order must not call the `billing-service` database.
- Opening a Work Order publishes `WorkOrderReadyForQuote` asynchronously.
- The response may return the Work Order ID before quote generation is complete.
- Customer routes must verify that the JWT customer identity owns the requested
  Work Order.

## `billing-service`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/billing/health` or `/health` | Public | Service health check. |
| `GET` | `/billing/docs` or `/docs` | Public/internal | Swagger documentation. |
| `GET` | `/quotes/{quoteId}` | Customer or staff | Read quote status and lines. |
| `POST` | `/quotes/{quoteId}/approve` | Customer | Approve generated quote. |
| `POST` | `/quotes/{quoteId}/reject` | Customer | Reject generated quote. |
| `POST` | `/quotes/{quoteId}/payments` | Customer | Create Mercado Pago payment/preference for an approved quote. |
| `GET` | `/payments/{paymentId}` | Customer or staff | Read local payment status. |
| `POST` | `/webhooks/mercado-pago` | Provider webhook | Receive Mercado Pago payment status notification. |

### Billing Route Rules

- Quotes are generated automatically from `WorkOrderReadyForQuote` events, not
  by reading the Work Order database.
- Payment creation must use a persisted idempotency key.
- Mercado Pago webhook handling must be idempotent.
- Unknown or out-of-order provider events must be parked or retried, not lost.

## `execution-service`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/execution/health` or `/health` | Public | Service health check. |
| `GET` | `/execution/docs` or `/docs` | Public/internal | Swagger documentation. |
| `GET` | `/executions/{executionId}` | Staff | Read execution workflow. |
| `GET` | `/work-orders/{workOrderId}/execution` | Staff | Read execution workflow by Work Order. |
| `POST` | `/executions/{executionId}/diagnosis/start` | Mechanic/staff | Mark diagnosis as started. |
| `POST` | `/executions/{executionId}/diagnosis/complete` | Mechanic/staff | Mark diagnosis as complete. |
| `POST` | `/executions/{executionId}/repair/start` | Mechanic/staff | Mark repair execution as started. |
| `POST` | `/executions/{executionId}/repair/complete` | Mechanic/staff | Mark repair execution as complete and publish `ExecutionCompleted`. |
| `POST` | `/executions/{executionId}/fail` | Mechanic/staff | Record operational failure and publish `ExecutionFailed`. |

### Execution Route Rules

- Execution starts from the `StartExecution` command after payment confirmation.
- Execution must not read the Work Order or Billing databases.
- Execution progress is published back to `work-order-service` through events.

## Kong Route Ownership

| Gateway path prefix | Upstream service |
| --- | --- |
| `/auth/customer/login` | `tech-lambda` through the existing Phase 3 Lambda integration. |
| `/customers`, `/vehicles`, `/catalog`, `/work-orders`, `/customers/me/work-orders` | `work-order-service`. |
| `/quotes`, `/payments`, `/webhooks/mercado-pago` | `billing-service`. |
| `/executions`, `/work-orders/{workOrderId}/execution` | `execution-service`. |

If two services need similar path shapes, Kong configuration must keep explicit
route priority so customer-facing Work Order routes are not shadowed by
Execution routes.
