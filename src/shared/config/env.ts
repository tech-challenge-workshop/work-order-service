import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.url(),
  RABBITMQ_URL: z.url(),
  RABBITMQ_QUEUE: z.string().min(1).default('work_order_queue'),
  JWT_SECRET: z.string().min(1),
  EXECUTION_SERVICE_URL: z.url().default('http://localhost:3002'),
})

export type Env = z.infer<typeof envSchema>

export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config)
  if (!result.success) {
    throw new Error(`Invalid environment variables:\n${z.prettifyError(result.error)}`)
  }
  return result.data
}
