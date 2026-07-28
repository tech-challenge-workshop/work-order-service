if (process.env.NODE_ENV !== 'test') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const tracer = require('dd-trace') as {
    init: (opts: Record<string, unknown>) => void
  }
  tracer.init({
    service: process.env.DD_SERVICE ?? 'work-order-service',
    env: process.env.DD_ENV ?? 'development',
    version: process.env.DD_VERSION ?? 'unknown',
    hostname: process.env.DD_AGENT_HOST,
    logInjection: true,
  })
}
