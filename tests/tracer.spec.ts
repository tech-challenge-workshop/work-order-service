describe('tracer', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('skips dd-trace initialization when NODE_ENV is test', () => {
    process.env.NODE_ENV = 'test'
    const init = jest.fn()
    jest.doMock('dd-trace', () => ({ init }))

    require('../src/tracer')

    expect(init).not.toHaveBeenCalled()
  })

  it('initializes dd-trace with env-provided values outside test', () => {
    process.env.NODE_ENV = 'production'
    process.env.DD_SERVICE = 'custom-service'
    process.env.DD_ENV = 'staging'
    process.env.DD_VERSION = '1.2.3'
    process.env.DD_AGENT_HOST = 'dd-agent-host'
    const init = jest.fn()
    jest.doMock('dd-trace', () => ({ init }))

    require('../src/tracer')

    expect(init).toHaveBeenCalledWith({
      service: 'custom-service',
      env: 'staging',
      version: '1.2.3',
      hostname: 'dd-agent-host',
      logInjection: true,
    })
  })

  it('falls back to defaults when DD_* env vars are unset', () => {
    process.env.NODE_ENV = 'production'
    delete process.env.DD_SERVICE
    delete process.env.DD_ENV
    delete process.env.DD_VERSION
    delete process.env.DD_AGENT_HOST
    const init = jest.fn()
    jest.doMock('dd-trace', () => ({ init }))

    require('../src/tracer')

    expect(init).toHaveBeenCalledWith({
      service: 'work-order-service',
      env: 'development',
      version: 'unknown',
      hostname: undefined,
      logInjection: true,
    })
  })
})
