import { dbGet, dbAll, dbRun } from '../config/db.js';
import path from 'path';

export async function getStudentProfile(req, res) {
  try {
    const student = await dbGet(
      `SELECT s.*, u.name, u.email FROM Students s JOIN Users u ON s.user_id = u.id WHERE s.user_id = ?`,
      [req.user.id]
    );

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    res.json({ student });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
}

export async function updateStudentProfile(req, res) {
  try {
    const { department, dept_code, cgpa, backlogs, phone, skills } = req.body;

    await dbRun(
      `UPDATE Students 
       SET department = ?, dept_code = ?, cgpa = ?, backlogs = ?, phone = ?, skills = ?
       WHERE user_id = ?`,
      [department, dept_code, cgpa, backlogs, phone, skills, req.user.id]
    );

    const updated = await dbGet('SELECT * FROM Students WHERE user_id = ?', [req.user.id]);
    res.json({ message: 'Profile updated successfully', student: updated });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
}

export async function uploadResumeFile(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded or invalid file format' });
    }

    const resumePath = `/uploads/resumes/${req.file.filename}`;

    await dbRun(
      `UPDATE Students SET resume_path = ? WHERE user_id = ?`,
      [resumePath, req.user.id]
    );

    res.json({
      message: 'Resume uploaded successfully',
      resumeUrl: resumePath,
      filename: req.file.filename
    });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading resume', error: error.message });
  }
}

export async function getAllStudents(req, res) {
  try {
    const students = await dbAll(
      `SELECT s.*, u.name, u.email FROM Students s JOIN Users u ON s.user_id = u.id`
    );
    res.json({ students });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching students list', error: error.message });
  }
}
