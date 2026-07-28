const mockActiveSpan = { context: jest.fn() }
const mockScope = { active: jest.fn(() => mockActiveSpan as unknown) }

jest.mock('dd-trace', () => ({
  default: {
    scope: () => mockScope,
  },
}))

import { DatadogLoggerService } from '../../../src/shared/observability/datadog-logger.service'

describe('DatadogLoggerService', () => {
  let logger: DatadogLoggerService
  let lastWritten: string

  beforeEach(() => {
    logger = new DatadogLoggerService()
    lastWritten = ''
    jest.spyOn(process.stdout, 'write').mockImplementation((chunk: string | Uint8Array) => {
      lastWritten = chunk.toString()
      return true
    })
    mockScope.active.mockReturnValue(mockActiveSpan)
    mockActiveSpan.context.mockReturnValue({
      toTraceId: () => 'trace-123',
      toSpanId: () => 'span-456',
    })
    delete process.env.DD_SERVICE
    delete process.env.DD_ENV
    delete process.env.DD_VERSION
  })

  afterEach(() => {
    jest.restoreAllMocks()
    jest.clearAllMocks()
  })

  function lastEntry(): Record<string, unknown> {
    return JSON.parse(lastWritten.trim()) as Record<string, unknown>
  }

  it('logs a plain string message via log()', () => {
    logger.log('hello world', 'TestContext')
    const entry = lastEntry()
    expect(entry.level).toBe('info')
    expect(entry.message).toBe('hello world')
    expect(entry.context).toBe('TestContext')
    expect(entry['dd.trace_id']).toBe('trace-123')
    expect(entry['dd.span_id']).toBe('span-456')
  })

  it('extracts the event field from a structured object message', () => {
    logger.error({ event: 'saga.compensate', extra: 'data' }, undefined, 'ErrorContext')
    const entry = lastEntry()
    expect(entry.level).toBe('error')
    expect(entry.message).toBe('saga.compensate')
    expect(entry.extra).toBe('data')
  })

  it('preserves the stack trace when error() receives one', () => {
    logger.error('boom', 'Error: boom\n    at foo (/x.ts:1:1)', 'CtxError')
    const entry = lastEntry()
    expect(entry.level).toBe('error')
    expect(entry.stack).toBe('Error: boom\n    at foo (/x.ts:1:1)')
  })

  it('omits the stack field when error() does not receive a trace', () => {
    logger.error('boom')
    const entry = lastEntry()
    expect(entry).not.toHaveProperty('stack')
  })

  it('stringifies an object message without a string event field', () => {
    logger.warn({ foo: 'bar' })
    const entry = lastEntry()
    expect(entry.level).toBe('warn')
    expect(entry.message).toBe(JSON.stringify({ foo: 'bar' }))
  })

  it('stringifies non-string, non-object messages', () => {
    logger.debug(42)
    const entry = lastEntry()
    expect(entry.message).toBe('42')
  })

  it('treats null as a non-object message', () => {
    logger.verbose(null)
    const entry = lastEntry()
    expect(entry.message).toBe('null')
  })

  it('falls back to empty trace/span ids when there is no active span', () => {
    mockScope.active.mockReturnValue(undefined)
    logger.log('no span')
    const entry = lastEntry()
    expect(entry['dd.trace_id']).toBe('')
    expect(entry['dd.span_id']).toBe('')
  })

  it('uses DD_SERVICE/DD_ENV/DD_VERSION env vars when set', () => {
    process.env.DD_SERVICE = 'custom-service'
    process.env.DD_ENV = 'staging'
    process.env.DD_VERSION = '2.0.0'
    logger.log('with env')
    const entry = lastEntry()
    expect(entry.service).toBe('custom-service')
    expect(entry['dd.service']).toBe('custom-service')
    expect(entry['dd.env']).toBe('staging')
    expect(entry['dd.version']).toBe('2.0.0')
  })

  it('falls back to defaults when DD_SERVICE/DD_ENV/DD_VERSION are unset', () => {
    logger.log('defaults')
    const entry = lastEntry()
    expect(entry.service).toBe('work-order-service')
    expect(entry['dd.env']).toBe('development')
    expect(entry['dd.version']).toBe('unknown')
  })
})
