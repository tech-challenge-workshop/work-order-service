import { Document } from '../../../../../src/modules/customers/domain/value-objects/document'
import { ListCustomersUseCase } from '../../../../../src/modules/customers/application/use-cases/list-customers.use-case'
import { customerWith, FakeCustomerRepository, VALID_CNPJ } from '../../customer.fixtures'

describe('ListCustomersUseCase', () => {
  let repository: FakeCustomerRepository
  let useCase: ListCustomersUseCase

  beforeEach(() => {
    repository = new FakeCustomerRepository()
    useCase = new ListCustomersUseCase(repository)
  })

  it('returns paginated items with total, page and perPage', async () => {
    repository.customers.push(
      customerWith({ name: 'Alice' }),
      customerWith({ name: 'Bob', document: Document.create(VALID_CNPJ) }),
    )

    const output = await useCase.execute({ page: 1, perPage: 1 })

    expect(output.items).toHaveLength(1)
    expect(output.items[0].name).toBe('Alice')
    expect(output).toMatchObject({ total: 2, page: 1, perPage: 1 })
  })

  it('passes search through to the repository', async () => {
    repository.customers.push(
      customerWith({ name: 'Alice' }),
      customerWith({ name: 'Bob', document: Document.create(VALID_CNPJ) }),
    )

    const output = await useCase.execute({ page: 1, perPage: 10, search: 'ali' })

    expect(output.items).toHaveLength(1)
    expect(output.items[0].name).toBe('Alice')
  })

  it('returns an empty page when there are no customers', async () => {
    const output = await useCase.execute({ page: 1, perPage: 10 })

    expect(output.items).toHaveLength(0)
    expect(output.total).toBe(0)
  })
})
