import sqlite3 from 'sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../placement_portal.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

// Promisified database helpers
export const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

export async function initDatabase() {
  // Table 1: Users
  await dbRun(`
    CREATE TABLE IF NOT EXISTS Users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL, -- 'student', 'company', 'admin'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Table 2: Students
  await dbRun(`
    CREATE TABLE IF NOT EXISTS Students (
      student_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      register_no TEXT,
      department TEXT NOT NULL,
      dept_code TEXT NOT NULL,
      cgpa REAL NOT NULL DEFAULT 0.0,
      backlogs INTEGER NOT NULL DEFAULT 0,
      phone TEXT,
      skills TEXT, -- comma-separated
      resume_path TEXT,
      photo TEXT,
      FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
    )
  `);

  // Table 3: Companies
  await dbRun(`
    CREATE TABLE IF NOT EXISTS Companies (
      company_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE,
      company_name TEXT NOT NULL,
      logo TEXT,
      package TEXT NOT NULL,
      raw_package INTEGER DEFAULT 0,
      location TEXT,
      website TEXT,
      description TEXT,
      min_cgpa REAL DEFAULT 6.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Table 4: Jobs
  await dbRun(`
    CREATE TABLE IF NOT EXISTS Jobs (
      job_id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL,
      company_name TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      cgpa_required REAL NOT NULL DEFAULT 6.0,
      max_backlogs INTEGER NOT NULL DEFAULT 0,
      department TEXT NOT NULL, -- e.g. "CSE, ECE"
      required_skills TEXT,
      deadline TEXT NOT NULL,
      salary TEXT NOT NULL,
      type TEXT DEFAULT 'Full-Time',
      status TEXT DEFAULT 'Active', -- 'Active', 'Pending', 'Closed'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES Companies(company_id) ON DELETE CASCADE
    )
  `);

  // Table 5: Applications
  await dbRun(`
    CREATE TABLE IF NOT EXISTS Applications (
      application_id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      job_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'Applied', -- 'Applied', 'Shortlisted', 'Interview Scheduled', 'Rejected', 'Placed'
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE,
      FOREIGN KEY (job_id) REFERENCES Jobs(job_id) ON DELETE CASCADE
    )
  `);

  // Table 6: Interviews
  await dbRun(`
    CREATE TABLE IF NOT EXISTS Interviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      company_id INTEGER NOT NULL,
      job_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      venue TEXT NOT NULL,
      mode TEXT DEFAULT 'Offline', -- 'Online', 'Offline'
      interviewer TEXT,
      status TEXT DEFAULT 'Confirmed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Table 7: Notifications
  await dbRun(`
    CREATE TABLE IF NOT EXISTS Notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      message TEXT NOT NULL,
      unread INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Table 8: MetricSnapshots
  await dbRun(`
    CREATE TABLE IF NOT EXISTS MetricSnapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_version TEXT NOT NULL,
      measurement_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      total_loc INTEGER NOT NULL,
      frontend_loc INTEGER NOT NULL,
      backend_loc INTEGER NOT NULL,
      function_points REAL NOT NULL,
      unadjusted_fp INTEGER NOT NULL,
      vaf REAL NOT NULL,
      avg_cyclomatic_complexity REAL NOT NULL,
      max_cyclomatic_complexity INTEGER NOT NULL,
      estimated_person_months REAL NOT NULL,
      estimated_duration_months REAL NOT NULL,
      quality_gate_status TEXT DEFAULT 'PASSED',
      measured_by TEXT DEFAULT 'cloc + McCabe Analyzer',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Table 9: ModuleMetrics
  await dbRun(`
    CREATE TABLE IF NOT EXISTS ModuleMetrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      snapshot_id INTEGER,
      module_name TEXT NOT NULL,
      layer TEXT NOT NULL,
      language TEXT NOT NULL,
      loc INTEGER NOT NULL,
      sloc INTEGER NOT NULL,
      function_count INTEGER NOT NULL,
      avg_complexity REAL NOT NULL,
      max_complexity INTEGER NOT NULL,
      highest_risk_function TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (snapshot_id) REFERENCES MetricSnapshots(id) ON DELETE CASCADE
    )
  `);

  // Table 10: EffortEstimates
  await dbRun(`
    CREATE TABLE IF NOT EXISTS EffortEstimates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      snapshot_id INTEGER,
      model_version TEXT NOT NULL DEFAULT 'COCOMO II (Semi-Detached)',
      estimated_ksloc REAL NOT NULL,
      coefficient_a REAL DEFAULT 3.0,
      exponent_b REAL DEFAULT 1.12,
      effort_adjustment_factor REAL DEFAULT 1.04,
      person_months REAL NOT NULL,
      estimated_duration_months REAL NOT NULL,
      average_team_size REAL NOT NULL,
      assumptions TEXT NOT NULL,
      phase_breakdown TEXT NOT NULL, -- JSON string
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (snapshot_id) REFERENCES MetricSnapshots(id) ON DELETE CASCADE
    )
  `);

  console.log('Database tables initialized successfully.');
  await seedInitialData();
  await seedMetricsData();
}

async function seedInitialData() {
  const userCount = await dbGet('SELECT COUNT(*) as count FROM Users');
  if (userCount.count > 0) return; // Data already seeded

  console.log('Seeding initial database records...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Seed Users
  const studentUser = await dbRun(
    'INSERT INTO Users (name, email, password, role) VALUES (?, ?, ?, ?)',
    ['Rahul Verma', 'rahul@college.edu', hashedPassword, 'student']
  );

  const companyUser = await dbRun(
    'INSERT INTO Users (name, email, password, role) VALUES (?, ?, ?, ?)',
    ['Infosys HR', 'hr@infosys.com', hashedPassword, 'company']
  );

  const adminUser = await dbRun(
    'INSERT INTO Users (name, email, password, role) VALUES (?, ?, ?, ?)',
    ['TPO Officer', 'tpo@college.edu', hashedPassword, 'admin']
  );

  // 2. Seed Student Profile
  await dbRun(
    `INSERT INTO Students (user_id, register_no, department, dept_code, cgpa, backlogs, phone, skills, resume_path) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      studentUser.lastID,
      'REG-2026-089',
      'Computer Science & Engineering',
      'CSE',
      8.8,
      0,
      '+91 98765 43210',
      'Java, Python, SQL, React, Communication, Git',
      '/uploads/resumes/default_resume.pdf'
    ]
  );

  // 3. Seed Companies
  const c1 = await dbRun(
    `INSERT INTO Companies (user_id, company_name, logo, package, raw_package, location, website, description, min_cgpa) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      companyUser.lastID,
      'Infosys',
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=120&h=120&fit=crop',
      '$9,000 / yr',
      9000,
      'Bangalore / Hybrid',
      'https://infosys.com',
      'Global leader in next-generation digital services and consulting.',
      7.0
    ]
  );

  const c2 = await dbRun(
    `INSERT INTO Companies (company_name, logo, package, raw_package, location, website, description, min_cgpa) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'TCS',
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=120&h=120&fit=crop',
      '$7,500 / yr',
      7500,
      'Pune / On-site',
      'https://tcs.com',
      'IT services, consulting and business solutions organization.',
      6.5
    ]
  );

  const c3 = await dbRun(
    `INSERT INTO Companies (company_name, logo, package, raw_package, location, website, description, min_cgpa) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'Zoho',
      'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=120&h=120&fit=crop',
      '$12,000 / yr',
      12000,
      'Chennai / Hybrid',
      'https://zoho.com',
      'Unique and powerful suite of software to run your entire business.',
      7.5
    ]
  );

  const c4 = await dbRun(
    `INSERT INTO Companies (company_name, logo, package, raw_package, location, website, description, min_cgpa) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'Amazon',
      'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=120&h=120&fit=crop',
      '$24,000 / yr',
      24000,
      'Bengaluru / On-site',
      'https://amazon.jobs',
      'Multinational technology company focusing on e-commerce & cloud.',
      8.5
    ]
  );

  // 4. Seed Jobs
  const j1 = await dbRun(
    `INSERT INTO Jobs (company_id, company_name, title, description, cgpa_required, max_backlogs, department, required_skills, deadline, salary, type, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      c1.lastID,
      'Infosys',
      'System Engineer',
      'Design, build and maintain enterprise application software.',
      7.0,
      0,
      'CSE, ECE, EEE, MECH',
      'Java, SQL, Communication',
      '2026-08-18',
      '$9,000 / yr',
      'Full-Time',
      'Active'
    ]
  );

  const j2 = await dbRun(
    `INSERT INTO Jobs (company_id, company_name, title, description, cgpa_required, max_backlogs, department, required_skills, deadline, salary, type, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      c4.lastID,
      'Amazon',
      'SDE Graduate',
      'Build large scale distributed systems and web applications.',
      8.5,
      0,
      'CSE',
      'Java, Python, AWS, Data Structures',
      '2026-08-30',
      '$24,000 / yr',
      'Full-Time',
      'Active'
    ]
  );

  // 5. Seed Initial Application & Interview
  await dbRun(
    `INSERT INTO Applications (student_id, job_id, status) VALUES (?, ?, ?)`,
    [1, j1.lastID, 'Shortlisted']
  );

  await dbRun(
    `INSERT INTO Interviews (student_id, company_id, job_id, date, time, venue, mode, interviewer, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [1, c1.lastID, j1.lastID, '12 Aug 2026', '10:00 AM', 'Lab 4, Block B', 'Offline', 'Mr. Anand Sharma', 'Confirmed']
  );

  console.log('Database seeding complete.');
}

async function seedMetricsData() {
  const count = await dbGet('SELECT COUNT(*) as count FROM MetricSnapshots');
  if (count && count.count > 0) return;

  console.log('Seeding Software Engineering Metrics tables...');

  // 1. Insert snapshot
  const snap = await dbRun(
    `INSERT INTO MetricSnapshots (
      project_version, total_loc, frontend_loc, backend_loc,
      function_points, unadjusted_fp, vaf, avg_cyclomatic_complexity,
      max_cyclomatic_complexity, estimated_person_months, estimated_duration_months,
      quality_gate_status, measured_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'v2.0.0 (Production Build)',
      11583,
      7832,
      3751,
      193.64,
      188,
      1.03,
      6.8,
      16,
      48.8,
      9.75,
      'PASSED',
      'cloc + McCabe Analyzer'
    ]
  );

  const snapshotId = snap.lastID;

  // 2. Insert Module Metrics
  const modules = [
    { name: 'Authentication & Security', layer: 'Shared (Front+Back)', lang: 'JavaScript / JSX', loc: 1250, sloc: 1080, fns: 24, avgCc: 4.5, maxCc: 9, riskFn: 'verifyTokenAndRole' },
    { name: 'Resume Processing & Skill Extraction', layer: 'Frontend / Shared', lang: 'JavaScript', loc: 1420, sloc: 1220, fns: 18, avgCc: 5.2, maxCc: 7, riskFn: 'extractSkillsFromText' },
    { name: 'Skill Assessment & Coding Engine', layer: 'Frontend', lang: 'JavaScript / JSX', loc: 2680, sloc: 2310, fns: 36, avgCc: 7.8, maxCc: 12, riskFn: 'simulateExecution' },
    { name: 'Matching & Eligibility Engine', layer: 'Frontend / Shared', lang: 'JavaScript', loc: 1840, sloc: 1590, fns: 22, avgCc: 9.4, maxCc: 16, riskFn: 'calculateMatchScore' },
    { name: 'Admin & Dashboard Portals', layer: 'Frontend', lang: 'JavaScript / JSX / CSS', loc: 4393, sloc: 3780, fns: 58, avgCc: 6.1, maxCc: 11, riskFn: 'loadOfficerData' }
  ];

  for (const m of modules) {
    await dbRun(
      `INSERT INTO ModuleMetrics (snapshot_id, module_name, layer, language, loc, sloc, function_count, avg_complexity, max_complexity, highest_risk_function)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [snapshotId, m.name, m.layer, m.lang, m.loc, m.sloc, m.fns, m.avgCc, m.maxCc, m.riskFn]
    );
  }

  // 3. Insert Effort Estimates
  const phases = [
    { phase: 'Requirements & User Stories', share_pct: 6, planned_pm: 2.9, actual_pm: 2.9, status: 'Completed' },
    { phase: 'Architecture & Database Design', share_pct: 8, planned_pm: 3.9, actual_pm: 3.9, status: 'Completed' },
    { phase: 'Authentication & RBAC Security', share_pct: 7, planned_pm: 3.4, actual_pm: 3.4, status: 'Completed' },
    { phase: 'Resume Parsing & OCR Engine', share_pct: 10, planned_pm: 4.9, actual_pm: 4.8, status: 'Completed' },
    { phase: 'MCQ Assessment & Test Pipeline', share_pct: 11, planned_pm: 5.4, actual_pm: 5.4, status: 'Completed' },
    { phase: 'Live Coding & Judge0 Sandbox', share_pct: 12, planned_pm: 5.9, actual_pm: 5.8, status: 'Completed' },
    { phase: 'AI Matching & Eligibility Engine', share_pct: 11, planned_pm: 5.4, actual_pm: 5.3, status: 'Completed' },
    { phase: 'Company HR & Drive Portal', share_pct: 9, planned_pm: 4.4, actual_pm: 4.3, status: 'Completed' },
    { phase: 'Placement Officer Dashboard', share_pct: 8, planned_pm: 3.9, actual_pm: 3.9, status: 'Completed' },
    { phase: 'Integration, E2E & Quality Gates', share_pct: 10, planned_pm: 4.9, actual_pm: 4.5, status: 'Completed' },
    { phase: 'CI/CD & Production Deployment', share_pct: 8, planned_pm: 3.9, actual_pm: 3.7, status: 'Completed' }
  ];

  await dbRun(
    `INSERT INTO EffortEstimates (
      snapshot_id, model_version, estimated_ksloc, coefficient_a, exponent_b,
      effort_adjustment_factor, person_months, estimated_duration_months, average_team_size,
      assumptions, phase_breakdown
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      snapshotId,
      'COCOMO II (Semi-Detached)',
      11.583,
      3.0,
      1.12,
      1.04,
      48.8,
      9.75,
      5.0,
      'Semi-detached mode: Experienced team with mixed familiarity with AI and Judge0 integrations. Moderate product complexity with high web reliability requirement.',
      JSON.stringify(phases)
    ]
  );

  console.log('Software Metrics tables seeded successfully.');
}

export default db;
