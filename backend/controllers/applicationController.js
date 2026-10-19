import { dbGet, dbAll, dbRun } from '../config/db.js';

export async function applyForJob(req, res) {
  try {
    const { job_id } = req.body;
    if (!job_id) {
      return res.status(400).json({ message: 'job_id is required' });
    }

    const student = await dbGet('SELECT student_id FROM Students WHERE user_id = ?', [req.user.id]);
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found. Please complete profile first.' });
    }

    const existing = await dbGet(
      'SELECT * FROM Applications WHERE student_id = ? AND job_id = ?',
      [student.student_id, job_id]
    );

    if (existing) {
      return res.status(400).json({ message: 'You have already applied for this job drive.' });
    }

    const result = await dbRun(
      'INSERT INTO Applications (student_id, job_id, status) VALUES (?, ?, ?)',
      [student.student_id, job_id, 'Applied']
    );

    // Create notification
    const job = await dbGet('SELECT title, company_name FROM Jobs WHERE job_id = ?', [job_id]);
    await dbRun(
      'INSERT INTO Notifications (user_id, message) VALUES (?, ?)',
      [req.user.id, `Application submitted successfully for ${job?.company_name || 'Company'} - ${job?.title || 'Drive'}`]
    );

    res.status(201).json({
      message: 'Applied for job successfully',
      applicationId: result.lastID
    });
  } catch (error) {
    res.status(500).json({ message: 'Error applying for job', error: error.message });
  }
}

export async function getStudentApplications(req, res) {
  try {
    const student = await dbGet('SELECT student_id FROM Students WHERE user_id = ?', [req.user.id]);
    if (!student) {
      return res.json({ applications: [] });
    }

    const applications = await dbAll(
      `SELECT a.*, j.title, j.company_name, j.salary, j.deadline
       FROM Applications a
       JOIN Jobs j ON a.job_id = j.job_id
       WHERE a.student_id = ?
       ORDER BY a.application_id DESC`,
      [student.student_id]
    );

    res.json({ applications });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching applications', error: error.message });
  }
}

export async function getAllApplications(req, res) {
  try {
    const applications = await dbAll(
      `SELECT a.*, j.title as job_title, j.company_name, u.name as student_name, u.email as student_email, s.department, s.cgpa, s.skills, s.resume_path
       FROM Applications a
       JOIN Jobs j ON a.job_id = j.job_id
       JOIN Students s ON a.student_id = s.student_id
       JOIN Users u ON s.user_id = u.id
       ORDER BY a.application_id DESC`
    );

    res.json({ applications });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching applications pipeline', error: error.message });
  }
}

export async function updateApplicationStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'Applied', 'Shortlisted', 'Interview Scheduled', 'Rejected', 'Placed'

    await dbRun(
      'UPDATE Applications SET status = ? WHERE application_id = ?',
      [status, id]
    );

    res.json({ message: `Application status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ message: 'Error updating application status', error: error.message });
  }
}
