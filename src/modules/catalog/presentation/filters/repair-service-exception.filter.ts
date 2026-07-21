import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common'
import type { Response } from 'express'
import {
  InvalidPriceError,
  InvalidRepairServiceError,
  RepairServiceNotFoundError,
} from '../../domain/errors/repair-service.errors'

@Catch(InvalidPriceError, InvalidRepairServiceError, RepairServiceNotFoundError)
export class RepairServiceExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>()
    const status = this.statusFor(exception)

    response.status(status).json({
      statusCode: status,
      error: exception.name,
      message: exception.message,
    })
  }

  private statusFor(exception: Error): number {
    if (exception instanceof RepairServiceNotFoundError) {
      return HttpStatus.NOT_FOUND
    }
    return HttpStatus.BAD_REQUEST
  }
}
