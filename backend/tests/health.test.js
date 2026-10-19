
import request from 'supertest';
import { jest } from '@jest/globals';

jest.unstable_mockModule('../config/db.js', () => ({
  initDatabase: jest.fn(),
  dbGet: jest.fn(),
  dbAll: jest.fn(),
  dbRun: jest.fn(),
  default: {}
}));

const { default: app } = await import('../app.js');

describe('Backend Health Check API', () => {
  test('GET /api/health should return status 200', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
  });

  test('GET /api/health should return OK status', async () => {
    const response = await request(app).get('/api/health');

    expect(response.body.status).toBe('OK');
  });

  test('GET /api/health should return the expected message', async () => {
    const response = await request(app).get('/api/health');

    expect(response.body.message).toBe(
      'Placement Portal Backend API is operational'
    );
  });
});
