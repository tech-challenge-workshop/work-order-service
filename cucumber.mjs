// TypeScript is registered through NODE_OPTIONS="--import tsx" in the test:bdd
// script: the `loader` option maps to --loader, deprecated since Node 20.6.
export default {
  paths: ['tests/bdd/features/**/*.feature'],
  import: ['tests/bdd/steps/**/*.ts'],
  format: ['progress-bar', 'summary'],
  formatOptions: { snippetInterface: 'async-await' },
  strict: true,
}
