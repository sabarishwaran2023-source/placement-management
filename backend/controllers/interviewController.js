import { dbGet, dbAll, dbRun } from '../config/db.js';

export async function getInterviews(req, res) {
  try {
    const interviews = await dbAll(
      `SELECT i.*, c.company_name, c.logo, j.title as role, u.name as student_name
       FROM Interviews i
       LEFT JOIN Companies c ON i.company_id = c.company_id
       LEFT JOIN Jobs j ON i.job_id = j.job_id
       LEFT JOIN Students s ON i.student_id = s.student_id
       LEFT JOIN Users u ON s.user_id = u.id
       ORDER BY i.id DESC`
    );
    res.json({ interviews });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching interviews', error: error.message });
  }
}

export async function scheduleInterview(req, res) {
  try {
    const { student_id, company_id, job_id, date, time, venue, mode, interviewer } = req.body;

    if (!student_id || !date || !time) {
      return res.status(400).json({ message: 'Student ID, date, and time are required' });
    }

    const result = await dbRun(
      `INSERT INTO Interviews (student_id, company_id, job_id, date, time, venue, mode, interviewer, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [student_id, company_id || 1, job_id || 1, date, time, venue || 'Lab 4', mode || 'Offline', interviewer || 'HR Panel', 'Confirmed']
    );

    // Update application status to 'Interview Scheduled'
    await dbRun(
      'UPDATE Applications SET status = "Interview Scheduled" WHERE student_id = ? AND job_id = ?',
      [student_id, job_id || 1]
    );

    res.status(201).json({
      message: 'Interview scheduled successfully',
      interviewId: result.lastID
    });
  } catch (error) {
    res.status(500).json({ message: 'Error scheduling interview', error: error.message });
  }
}
