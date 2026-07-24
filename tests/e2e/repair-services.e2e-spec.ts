import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import { App } from 'supertest/types'
import { JwtService } from '@nestjs/jwt'
import { AppModule } from '../../src/app.module'
import { PrismaService } from '../../src/shared/database/prisma.service'

const MISSING_UUID = '00000000-0000-4000-8000-000000000000'

describe('RepairServices (e2e)', () => {
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
    await prisma.repairService.deleteMany()
  })

  afterAll(async () => {
    await prisma.repairService.deleteMany()
    await app.close()
  })

  async function createRepairService(payload: Record<string, unknown> = {}): Promise<string> {
    const response = await http()
      .post('/repair-services')
      .send({ name: 'Oil change', priceCents: 15000, ...payload })
      .expect(201)
    return (response.body as { id: string }).id
  }

  describe('POST /repair-services', () => {
    it('creates a repair service', async () => {
      const response = await http()
        .post('/repair-services')
        .send({ name: 'Oil change', description: 'Full synthetic', priceCents: 15000 })
        .expect(201)

      expect(response.body).toMatchObject({
        name: 'Oil change',
        description: 'Full synthetic',
        priceCents: 15000,
      })
      expect(response.body).toHaveProperty('id')
    })

    it('returns 400 for a negative price', async () => {
      await http().post('/repair-services').send({ name: 'Oil change', priceCents: -1 }).expect(400)
    })

    it('returns 400 for unknown body fields', async () => {
      await http()
        .post('/repair-services')
        .send({ name: 'Oil change', priceCents: 15000, discount: 10 })
        .expect(400)
    })
  })

  describe('GET /repair-services/:id', () => {
    it('returns the repair service', async () => {
      const id = await createRepairService()

      const response = await http().get(`/repair-services/${id}`).expect(200)

      expect(response.body).toMatchObject({ id, name: 'Oil change', priceCents: 15000 })
    })

    it('returns 404 for an unknown id', async () => {
      await http().get(`/repair-services/${MISSING_UUID}`).expect(404)
    })
  })

  describe('GET /repair-services', () => {
    it('lists services ordered by name with search', async () => {
      await createRepairService({ name: 'Oil change' })
      await createRepairService({ name: 'Alignment' })

      const all = await http().get('/repair-services').expect(200)
      expect(all.body).toMatchObject({ total: 2 })
      const items = (all.body as { items: { name: string }[] }).items
      expect(items.map((item) => item.name)).toEqual(['Alignment', 'Oil change'])

      const filtered = await http().get('/repair-services').query({ search: 'align' }).expect(200)
      expect(filtered.body).toMatchObject({ total: 1 })
    })

    it('excludes soft-deleted services', async () => {
      const id = await createRepairService()
      await http().delete(`/repair-services/${id}`).expect(204)

      const response = await http().get('/repair-services').expect(200)

      expect(response.body).toMatchObject({ total: 0 })
    })
  })

  describe('PATCH /repair-services/:id', () => {
    it('updates name and price', async () => {
      const id = await createRepairService()

      const response = await http()
        .patch(`/repair-services/${id}`)
        .send({ name: 'Wheel alignment', priceCents: 8000 })
        .expect(200)

      expect(response.body).toMatchObject({ id, name: 'Wheel alignment', priceCents: 8000 })
    })

    it('clears the description when null is provided', async () => {
      const id = await createRepairService({ description: 'Full synthetic' })

      const response = await http()
        .patch(`/repair-services/${id}`)
        .send({ description: null })
        .expect(200)

      expect((response.body as { description: string | null }).description).toBeNull()
    })

    it('returns 404 for an unknown id', async () => {
      await http().patch(`/repair-services/${MISSING_UUID}`).send({ name: 'Alignment' }).expect(404)
    })
  })

  describe('DELETE /repair-services/:id', () => {
    it('soft-deletes and the service stops being readable', async () => {
      const id = await createRepairService()

      await http().delete(`/repair-services/${id}`).expect(204)
      await http().get(`/repair-services/${id}`).expect(404)
    })

    it('returns 404 when already deleted', async () => {
      const id = await createRepairService()
      await http().delete(`/repair-services/${id}`).expect(204)

      await http().delete(`/repair-services/${id}`).expect(404)
    })
  })
})
