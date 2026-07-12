import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from '../../src/app.module'
import { PrismaService } from '../../src/shared/database/prisma.service'

const VALID_CPF = '390.533.447-05'

describe('Customers (e2e)', () => {
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
    await prisma.customer.deleteMany()
  })

  afterAll(async () => {
    await prisma.customer.deleteMany()
    await app.close()
  })

  describe('POST /customers', () => {
    it('creates a customer and returns 201 with the masked document', async () => {
      const response = await request(app.getHttpServer())
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
      await request(app.getHttpServer())
        .post('/customers')
        .send({ name: 'John Doe', document: VALID_CPF })
        .expect(201)

      await request(app.getHttpServer())
        .post('/customers')
        .send({ name: 'Jane Doe', document: '39053344705' })
        .expect(409)
    })

    it('returns 400 for an invalid document', async () => {
      await request(app.getHttpServer())
        .post('/customers')
        .send({ name: 'John Doe', document: '12345678900' })
        .expect(400)
    })

    it('returns 400 for unknown body fields', async () => {
      await request(app.getHttpServer())
        .post('/customers')
        .send({ name: 'John Doe', document: VALID_CPF, role: 'admin' })
        .expect(400)
    })
  })
})
