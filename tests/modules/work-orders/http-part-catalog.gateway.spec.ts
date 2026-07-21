import { ConfigService } from '@nestjs/config'
import { HttpPartCatalogGateway } from '../../../src/modules/work-orders/infra/http-part-catalog.gateway'

function gateway(): HttpPartCatalogGateway {
  const config = { getOrThrow: () => 'http://execution.test' } as unknown as ConfigService
  return new HttpPartCatalogGateway(config)
}

describe('HttpPartCatalogGateway', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('returns an empty array without calling the service when there are no ids', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch')

    expect(await gateway().findByIds([])).toEqual([])
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('fetches the part snapshots for the given ids', async () => {
    const snapshots = [{ partId: 'p-1', description: 'Brake pad', unitPriceCents: 5000 }]
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue({ ok: true, json: () => Promise.resolve(snapshots) } as Response)

    const result = await gateway().findByIds(['p-1'])

    expect(result).toEqual(snapshots)
    expect(fetchSpy).toHaveBeenCalledWith('http://execution.test/parts?ids=p-1')
  })

  it('throws when the service responds with an error', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: false, status: 500 } as Response)

    await expect(gateway().findByIds(['p-1'])).rejects.toThrow('execution service')
  })
})
