import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbGet, dbRun } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'placement_portal_secret_key_2026';

export async function register(req, res) {
  try {
    const { name, email, password, role, department, cgpa, companyName, pkg } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existingUser = await dbGet('SELECT * FROM Users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role || 'student';

    const userResult = await dbRun(
      'INSERT INTO Users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, userRole]
    );

    const userId = userResult.lastID;
    let studentId = null;
    let companyId = null;

    if (userRole === 'student') {
      const studentResult = await dbRun(
        `INSERT INTO Students (user_id, department, dept_code, cgpa, skills) VALUES (?, ?, ?, ?, ?)`,
        [userId, department || 'Computer Science & Engineering', 'CSE', cgpa || 8.0, 'Java, Python, SQL, React']
      );
      studentId = studentResult.lastID;
    } else if (userRole === 'company') {
      const companyResult = await dbRun(
        `INSERT INTO Companies (user_id, company_name, package, raw_package, location) VALUES (?, ?, ?, ?, ?)`,
        [userId, companyName || name, pkg || '$10,000 / yr', 10000, 'Hybrid']
      );
      companyId = companyResult.lastID;
    }

    const token = jwt.sign(
      { id: userId, email, role: userRole, studentId, companyId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: { id: userId, name, email, role: userRole, studentId, companyId }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error registering user', error: error.message });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await dbGet('SELECT * FROM Users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    let studentId = null;
    let companyId = null;

    if (user.role === 'student') {
      const stu = await dbGet('SELECT student_id FROM Students WHERE user_id = ?', [user.id]);
      if (stu) studentId = stu.student_id;
    } else if (user.role === 'company') {
      const comp = await dbGet('SELECT company_id FROM Companies WHERE user_id = ?', [user.id]);
      if (comp) companyId = comp.company_id;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, studentId, companyId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, studentId, companyId }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error logging in', error: error.message });
  }
}

export async function getMe(req, res) {
  try {
    const user = await dbGet('SELECT id, name, email, role, created_at FROM Users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ message: 'User not found' });

    let details = {};
    if (user.role === 'student') {
      details = await dbGet('SELECT * FROM Students WHERE user_id = ?', [user.id]) || {};
    } else if (user.role === 'company') {
      details = await dbGet('SELECT * FROM Companies WHERE user_id = ?', [user.id]) || {};
    }

    res.json({ user: { ...user, details } });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching user profile', error: error.message });
  }
}
