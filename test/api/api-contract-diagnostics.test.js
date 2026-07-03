const test = require('node:test');
const assert = require('node:assert/strict');
const {
  compareApiContract,
  sanitize,
  sanitizeUrl
} = require('../../cypress/support/api/api-contract-diagnostics');

/** Verifies permission drift produces actionable, secret-safe evidence. */
test('third-party contract reports permission status and correlation ID', () => {
  const result = compareApiContract({
    name: 'Entitlements API',
    method: 'GET',
    url: 'https://service.example.com/permissions',
    response: {
      status: 403,
      duration: 120,
      headers: { 'x-correlation-id': 'trace-123' },
      body: { error: 'permission denied' }
    },
    contract: {
      expectedStatus: 200,
      requiredBodyProperties: ['permissions.read']
    }
  });

  assert.equal(result.passed, false);
  assert.match(result.summary, /received 403/);
  assert.equal(result.diagnostic.actual.correlation['x-correlation-id'], 'trace-123');
});

/** Verifies tokens in query strings cannot reach report attachments. */
test('API diagnostics redact sensitive URL query parameters', () => {
  assert.equal(
    sanitizeUrl('https://service.example.com/check?api_key=secret&region=us'),
    'https://service.example.com/check?api_key=%5Bredacted%5D&region=us'
  );
});

/** Verifies reporter evidence never includes common secret fields. */
test('API diagnostics redact nested tokens and authorization values', () => {
  assert.deepEqual(sanitize({ authorization: 'secret', nested: { apiToken: 'secret' } }), {
    authorization: '[redacted]',
    nested: { apiToken: '[redacted]' }
  });
});
