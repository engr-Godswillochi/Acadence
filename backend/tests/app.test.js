import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import express from 'express';
import request from 'supertest';

import app from '../src/app.js';
import { errorHandler } from '../src/middleware/error.middleware.js';
import { ApiError } from '../src/utils/apiError.js';

describe('Express application foundation', () => {
  it('reports that the API process is healthy', async () => {
    const response = await request(app).get('/api/health');

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.data.status, 'ok');
    assert.match(response.body.data.timestamp, /^\d{4}-\d{2}-\d{2}T/);
  });

  it('uses the shared response shape for unknown routes', async () => {
    const response = await request(app).get('/api/not-a-route');

    assert.equal(response.status, 404);
    assert.deepEqual(response.body, {
      success: false,
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: 'Cannot GET /api/not-a-route.',
      },
    });
  });

  it('returns a stable response for malformed JSON', async () => {
    const response = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{"broken":');

    assert.equal(response.status, 400);
    assert.equal(response.body.error.code, 'INVALID_JSON');
  });

  it('maps operational errors without leaking implementation details', async () => {
    const errorApp = express();
    errorApp.get('/failure', () => {
      throw new ApiError(409, 'FOUNDATION_CONFLICT', 'The foundation request conflicts.');
    });
    errorApp.use(errorHandler);

    const response = await request(errorApp).get('/failure');

    assert.equal(response.status, 409);
    assert.deepEqual(response.body, {
      success: false,
      error: {
        code: 'FOUNDATION_CONFLICT',
        message: 'The foundation request conflicts.',
      },
    });
  });
});
