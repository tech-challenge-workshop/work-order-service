export const PART_CATALOG_GATEWAY = Symbol('PART_CATALOG_GATEWAY')

export interface PartSnapshot {
  partId: string
  description: string
  unitPriceCents: number
}

/** Synchronous read of the parts catalog owned by the execution service. */
export interface PartCatalogGateway {
  findByIds(ids: string[]): Promise<PartSnapshot[]>
}
