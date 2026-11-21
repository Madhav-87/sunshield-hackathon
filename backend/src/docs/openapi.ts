import { z } from 'zod';
import { heatRequestSchema } from '../schemas/heat.schema.js';
import { simulationRequestSchema } from '../schemas/simulation.schema.js';
import { protectionRequestSchema, protectionPlanSchema } from '../schemas/protection.schema.js';
import { assessmentResponseSchema, apiErrorSchema, weatherResponseSchema } from '../schemas/shared.schema.js';
const json = (schema: z.ZodType) => ({ 'application/json': { schema: z.toJSONSchema(schema) } });
const errorResponse = { description: 'Standardized error; requestId matches X-Request-Id', content: json(apiErrorSchema) };
function post(summary: string, input: z.ZodType, output: z.ZodType) {
  return {
    summary,
    requestBody: { required: true, content: json(input) },
    responses: {
      '200': { description: 'Explainable prototype advisory', content: json(output) },
      ...Object.fromEntries(['400', '413', '415', '422', '429', '500', '503'].map(code => [code, errorResponse])),
    },
  };
}
export const openapi = {
  openapi: '3.1.0',
  info: { title: 'SunShield API', version: '1.0.0', description: 'Prototype occupational heat guidance. Not medically validated. Never permission to continue working.' },
  servers: [{ url: '/' }],
  paths: {
    '/api/v1/health': { get: { summary: 'Application availability (no database required)', responses: {
      '200': { description: 'Application available', content: json(z.object({ status: z.literal('UP'), application: z.literal('SunShield'), version: z.literal('1.0.0') })) },
    } } },
    '/api/v1/heat/assess': { post: post('Assess the profile using the injected live weather provider', heatRequestSchema, assessmentResponseSchema) },
    '/api/v1/protection/plan': { post: post('Build the current local workday timeline; same-day schedules only', protectionRequestSchema, protectionPlanSchema) },
    '/api/v1/simulation/evaluate': { post: post('Evaluate independent HeatLab scenario without fetching or persisting weather', simulationRequestSchema, assessmentResponseSchema) },
    '/api/v1/weather': { get: {
      summary: 'Normalized current and hourly Open-Meteo weather; cached reads retain original timestamps',
      parameters: [
        { name: 'latitude', in: 'query', required: true, schema: { type: 'number', minimum: -90, maximum: 90 } },
        { name: 'longitude', in: 'query', required: true, schema: { type: 'number', minimum: -180, maximum: 180 } },
      ],
      responses: { '200': { description: 'Weather observations and forecast, not a work-clearance advisory', content: json(weatherResponseSchema) },
        ...Object.fromEntries(['422', '429', '500', '503'].map(code => [code, errorResponse])) },
    } },
  },
};
