export enum SagaStatus {
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum SagaStep {
  STARTED = 'STARTED',
  RESERVING_PARTS = 'RESERVING_PARTS',
  GENERATING_QUOTE = 'GENERATING_QUOTE',
  AWAITING_APPROVAL = 'AWAITING_APPROVAL',
  CONFIRMING_PAYMENT = 'CONFIRMING_PAYMENT',
  EXECUTING = 'EXECUTING',
  COMPLETED = 'COMPLETED',
  COMPENSATED = 'COMPENSATED',
}

export interface SagaInstanceProps {
  workOrderId: string
  status: SagaStatus
  step: SagaStep
  partsReserved: boolean
  quoteGenerated: boolean
  paymentConfirmed: boolean
  createdAt: Date
  updatedAt: Date
}

export class SagaInstance {
  private constructor(private readonly props: SagaInstanceProps) {}

  static start(workOrderId: string): SagaInstance {
    const now = new Date()
    return new SagaInstance({
      workOrderId,
      status: SagaStatus.RUNNING,
      step: SagaStep.RESERVING_PARTS,
      partsReserved: false,
      quoteGenerated: false,
      paymentConfirmed: false,
      createdAt: now,
      updatedAt: now,
    })
  }

  static restore(props: SagaInstanceProps): SagaInstance {
    return new SagaInstance(props)
  }

  private touch(step: SagaStep): void {
    this.props.step = step
    this.props.updatedAt = new Date()
  }

  markPartsReserved(): void {
    this.props.partsReserved = true
    this.touch(SagaStep.GENERATING_QUOTE)
  }

  markQuoteGenerated(): void {
    this.props.quoteGenerated = true
    this.touch(SagaStep.AWAITING_APPROVAL)
  }

  markPaymentRequested(): void {
    this.touch(SagaStep.CONFIRMING_PAYMENT)
  }

  markPaymentConfirmed(): void {
    this.props.paymentConfirmed = true
    this.touch(SagaStep.EXECUTING)
  }

  complete(): void {
    this.props.status = SagaStatus.COMPLETED
    this.touch(SagaStep.COMPLETED)
  }

  cancel(): void {
    this.props.status = SagaStatus.CANCELLED
    this.touch(SagaStep.COMPENSATED)
  }

  get workOrderId(): string {
    return this.props.workOrderId
  }

  get status(): SagaStatus {
    return this.props.status
  }

  get step(): SagaStep {
    return this.props.step
  }

  get partsReserved(): boolean {
    return this.props.partsReserved
  }

  get quoteGenerated(): boolean {
    return this.props.quoteGenerated
  }

  get paymentConfirmed(): boolean {
    return this.props.paymentConfirmed
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  get isRunning(): boolean {
    return this.props.status === SagaStatus.RUNNING
  }
}
