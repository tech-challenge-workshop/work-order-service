import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common'
import type { Response } from 'express'
import { CustomerNotFoundError } from '../../../customers/domain/errors/customer.errors'
import {
  InvalidPlateError,
  InvalidVehicleError,
  PlateAlreadyInUseError,
  VehicleNotFoundError,
} from '../../domain/errors/vehicle.errors'

@Catch(
  InvalidPlateError,
  InvalidVehicleError,
  VehicleNotFoundError,
  PlateAlreadyInUseError,
  CustomerNotFoundError,
)
export class VehicleExceptionFilter implements ExceptionFilter {
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
    if (exception instanceof VehicleNotFoundError || exception instanceof CustomerNotFoundError) {
      return HttpStatus.NOT_FOUND
    }
    if (exception instanceof PlateAlreadyInUseError) {
      return HttpStatus.CONFLICT
    }
    return HttpStatus.BAD_REQUEST
  }
}
