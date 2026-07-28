import { Controller, Get } from '@nestjs/common'
import { Public } from '../auth/public.decorator'

export const APP_VERSION = '1.0.0'

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  check() {
    return { status: 'ok', service: 'work-order-service', version: APP_VERSION }
  }
}
