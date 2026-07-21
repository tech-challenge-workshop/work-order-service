import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PartCatalogGateway, PartSnapshot } from '../application/ports/part-catalog.gateway'

@Injectable()
export class HttpPartCatalogGateway implements PartCatalogGateway {
  private readonly baseUrl: string

  constructor(config: ConfigService) {
    this.baseUrl = config.getOrThrow<string>('EXECUTION_SERVICE_URL')
  }

  async findByIds(ids: string[]): Promise<PartSnapshot[]> {
    if (ids.length === 0) {
      return []
    }

    const url = `${this.baseUrl}/parts?ids=${ids.join(',')}`
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch parts from execution service: ${response.status}`)
    }

    return (await response.json()) as PartSnapshot[]
  }
}
