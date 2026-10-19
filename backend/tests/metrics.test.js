
import request from 'supertest';
import { jest } from '@jest/globals';

const mockGetPlacementStats = jest.fn((req, res) =>
  res.status(200).json({ test: 'placement-stats' })
);

const mockGetMetricSnapshots = jest.fn((req, res) =>
  res.status(200).json({ test: 'snapshots' })
);

const mockGetModuleMetrics = jest.fn((req, res) =>
  res.status(200).json({ test: 'modules' })
);

const mockGetEffortEstimates = jest.fn((req, res) =>
  res.status(200).json({ test: 'effort' })
);

// Prevent tests from using the real database module.
jest.unstable_mockModule('../config/db.js', () => ({
  initDatabase: jest.fn(),
  dbGet: jest.fn(),
  dbAll: jest.fn(),
  dbRun: jest.fn(),
  default: {}
}));

// Replace real metrics controllers with test handlers.
jest.unstable_mockModule('../controllers/metricsController.js', () => ({
  getPlacementStats: mockGetPlacementStats,
  getMetricSnapshots: mockGetMetricSnapshots,
  getModuleMetrics: mockGetModuleMetrics,
  getEffortEstimates: mockGetEffortEstimates
}));

// Import the app after registering the mocks.
const { default: app } = await import('../app.js');

describe('Software Metrics API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /api/metrics/placement-stats calls the correct handler', async () => {
    const response = await request(app)
      .get('/api/metrics/placement-stats');

    expect(response.status).toBe(200);
    expect(response.body.test).toBe('placement-stats');
    expect(mockGetPlacementStats).toHaveBeenCalledTimes(1);
  });

  test('GET /api/metrics/snapshots calls the correct handler', async () => {
    const response = await request(app)
      .get('/api/metrics/snapshots');

    expect(response.status).toBe(200);
    expect(response.body.test).toBe('snapshots');
    expect(mockGetMetricSnapshots).toHaveBeenCalledTimes(1);
  });

  test('GET /api/metrics/modules calls the correct handler', async () => {
    const response = await request(app)
      .get('/api/metrics/modules');

    expect(response.status).toBe(200);
    expect(response.body.test).toBe('modules');
    expect(mockGetModuleMetrics).toHaveBeenCalledTimes(1);
  });

  test('GET /api/metrics/effort calls the correct handler', async () => {
    const response = await request(app)
      .get('/api/metrics/effort');

    expect(response.status).toBe(200);
    expect(response.body.test).toBe('effort');
    expect(mockGetEffortEstimates).toHaveBeenCalledTimes(1);
  });
});
