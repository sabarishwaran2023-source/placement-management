
import { jest } from '@jest/globals';

const mockDbGet = jest.fn();
const mockDbAll = jest.fn();

jest.unstable_mockModule('../config/db.js', () => ({
  dbGet: mockDbGet,
  dbAll: mockDbAll,
  dbRun: jest.fn(),
  initDatabase: jest.fn(),
  default: {}
}));

const {
  getPlacementStats,
  getMetricSnapshots,
  getModuleMetrics,
  getEffortEstimates
} = await import('../controllers/metricsController.js');

function createResponse() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };
}

describe('Metrics Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPlacementStats', () => {
    test('returns placement statistics from database counts', async () => {
      mockDbGet
        .mockResolvedValueOnce({ count: 100 })
        .mockResolvedValueOnce({ count: 20 })
        .mockResolvedValueOnce({ count: 15 })
        .mockResolvedValueOnce({ count: 70 });

      const req = {};
      const res = createResponse();

      await getPlacementStats(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.totalStudents).toBe(100);
      expect(res.body.totalCompanies).toBe(20);
      expect(res.body.totalDrives).toBe(15);
      expect(res.body.placedStudents).toBe(70);
      expect(res.body.unplacedStudents).toBe(30);
      expect(res.body.placementPercentage).toBe(70);
      expect(res.body.departmentWise).toHaveLength(4);
      expect(mockDbGet).toHaveBeenCalledTimes(4);
    });

    test('returns HTTP 500 if database query fails', async () => {
      mockDbGet.mockRejectedValueOnce(new Error('Database unavailable'));

      const res = createResponse();

      await getPlacementStats({}, res);

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe('Error fetching placement analytics');
      expect(res.body.error).toBe('Database unavailable');
    });
  });

  describe('getMetricSnapshots', () => {
    test('returns metric snapshots', async () => {
      const snapshots = [{ id: 1, project_version: 'v1.0' }];
      mockDbAll.mockResolvedValueOnce(snapshots);

      const res = createResponse();

      await getMetricSnapshots({}, res);

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(snapshots);
      expect(mockDbAll).toHaveBeenCalledWith(
        'SELECT * FROM MetricSnapshots ORDER BY id DESC'
      );
    });

    test('returns an empty array if the query result is null', async () => {
      mockDbAll.mockResolvedValueOnce(null);

      const res = createResponse();

      await getMetricSnapshots({}, res);

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([]);
    });

    test('returns HTTP 500 if database query fails', async () => {
      mockDbAll.mockRejectedValueOnce(new Error('Snapshot query failed'));

      const res = createResponse();

      await getMetricSnapshots({}, res);

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe('Error fetching metric snapshots');
    });
  });

  describe('getModuleMetrics', () => {
    test('returns all module metrics when snapshotId is absent', async () => {
      const modules = [{ module_name: 'Authentication', loc: 1200 }];
      mockDbAll.mockResolvedValueOnce(modules);

      const res = createResponse();

      await getModuleMetrics({ query: {} }, res);

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(modules);
      expect(mockDbAll).toHaveBeenCalledWith(
        'SELECT * FROM ModuleMetrics ORDER BY loc DESC',
        []
      );
    });

    test('filters module metrics by snapshotId when provided', async () => {
      const modules = [{ snapshot_id: '5', module_name: 'Dashboard' }];
      mockDbAll.mockResolvedValueOnce(modules);

      const res = createResponse();

      await getModuleMetrics({ query: { snapshotId: '5' } }, res);

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(modules);
      expect(mockDbAll).toHaveBeenCalledWith(
        'SELECT * FROM ModuleMetrics WHERE snapshot_id = ? ORDER BY loc DESC',
        ['5']
      );
    });

    test('returns HTTP 500 if database query fails', async () => {
      mockDbAll.mockRejectedValueOnce(new Error('Module query failed'));

      const res = createResponse();

      await getModuleMetrics({ query: {} }, res);

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe('Error fetching module metrics');
    });
  });

  describe('getEffortEstimates', () => {
    test('returns the latest estimate and parses phase_breakdown JSON', async () => {
      const estimate = {
        id: 3,
        model_version: 'COCOMO II',
        phase_breakdown: JSON.stringify([
          { phase: 'Testing', planned_pm: 2 }
        ])
      };

      mockDbAll.mockResolvedValueOnce([estimate]);

      const res = createResponse();

      await getEffortEstimates({}, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe(3);
      expect(res.body.phase_breakdown).toEqual([
        { phase: 'Testing', planned_pm: 2 }
      ]);
      expect(mockDbAll).toHaveBeenCalledWith(
        'SELECT * FROM EffortEstimates ORDER BY id DESC LIMIT 1'
      );
    });

    test('keeps phase_breakdown as a string when JSON is invalid', async () => {
      const estimate = {
        id: 4,
        phase_breakdown: 'not valid JSON'
      };

      mockDbAll.mockResolvedValueOnce([estimate]);

      const res = createResponse();

      await getEffortEstimates({}, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.phase_breakdown).toBe('not valid JSON');
    });

    test('returns null when no effort estimate exists', async () => {
      mockDbAll.mockResolvedValueOnce([]);

      const res = createResponse();

      await getEffortEstimates({}, res);

      expect(res.statusCode).toBe(200);
      expect(res.body).toBeNull();
    });

    test('returns HTTP 500 if database query fails', async () => {
      mockDbAll.mockRejectedValueOnce(new Error('Effort query failed'));

      const res = createResponse();

      await getEffortEstimates({}, res);

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe('Error fetching effort estimates');
    });
  });
});
