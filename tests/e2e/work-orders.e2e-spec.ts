import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from '../../src/app.module'
import { PrismaService } from '../../src/shared/database/prisma.service'

const MISSING_UUID = '00000000-0000-4000-8000-000000000000'

describe('WorkOrders (e2e)', () => {
  let app: INestApplication<App>
  let prisma: PrismaService

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
  })

  beforeEach(async () => {
    await prisma.workOrder.deleteMany()
    await prisma.vehicle.deleteMany()
    await prisma.customer.deleteMany()
    await prisma.repairService.deleteMany()
  })

  afterAll(async () => {
    await prisma.workOrder.deleteMany()
    await prisma.vehicle.deleteMany()
    await prisma.customer.deleteMany()
    await prisma.repairService.deleteMany()
    await app.close()
  })

  const http = () => request(app.getHttpServer())

  async function createCustomer(document = '390.533.447-05'): Promise<string> {
    const res = await http().post('/customers').send({ name: 'John Doe', document }).expect(201)
    return (res.body as { id: string }).id
  }

  async function createVehicle(customerId: string, plate = 'ABC1D23'): Promise<string> {
    const res = await http()
      .post('/vehicles')
      .send({ customerId, plate, brand: 'Toyota', model: 'Corolla', year: 2024 })
      .expect(201)
    return (res.body as { id: string }).id
  }

  async function createService(priceCents = 15000): Promise<string> {
    const res = await http()
      .post('/repair-services')
      .send({ name: 'Oil change', priceCents })
      .expect(201)
    return (res.body as { id: string }).id
  }

  describe('POST /work-orders', () => {
    it('opens a work order in RECEIVED status with the item snapshot', async () => {
      const customerId = await createCustomer()
      const vehicleId = await createVehicle(customerId)
      const serviceId = await createService(15000)

      const res = await http()
        .post('/work-orders')
        .send({ customerId, vehicleId, serviceIds: [serviceId] })
        .expect(201)

      expect(res.body).toMatchObject({
        customerId,
        vehicleId,
        status: 'RECEIVED',
        totalCents: 15000,
      })
      const body = res.body as { items: unknown[]; history: unknown[] }
      expect(body.items).toHaveLength(1)
      expect(body.history).toHaveLength(1)
    })

    it('returns 404 when the customer does not exist', async () => {
      await http()
        .post('/work-orders')
        .send({ customerId: MISSING_UUID, vehicleId: MISSING_UUID, serviceIds: [] })
        .expect(404)
    })

    it('returns 404 when the vehicle does not exist', async () => {
      const customerId = await createCustomer()

      await http()
        .post('/work-orders')
        .send({ customerId, vehicleId: MISSING_UUID, serviceIds: [] })
        .expect(404)
    })

    it('returns 400 when the vehicle belongs to another customer', async () => {
      const ownerId = await createCustomer('390.533.447-05')
      const vehicleId = await createVehicle(ownerId, 'ABC1D23')
      const otherId = await createCustomer('11.222.333/0001-81')

      await http()
        .post('/work-orders')
        .send({ customerId: otherId, vehicleId, serviceIds: [] })
        .expect(400)
    })

    it('returns 404 when a repair service does not exist', async () => {
      const customerId = await createCustomer()
      const vehicleId = await createVehicle(customerId)

      await http()
        .post('/work-orders')
        .send({ customerId, vehicleId, serviceIds: [MISSING_UUID] })
        .expect(404)
    })

    it('returns 400 when no items are provided', async () => {
      const customerId = await createCustomer()
      const vehicleId = await createVehicle(customerId)

      await http().post('/work-orders').send({ customerId, vehicleId, serviceIds: [] }).expect(400)
    })
  })

  describe('GET /work-orders/:id', () => {
    it('returns the work order with items and history', async () => {
      const customerId = await createCustomer()
      const vehicleId = await createVehicle(customerId)
      const serviceId = await createService()
      const created = await http()
        .post('/work-orders')
        .send({ customerId, vehicleId, serviceIds: [serviceId] })
        .expect(201)
      const id = (created.body as { id: string }).id

      const res = await http().get(`/work-orders/${id}`).expect(200)

      expect(res.body).toMatchObject({ id, status: 'RECEIVED' })
    })

    it('returns 404 for an unknown id', async () => {
      await http().get(`/work-orders/${MISSING_UUID}`).expect(404)
    })
  })

  describe('GET /work-orders', () => {
    async function openWorkOrderAt(
      customerId: string,
      vehicleId: string,
      serviceId: string,
      status: string,
    ): Promise<void> {
      const created = await http()
        .post('/work-orders')
        .send({ customerId, vehicleId, serviceIds: [serviceId] })
        .expect(201)
      const id = (created.body as { id: string }).id
      if (status !== 'RECEIVED') {
        await prisma.workOrder.update({ where: { id }, data: { status: status as 'RECEIVED' } })
      }
    }

    it('orders active work orders by status priority and hides terminal ones', async () => {
      const customerId = await createCustomer()
      const vehicleId = await createVehicle(customerId)
      const serviceId = await createService()

      await openWorkOrderAt(customerId, vehicleId, serviceId, 'RECEIVED')
      await openWorkOrderAt(customerId, vehicleId, serviceId, 'IN_EXECUTION')
      await openWorkOrderAt(customerId, vehicleId, serviceId, 'IN_DIAGNOSIS')
      await openWorkOrderAt(customerId, vehicleId, serviceId, 'AWAITING_APPROVAL')
      await openWorkOrderAt(customerId, vehicleId, serviceId, 'DELIVERED')

      const res = await http().get('/work-orders').expect(200)

      expect(res.body).toMatchObject({ total: 4 })
      const items = (res.body as { items: { status: string }[] }).items
      expect(items.map((item) => item.status)).toEqual([
        'IN_EXECUTION',
        'AWAITING_APPROVAL',
        'IN_DIAGNOSIS',
        'RECEIVED',
      ])
    })

    it('filters by status', async () => {
      const customerId = await createCustomer()
      const vehicleId = await createVehicle(customerId)
      const serviceId = await createService()

      await openWorkOrderAt(customerId, vehicleId, serviceId, 'RECEIVED')
      await openWorkOrderAt(customerId, vehicleId, serviceId, 'IN_EXECUTION')

      const res = await http().get('/work-orders').query({ status: 'IN_EXECUTION' }).expect(200)

      expect(res.body).toMatchObject({ total: 1 })
    })
  })
})
