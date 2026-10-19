import { dbGet, dbAll, dbRun } from '../config/db.js';

export async function getAllJobs(req, res) {
  try {
    const jobs = await dbAll('SELECT * FROM Jobs ORDER BY job_id DESC');
    res.json({ jobs });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching jobs', error: error.message });
  }
}

export async function createJob(req, res) {
  try {
    const { company_id, title, description, cgpa_required, max_backlogs, department, required_skills, deadline, salary, type } = req.body;

    if (!title || !deadline) {
      return res.status(400).json({ message: 'Job title and deadline are required' });
    }

    let companyName = 'Partner Recruiter';
    if (company_id) {
      const comp = await dbGet('SELECT company_name FROM Companies WHERE company_id = ?', [company_id]);
      if (comp) companyName = comp.company_name;
    }

    const result = await dbRun(
      `INSERT INTO Jobs (company_id, company_name, title, description, cgpa_required, max_backlogs, department, required_skills, deadline, salary, type, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        company_id || 1,
        companyName,
        title,
        description || '',
        cgpa_required || 6.5,
        max_backlogs || 0,
        department || 'CSE, ECE',
        required_skills || 'Java, Python, SQL',
        deadline,
        salary || '$10,000 / yr',
        type || 'Full-Time',
        'Active'
      ]
    );

    const created = await dbGet('SELECT * FROM Jobs WHERE job_id = ?', [result.lastID]);
    res.status(201).json({ message: 'Job created successfully', job: created });
  } catch (error) {
    res.status(500).json({ message: 'Error creating job', error: error.message });
  }
}

// Step 6: Automated Eligibility Checker Engine
export async function checkEligibility(req, res) {
  try {
    const { cgpa, backlogs, department, skills } = req.query;

    const studentCgpa = parseFloat(cgpa) || 0.0;
    const studentBacklogs = parseInt(backlogs) || 0;
    const studentDept = (department || 'CSE').toUpperCase();
    const studentSkills = (skills || '').toLowerCase().split(',').map(s => s.trim());

    const jobs = await dbAll('SELECT * FROM Jobs WHERE status = "Active"');

    const evaluatedJobs = jobs.map((job) => {
      const reasons = [];

      if (studentCgpa < job.cgpa_required) {
        reasons.push(`CGPA (${studentCgpa}) is below required minimum (${job.cgpa_required})`);
      }

      if (studentBacklogs > job.max_backlogs) {
        reasons.push(`Active backlogs (${studentBacklogs}) exceed maximum allowed (${job.max_backlogs})`);
      }

      const allowedDepts = job.department.toUpperCase().split(',').map(d => d.trim());
      if (!allowedDepts.includes(studentDept) && !allowedDepts.includes('ALL')) {
        reasons.push(`Department ${studentDept} is not eligible (Allowed: ${job.department})`);
      }

      if (job.required_skills) {
        const requiredList = job.required_skills.toLowerCase().split(',').map(s => s.trim());
        const hasSkillMatch = requiredList.some(req => studentSkills.includes(req));
        if (!hasSkillMatch && requiredList.length > 0) {
          reasons.push(`Missing key required skill from: ${job.required_skills}`);
        }
      }

      const isEligible = reasons.length === 0;

      return {
        ...job,
        isEligible,
        reasons
      };
    });

    res.json({
      studentMetrics: { cgpa: studentCgpa, backlogs: studentBacklogs, department: studentDept },
      evaluatedJobs
    });
  } catch (error) {
    res.status(500).json({ message: 'Error running eligibility checker', error: error.message });
  }
}
