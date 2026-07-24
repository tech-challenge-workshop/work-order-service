import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import { App } from 'supertest/types'
import { JwtService } from '@nestjs/jwt'
import { AppModule } from '../../src/app.module'
import { PrismaService } from '../../src/shared/database/prisma.service'

const VALID_CPF = '390.533.447-05'
const VALID_CNPJ = '11.222.333/0001-81'
const MISSING_UUID = '00000000-0000-4000-8000-000000000000'

describe('Customers (e2e)', () => {
  let app: INestApplication<App>
  let prisma: PrismaService
  let bearer: string

  const http = () => {
    const server = app.getHttpServer()
    return {
      get: (url: string) => request(server).get(url).set('Authorization', bearer),
      post: (url: string) => request(server).post(url).set('Authorization', bearer),
      patch: (url: string) => request(server).patch(url).set('Authorization', bearer),
      delete: (url: string) => request(server).delete(url).set('Authorization', bearer),
    }
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
    )
    await app.init()

    prisma = app.get(PrismaService)
    bearer = `Bearer ${app.get(JwtService).sign({ sub: 'e2e-admin', role: 'admin' })}`
  })

  beforeEach(async () => {
    await prisma.vehicle.deleteMany()
    await prisma.customer.deleteMany()
  })

  afterAll(async () => {
    await prisma.vehicle.deleteMany()
    await prisma.customer.deleteMany()
    await app.close()
  })

  async function createCustomer(payload: Record<string, unknown>): Promise<{ id: string }> {
    const response = await http().post('/customers').send(payload).expect(201)
    return response.body as { id: string }
  }

  describe('POST /customers', () => {
    it('creates a customer and returns 201 with the masked document', async () => {
      const response = await http()
        .post('/customers')
        .send({ name: 'John Doe', document: '39053344705', email: 'john@example.com' })
        .expect(201)

      expect(response.body).toMatchObject({
        name: 'John Doe',
        document: VALID_CPF,
        documentType: 'CPF',
        email: 'john@example.com',
      })
      expect(response.body).toHaveProperty('id')
    })

    it('returns 409 for a duplicated document', async () => {
      await createCustomer({ name: 'John Doe', document: VALID_CPF })

      await http()
        .post('/customers')
        .send({ name: 'Jane Doe', document: '39053344705' })
        .expect(409)
    })

    it('returns 400 for an invalid document', async () => {
      await http()
        .post('/customers')
        .send({ name: 'John Doe', document: '12345678900' })
        .expect(400)
    })

    it('returns 400 for unknown body fields', async () => {
      await http()
        .post('/customers')
        .send({ name: 'John Doe', document: VALID_CPF, role: 'admin' })
        .expect(400)
    })
  })

  describe('GET /customers/:id', () => {
    it('returns the customer', async () => {
      const { id } = await createCustomer({ name: 'John Doe', document: VALID_CPF })

      const response = await http().get(`/customers/${id}`).expect(200)

      expect(response.body).toMatchObject({ id, name: 'John Doe', document: VALID_CPF })
    })

    it('returns 404 for an unknown id', async () => {
      await http().get(`/customers/${MISSING_UUID}`).expect(404)
    })

    it('returns 400 for a malformed id', async () => {
      await http().get('/customers/not-a-uuid').expect(400)
    })
  })

  describe('GET /customers', () => {
    it('lists customers ordered by name with pagination metadata', async () => {
      await createCustomer({ name: 'Bob', document: VALID_CPF })
      await createCustomer({ name: 'Alice', document: VALID_CNPJ })

      const response = await http().get('/customers').expect(200)

      expect(response.body).toMatchObject({ total: 2, page: 1, perPage: 20 })
      const items = (response.body as { items: { name: string }[] }).items
      expect(items.map((item) => item.name)).toEqual(['Alice', 'Bob'])
    })

    it('filters by search term', async () => {
      await createCustomer({ name: 'Bob', document: VALID_CPF })
      await createCustomer({ name: 'Alice', document: VALID_CNPJ })

      const response = await http().get('/customers').query({ search: 'ali' }).expect(200)

      expect(response.body).toMatchObject({ total: 1 })
    })

    it('excludes soft-deleted customers', async () => {
      const { id } = await createCustomer({ name: 'John Doe', document: VALID_CPF })
      await http().delete(`/customers/${id}`).expect(204)

      const response = await http().get('/customers').expect(200)

      expect(response.body).toMatchObject({ total: 0 })
    })
  })

  describe('PATCH /customers/:id', () => {
    it('updates contact data', async () => {
      const { id } = await createCustomer({ name: 'John Doe', document: VALID_CPF })

      const response = await http()
        .patch(`/customers/${id}`)
        .send({ name: 'Jane Doe', phone: '+55 11 99999-9999' })
        .expect(200)

      expect(response.body).toMatchObject({
        id,
        name: 'Jane Doe',
        phone: '+55 11 99999-9999',
        document: VALID_CPF,
      })
    })

    it('rejects document changes', async () => {
      const { id } = await createCustomer({ name: 'John Doe', document: VALID_CPF })

      await http().patch(`/customers/${id}`).send({ document: VALID_CNPJ }).expect(400)
    })

    it('returns 404 for an unknown id', async () => {
      await http().patch(`/customers/${MISSING_UUID}`).send({ name: 'Jane Doe' }).expect(404)
    })
  })

  describe('DELETE /customers/:id', () => {
    it('soft-deletes and the customer stops being readable', async () => {
      const { id } = await createCustomer({ name: 'John Doe', document: VALID_CPF })

      await http().delete(`/customers/${id}`).expect(204)
      await http().get(`/customers/${id}`).expect(404)
    })

    it('returns 404 when already deleted', async () => {
      const { id } = await createCustomer({ name: 'John Doe', document: VALID_CPF })
      await http().delete(`/customers/${id}`).expect(204)

      await http().delete(`/customers/${id}`).expect(404)
    })

    it('keeps the document reserved after deletion', async () => {
      const { id } = await createCustomer({ name: 'John Doe', document: VALID_CPF })
      await http().delete(`/customers/${id}`).expect(204)

      await http().post('/customers').send({ name: 'John Again', document: VALID_CPF }).expect(409)
    })
  })
})
