import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common'
import type { Response } from 'express'
import {
  CustomerNotFoundError,
  DocumentAlreadyInUseError,
  InvalidCustomerError,
  InvalidDocumentError,
} from '../../domain/errors/customer.errors'

@Catch(InvalidCustomerError, InvalidDocumentError, CustomerNotFoundError, DocumentAlreadyInUseError)
export class CustomerExceptionFilter implements ExceptionFilter {
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
    if (exception instanceof CustomerNotFoundError) {
      return HttpStatus.NOT_FOUND
    }
    if (exception instanceof DocumentAlreadyInUseError) {
      return HttpStatus.CONFLICT
    }
    return HttpStatus.BAD_REQUEST
  }
}
