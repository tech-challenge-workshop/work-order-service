export const SagaMessage = {
  WorkOrderOpened: 'work-order.opened',
  ReserveParts: 'parts.reserve',
  PartsReserved: 'parts.reserved',
  PartsReservationFailed: 'parts.reservation-failed',
  ReleaseParts: 'parts.release',
  GenerateQuote: 'quote.generate',
  QuoteGenerated: 'quote.generated',
  QuoteApproved: 'quote.approved',
  QuoteRejected: 'quote.rejected',
  CancelQuote: 'quote.cancel',
  ConfirmPayment: 'payment.confirm',
  PaymentConfirmed: 'payment.confirmed',
  PaymentFailed: 'payment.failed',
  RefundPayment: 'payment.refund',
  StartExecution: 'execution.start',
  ExecutionCompleted: 'execution.completed',
  ExecutionFailed: 'execution.failed',
} as const

export interface WorkOrderOpenedPayload {
  workOrderId: string
  parts: { partId: string; quantity: number }[]
  totalCents: number
}

export interface WorkOrderRefPayload {
  workOrderId: string
}

export interface ReservePartsPayload {
  workOrderId: string
  parts: { partId: string; quantity: number }[]
}

export interface GenerateQuotePayload {
  workOrderId: string
  totalCents: number
}
