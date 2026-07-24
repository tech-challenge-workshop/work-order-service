import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import { App } from 'supertest/types'
import { JwtService } from '@nestjs/jwt'
import { AppModule } from '../../src/app.module'
import { PrismaService } from '../../src/shared/database/prisma.service'

const VALID_CPF = '390.533.447-05'
const MISSING_UUID = '00000000-0000-4000-8000-000000000000'

describe('Vehicles (e2e)', () => {
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

  async function createCustomer(): Promise<string> {
    const response = await http()
      .post('/customers')
      .send({ name: 'John Doe', document: VALID_CPF })
      .expect(201)
    return (response.body as { id: string }).id
  }

  async function createVehicle(
    customerId: string,
    payload: Record<string, unknown> = {},
  ): Promise<string> {
    const response = await http()
      .post('/vehicles')
      .send({
        customerId,
        plate: 'ABC1D23',
        brand: 'Toyota',
        model: 'Corolla',
        year: 2024,
        ...payload,
      })
      .expect(201)
    return (response.body as { id: string }).id
  }

  describe('POST /vehicles', () => {
    it('creates a vehicle with the normalized plate', async () => {
      const customerId = await createCustomer()

      const response = await http()
        .post('/vehicles')
        .send({ customerId, plate: 'abc-1234', brand: 'Toyota', model: 'Corolla', year: 2024 })
        .expect(201)

      expect(response.body).toMatchObject({
        customerId,
        plate: 'ABC1234',
        brand: 'Toyota',
        model: 'Corolla',
        year: 2024,
      })
    })

    it('returns 404 when the owner does not exist', async () => {
      await http()
        .post('/vehicles')
        .send({
          customerId: MISSING_UUID,
          plate: 'ABC1234',
          brand: 'Toyota',
          model: 'Corolla',
          year: 2024,
        })
        .expect(404)
    })

    it('returns 409 for a duplicated plate', async () => {
      const customerId = await createCustomer()
      await createVehicle(customerId)

      await http()
        .post('/vehicles')
        .send({ customerId, plate: 'abc1d23', brand: 'Honda', model: 'Civic', year: 2023 })
        .expect(409)
    })

    it('returns 400 for an invalid plate', async () => {
      const customerId = await createCustomer()

      await http()
        .post('/vehicles')
        .send({ customerId, plate: 'INVALID99', brand: 'Toyota', model: 'Corolla', year: 2024 })
        .expect(400)
    })
  })

  describe('GET /vehicles/:id', () => {
    it('returns the vehicle', async () => {
      const customerId = await createCustomer()
      const id = await createVehicle(customerId)

      const response = await http().get(`/vehicles/${id}`).expect(200)

      expect(response.body).toMatchObject({ id, plate: 'ABC1D23' })
    })

    it('returns 404 for an unknown id', async () => {
      await http().get(`/vehicles/${MISSING_UUID}`).expect(404)
    })
  })

  describe('GET /vehicles', () => {
    it('filters by owner', async () => {
      const firstOwner = await createCustomer()
      await createVehicle(firstOwner)

      const response = await http().get('/vehicles').query({ customerId: firstOwner }).expect(200)

      expect(response.body).toMatchObject({ total: 1 })
    })

    it('excludes soft-deleted vehicles', async () => {
      const customerId = await createCustomer()
      const id = await createVehicle(customerId)
      await http().delete(`/vehicles/${id}`).expect(204)

      const response = await http().get('/vehicles').expect(200)

      expect(response.body).toMatchObject({ total: 0 })
    })
  })

  describe('PATCH /vehicles/:id', () => {
    it('updates brand, model and year', async () => {
      const customerId = await createCustomer()
      const id = await createVehicle(customerId)

      const response = await http()
        .patch(`/vehicles/${id}`)
        .send({ brand: 'Honda', model: 'Civic', year: 2023 })
        .expect(200)

      expect(response.body).toMatchObject({ id, brand: 'Honda', model: 'Civic', year: 2023 })
    })

    it('rejects plate changes', async () => {
      const customerId = await createCustomer()
      const id = await createVehicle(customerId)

      await http().patch(`/vehicles/${id}`).send({ plate: 'XYZ9Z99' }).expect(400)
    })
  })

  describe('DELETE /vehicles/:id', () => {
    it('soft-deletes and keeps the plate reserved', async () => {
      const customerId = await createCustomer()
      const id = await createVehicle(customerId)

      await http().delete(`/vehicles/${id}`).expect(204)
      await http().get(`/vehicles/${id}`).expect(404)

      await http()
        .post('/vehicles')
        .send({ customerId, plate: 'ABC1D23', brand: 'Honda', model: 'Civic', year: 2023 })
        .expect(409)
    })
  })
})
