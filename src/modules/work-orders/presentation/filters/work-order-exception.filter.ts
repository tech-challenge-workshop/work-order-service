import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common'
import type { Response } from 'express'
import { CustomerNotFoundError } from '../../../customers/domain/errors/customer.errors'
import { VehicleNotFoundError } from '../../../vehicles/domain/errors/vehicle.errors'
import { RepairServiceNotFoundError } from '../../../catalog/domain/errors/repair-service.errors'
import {
  InvalidWorkOrderError,
  InvalidWorkOrderTransitionError,
  PartNotFoundError,
  VehicleDoesNotBelongToCustomerError,
  WorkOrderNotFoundError,
} from '../../domain/errors/work-order.errors'

@Catch(
  InvalidWorkOrderError,
  InvalidWorkOrderTransitionError,
  PartNotFoundError,
  VehicleDoesNotBelongToCustomerError,
  WorkOrderNotFoundError,
  CustomerNotFoundError,
  VehicleNotFoundError,
  RepairServiceNotFoundError,
)
export class WorkOrderExceptionFilter implements ExceptionFilter {
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
    if (
      exception instanceof WorkOrderNotFoundError ||
      exception instanceof CustomerNotFoundError ||
      exception instanceof VehicleNotFoundError ||
      exception instanceof RepairServiceNotFoundError ||
      exception instanceof PartNotFoundError
    ) {
      return HttpStatus.NOT_FOUND
    }
    if (exception instanceof InvalidWorkOrderTransitionError) {
      return HttpStatus.CONFLICT
    }
    return HttpStatus.BAD_REQUEST
  }
}
