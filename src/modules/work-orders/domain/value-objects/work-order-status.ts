export enum WorkOrderStatus {
  RECEIVED = 'RECEIVED',
  IN_DIAGNOSIS = 'IN_DIAGNOSIS',
  AWAITING_APPROVAL = 'AWAITING_APPROVAL',
  IN_EXECUTION = 'IN_EXECUTION',
  FINISHED = 'FINISHED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

const ALLOWED_TRANSITIONS: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  [WorkOrderStatus.RECEIVED]: [WorkOrderStatus.IN_DIAGNOSIS, WorkOrderStatus.CANCELLED],
  [WorkOrderStatus.IN_DIAGNOSIS]: [WorkOrderStatus.AWAITING_APPROVAL, WorkOrderStatus.CANCELLED],
  [WorkOrderStatus.AWAITING_APPROVAL]: [WorkOrderStatus.IN_EXECUTION, WorkOrderStatus.CANCELLED],
  [WorkOrderStatus.IN_EXECUTION]: [WorkOrderStatus.FINISHED, WorkOrderStatus.CANCELLED],
  [WorkOrderStatus.FINISHED]: [WorkOrderStatus.DELIVERED],
  [WorkOrderStatus.DELIVERED]: [],
  [WorkOrderStatus.CANCELLED]: [],
}

/** Listing priority for the active work queue; lower shows first (Phase 2 rule). */
const LISTING_PRIORITY: Partial<Record<WorkOrderStatus, number>> = {
  [WorkOrderStatus.IN_EXECUTION]: 0,
  [WorkOrderStatus.AWAITING_APPROVAL]: 1,
  [WorkOrderStatus.IN_DIAGNOSIS]: 2,
  [WorkOrderStatus.RECEIVED]: 3,
}

export const TERMINAL_STATUSES: WorkOrderStatus[] = [
  WorkOrderStatus.FINISHED,
  WorkOrderStatus.DELIVERED,
  WorkOrderStatus.CANCELLED,
]

export function canTransition(from: WorkOrderStatus, to: WorkOrderStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to)
}

export function listingPriorityOf(status: WorkOrderStatus): number {
  return LISTING_PRIORITY[status] ?? Number.MAX_SAFE_INTEGER
}
