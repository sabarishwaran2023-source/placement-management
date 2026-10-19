import express from 'express';
import { 
  getPlacementStats, 
  getMetricSnapshots, 
  getModuleMetrics, 
  getEffortEstimates 
} from '../controllers/metricsController.js';

const router = express.Router();

router.get('/placement-stats', getPlacementStats);
router.get('/snapshots', getMetricSnapshots);
router.get('/modules', getModuleMetrics);
router.get('/effort', getEffortEstimates);

export default router;

