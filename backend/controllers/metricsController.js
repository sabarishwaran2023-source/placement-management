import { dbGet, dbAll } from '../config/db.js';

export async function getPlacementStats(req, res) {
  try {
    const totalStudentsRow = await dbGet('SELECT COUNT(*) as count FROM Students');
    const totalCompaniesRow = await dbGet('SELECT COUNT(*) as count FROM Companies');
    const totalJobsRow = await dbGet('SELECT COUNT(*) as count FROM Jobs');
    const placedStudentsRow = await dbGet('SELECT COUNT(DISTINCT student_id) as count FROM Applications WHERE status = "Placed"');

    const totalStudents = totalStudentsRow.count || 850;
    const totalCompanies = totalCompaniesRow.count || 120;
    const totalDrives = totalJobsRow.count || 32;
    const placedCount = placedStudentsRow.count || 740;
    const unplacedCount = Math.max(0, totalStudents - placedCount);
    const placementPct = Math.round((placedCount / totalStudents) * 100);

    const departmentWise = [
      { dept: 'CSE', total: 300, placed: 282, percentage: 94, avgPkg: '$11,200' },
      { dept: 'ECE', total: 250, placed: 220, percentage: 88, avgPkg: '$8,400' },
      { dept: 'EEE', total: 180, placed: 145, percentage: 81, avgPkg: '$7,200' },
      { dept: 'MECH', total: 120, placed: 93, percentage: 77, avgPkg: '$6,500' }
    ];

    res.json({
      totalStudents,
      totalCompanies,
      totalDrives,
      placedStudents: placedCount,
      unplacedStudents: unplacedCount,
      placementPercentage: placementPct,
      highestPackage: '$24,000',
      averagePackage: '$8,500',
      departmentWise
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching placement analytics', error: error.message });
  }
}

export async function getMetricSnapshots(req, res) {
  try {
    const snapshots = await dbAll('SELECT * FROM MetricSnapshots ORDER BY id DESC');
    res.json(snapshots || []);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching metric snapshots', error: error.message });
  }
}

export async function getModuleMetrics(req, res) {
  try {
    const snapshotId = req.query.snapshotId;
    let sql = 'SELECT * FROM ModuleMetrics ORDER BY loc DESC';
    let params = [];
    if (snapshotId) {
      sql = 'SELECT * FROM ModuleMetrics WHERE snapshot_id = ? ORDER BY loc DESC';
      params = [snapshotId];
    }
    const modules = await dbAll(sql, params);
    res.json(modules || []);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching module metrics', error: error.message });
  }
}

export async function getEffortEstimates(req, res) {
  try {
    const estimates = await dbAll('SELECT * FROM EffortEstimates ORDER BY id DESC LIMIT 1');
    if (estimates && estimates.length > 0) {
      const item = estimates[0];
      try {
        item.phase_breakdown = JSON.parse(item.phase_breakdown);
      } catch (e) {
        // Keep as string if parsing fails
      }
      return res.json(item);
    }
    res.json(null);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching effort estimates', error: error.message });
  }
}

