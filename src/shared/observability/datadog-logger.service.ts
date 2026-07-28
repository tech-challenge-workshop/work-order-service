import { LoggerService } from '@nestjs/common'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const ddTrace = require('dd-trace') as { default: typeof import('dd-trace') }

export class DatadogLoggerService implements LoggerService {
  private write(level: string, message: unknown, context?: string, stack?: string): void {
    const tracer = ddTrace.default
    const span = tracer.scope().active()
    const structuredMessage =
      typeof message === 'object' && message !== null
        ? (message as Record<string, unknown>)
        : undefined
    const normalizedMessage =
      typeof message === 'string'
        ? message
        : typeof structuredMessage?.event === 'string'
          ? structuredMessage.event
          : JSON.stringify(message)
    const entry = {
      ...(structuredMessage ?? {}),
      level,
      message: normalizedMessage,
      context,
      ...(stack ? { stack } : {}),
      service: process.env.DD_SERVICE ?? 'work-order-service',
      'dd.trace_id': span?.context().toTraceId() ?? '',
      'dd.span_id': span?.context().toSpanId() ?? '',
      'dd.service': process.env.DD_SERVICE ?? 'work-order-service',
      'dd.env': process.env.DD_ENV ?? 'development',
      'dd.version': process.env.DD_VERSION ?? 'unknown',
      timestamp: new Date().toISOString(),
    }
    process.stdout.write(JSON.stringify(entry) + '\n')
  }

  log(message: unknown, context?: string): void {
    this.write('info', message, context)
  }

  error(message: unknown, trace?: string, context?: string): void {
    this.write('error', message, context, trace)
  }

  warn(message: unknown, context?: string): void {
    this.write('warn', message, context)
  }

  debug(message: unknown, context?: string): void {
    this.write('debug', message, context)
  }

  verbose(message: unknown, context?: string): void {
    this.write('verbose', message, context)
  }
}
