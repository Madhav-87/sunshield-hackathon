import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { apiErrorSchema, assessmentResponseSchema, weatherResponseSchema } from '../backend/dist/schemas/shared.schema.js';
import { protectionPlanSchema } from '../backend/dist/schemas/protection.schema.js';

const baseUrl = (process.env.SUNSHIELD_API_BASE_URL || 'http://localhost:8000/api/v1').replace(/\/+$/, '');
const results = [];
const heavy = JSON.parse(await readFile(new URL('../backend/examples/integration/heatlab-heavy.request.json', import.meta.url), 'utf8'));
const lower = JSON.parse(await readFile(new URL('../backend/examples/integration/heatlab-lower.request.json', import.meta.url), 'utf8'));

class BlockedError extends Error {}
class NotImplementedError extends Error {}

async function request(path, body) {
  let response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...(body === undefined
        ? { method: 'GET' }
        : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }),
      headers: body === undefined ? { accept: 'application/json' } : { accept: 'application/json', 'content-type': 'application/json' },
      signal: AbortSignal.timeout(12_000),
    });
  } catch (error) {
    throw new BlockedError(`Cannot reach ${baseUrl}: ${error.message}`);
  }
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`HTTP ${response.status} returned a non-JSON response`);
  }
  const requestId = response.headers.get('x-request-id');
  assert.ok(requestId, `HTTP ${response.status} is missing X-Request-Id`);
  return { response, data, requestId };
}

function validateError(result, status, code) {
  assert.equal(result.response.status, status);
  const parsed = apiErrorSchema.parse(result.data);
  assert.equal(parsed.error.code, code);
  assert.equal(parsed.error.requestId, result.requestId);
  return parsed.error;
}

async function check(name, action) {
  try {
    const detail = await action();
    results.push({ status: 'PASS', name, detail: detail || '' });
  } catch (error) {
    const status = error instanceof NotImplementedError ? 'NOT IMPLEMENTED' : error instanceof BlockedError ? 'BLOCKED' : 'FAIL';
    results.push({ status, name, detail: error.message });
  }
}

function assertSimulation(body, expectedLevel, expectedRecommendation) {
  const result = assessmentResponseSchema.parse(body);
  assert.equal(result.dataMode, 'SIMULATION');
  assert.equal(result.assessment.advisoryLevel, expectedLevel);
  assert.equal(result.assessment.medicalValidation, false);
  assert.equal(result.assessment.disclaimerCode, 'ESTIMATED_ADVISORY_ONLY');
  const indicator = result.assessment.environmentalIndicators;
  assert.equal(indicator.temperatureC, 35);
  assert.equal(indicator.humidityPercent, 50);
  assert.equal(indicator.windSpeedKmh, 5);
  assert.ok(Math.abs(indicator.heatIndexC - 40.68) < 0.01, `Expected heat index near 40.68 C, got ${indicator.heatIndexC}`);
  assert.equal(indicator.environmentalAdvisoryLevel, 'HIGH');
  const recommendation = result.assessment.recommendations.find(item => item.code === expectedRecommendation.code);
  assert.ok(recommendation, `Missing ${expectedRecommendation.code}`);
  assert.equal(recommendation.priority, expectedRecommendation.priority);
  for (const limitation of ['NOT_MEDICALLY_VALIDATED', 'NOT_PERMISSION_TO_CONTINUE_WORK', 'SIMULATED_CONDITIONS']) {
    assert.ok(result.assessment.limitations.includes(limitation), `Missing limitation ${limitation}`);
  }
  return result;
}

console.log(`Read-only SunShield release smoke checks against ${baseUrl}`);
console.log('POSTs are non-persistent simulations and read-only assessments/planning; no community write routes are called.');

await check('GET /health', async () => {
  const result = await request('/health');
  assert.equal(result.response.status, 200);
  assert.deepEqual(result.data, { status: 'UP', application: 'SunShield', version: '1.0.0' });
  return `HTTP 200; request ${result.requestId}`;
});

const simulations = [];
await check('POST /simulation/evaluate — construction CRITICAL', async () => {
  const result = await request('/simulation/evaluate', heavy);
  assert.equal(result.response.status, 200);
  simulations[0] = assertSimulation(result.data, 'CRITICAL', { code: 'STOP_UNSAFE_ACTIVITY', priority: 'CRITICAL' });
  return `HTTP 200; CRITICAL / STOP_UNSAFE_ACTIVITY; request ${result.requestId}`;
});

await check('POST /simulation/evaluate — vendor HIGH', async () => {
  const result = await request('/simulation/evaluate', lower);
  assert.equal(result.response.status, 200);
  simulations[1] = assertSimulation(result.data, 'HIGH', { code: 'REDUCE_STRENUOUS_ACTIVITY', priority: 'HIGH' });
  return `HTTP 200; HIGH / REDUCE_STRENUOUS_ACTIVITY; request ${result.requestId}`;
});

await check('HeatLab scenarios have identical environmental indicators', async () => {
  assert.ok(simulations[0] && simulations[1], 'Both real scenario requests must pass');
  assert.deepEqual(simulations[0].assessment.environmentalIndicators, simulations[1].assessment.environmentalIndicators);
  return 'Both use 35 C / 50% / 5 km/h; heat index 40.68 C';
});

await check('POST /simulation/evaluate rejects an invalid profile', async () => {
  const result = await request('/simulation/evaluate', { profile: {} });
  validateError(result, 422, 'VALIDATION_ERROR');
  return `HTTP 422; request ${result.requestId}`;
});

await check('GET /weather', async () => {
  const result = await request('/weather?latitude=18.5204&longitude=73.8567');
  if (result.response.status === 404) {
    validateError(result, 404, 'NOT_FOUND');
    throw new NotImplementedError('HTTP 404 NOT_FOUND');
  }
  if (result.response.status === 503 && ['WEATHER_PROVIDER_UNAVAILABLE', 'WEATHER_UNAVAILABLE'].includes(result.data?.error?.code)) {
    const error = validateError(result, 503, result.data.error.code);
    throw new BlockedError(`HTTP 503 ${error.code}`);
  }
  assert.equal(result.response.status, 200);
  weatherResponseSchema.parse(result.data);
  assert.ok(['LIVE', 'CACHED'].includes(result.data.dataMode));
  return `HTTP 200 ${result.data.dataMode}; request ${result.requestId}`;
});

await check('POST /heat/assess (live)', async () => {
  const result = await request('/heat/assess', { profile: heavy.profile });
  if (result.response.status === 404) {
    validateError(result, 404, 'NOT_FOUND');
    throw new NotImplementedError('HTTP 404 NOT_FOUND');
  }
  if (result.response.status === 503 && ['WEATHER_PROVIDER_UNAVAILABLE', 'WEATHER_UNAVAILABLE'].includes(result.data?.error?.code)) {
    const error = validateError(result, 503, result.data.error.code);
    throw new BlockedError(`HTTP 503 ${error.code}`);
  }
  assert.equal(result.response.status, 200);
  const response = assessmentResponseSchema.parse(result.data);
  assert.ok(['LIVE', 'CACHED'].includes(response.dataMode));
  return `HTTP 200 ${response.dataMode}; request ${result.requestId}`;
});

await check('POST /protection/plan', async () => {
  const result = await request('/protection/plan', { profile: heavy.profile });
  if (result.response.status === 404) {
    validateError(result, 404, 'NOT_FOUND');
    throw new NotImplementedError('HTTP 404 NOT_FOUND');
  }
  if (result.response.status === 503 && ['WEATHER_PROVIDER_UNAVAILABLE', 'WEATHER_UNAVAILABLE'].includes(result.data?.error?.code)) {
    const error = validateError(result, 503, result.data.error.code);
    throw new BlockedError(`HTTP 503 ${error.code}`);
  }
  assert.equal(result.response.status, 200);
  protectionPlanSchema.parse(result.data);
  return `HTTP 200; request ${result.requestId}`;
});

let firstSafeZone;
await check('GET /safe-zones', async () => {
  const result = await request('/safe-zones?latitude=18.5204&longitude=73.8567&radiusKm=5&includeDemo=false');
  if (result.response.status === 404) {
    validateError(result, 404, 'NOT_FOUND');
    throw new NotImplementedError('HTTP 404 NOT_FOUND; route is unmounted in the current core API');
  }
  if (result.response.status === 503) throw new BlockedError(`HTTP 503; Safe Zones service unavailable (${result.requestId})`);
  assert.equal(result.response.status, 200);
  assert.equal(result.data.distanceMethod, 'STRAIGHT_LINE');
  assert.ok(Array.isArray(result.data.facilities));
  firstSafeZone = result.data.facilities[0];
  return `HTTP 200; ${result.data.facilities.length} facilities; request ${result.requestId}`;
});

if (firstSafeZone?.id) {
  await check('GET /safe-zones/:id', async () => {
    const result = await request(`/safe-zones/${encodeURIComponent(firstSafeZone.id)}`);
    if (result.response.status === 404) {
      validateError(result, 404, 'NOT_FOUND');
      throw new NotImplementedError('HTTP 404 NOT_FOUND');
    }
    assert.equal(result.response.status, 200);
    assert.ok(result.data && typeof result.data === 'object');
    return `HTTP 200; request ${result.requestId}`;
  });
} else {
  results.push({ status: 'BLOCKED', name: 'GET /safe-zones/:id', detail: 'No id returned by the Safe Zones list endpoint' });
}

for (const result of results) console.log(`${result.status.padEnd(16)} ${result.name}${result.detail ? ` — ${result.detail}` : ''}`);
const failed = results.filter(result => result.status === 'FAIL').length;
const incomplete = results.filter(result => ['BLOCKED', 'NOT IMPLEMENTED'].includes(result.status)).length;
console.log(`${results.length - failed - incomplete} passed, ${failed} failed, ${incomplete} blocked/not implemented`);
if (failed) process.exitCode = 1;
else if (incomplete) process.exitCode = 2;
