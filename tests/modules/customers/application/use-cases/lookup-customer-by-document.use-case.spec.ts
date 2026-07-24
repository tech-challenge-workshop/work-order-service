import {
  CustomerNotFoundError,
  InvalidDocumentError,
} from '../../../../../src/modules/customers/domain/errors/customer.errors'
import { LookupCustomerByDocumentUseCase } from '../../../../../src/modules/customers/application/use-cases/lookup-customer-by-document.use-case'
import {
  customerWith,
  FakeCustomerRepository,
  VALID_CPF,
  VALID_CPF_MASKED,
} from '../../customer.fixtures'

describe('LookupCustomerByDocumentUseCase', () => {
  let repository: FakeCustomerRepository
  let useCase: LookupCustomerByDocumentUseCase

  beforeEach(() => {
    repository = new FakeCustomerRepository()
    useCase = new LookupCustomerByDocumentUseCase(repository)
  })

  it('returns the customer output for a document that matches (raw and masked forms are equivalent)', async () => {
    const customer = customerWith({ email: 'john@example.com' })
    repository.customers.push(customer)

    const fromRaw = await useCase.execute(VALID_CPF)
    const fromMasked = await useCase.execute(VALID_CPF_MASKED)

    expect(fromRaw).toMatchObject({ id: customer.id, document: VALID_CPF_MASKED })
    expect(fromMasked).toMatchObject({ id: customer.id, document: VALID_CPF_MASKED })
  })

  it('throws InvalidDocumentError for a malformed document', async () => {
    await expect(useCase.execute('123')).rejects.toThrow(InvalidDocumentError)
  })

  it('throws CustomerNotFoundError when no customer has the document', async () => {
    await expect(useCase.execute(VALID_CPF)).rejects.toThrow(CustomerNotFoundError)
  })

  it('throws CustomerNotFoundError for soft-deleted customers', async () => {
    repository.customers.push(customerWith({ deletedAt: new Date('2026-01-02T00:00:00Z') }))

    await expect(useCase.execute(VALID_CPF)).rejects.toThrow(CustomerNotFoundError)
  })
})
