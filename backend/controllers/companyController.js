import { dbGet, dbAll, dbRun } from '../config/db.js';

export async function getAllCompanies(req, res) {
  try {
    const companies = await dbAll('SELECT * FROM Companies ORDER BY company_id DESC');
    res.json({ companies });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching companies', error: error.message });
  }
}

export async function createCompany(req, res) {
  try {
    const { company_name, package: pkg, raw_package, location, website, description, min_cgpa, logo } = req.body;

    if (!company_name || !pkg) {
      return res.status(400).json({ message: 'Company name and package are required' });
    }

    const result = await dbRun(
      `INSERT INTO Companies (company_name, logo, package, raw_package, location, website, description, min_cgpa)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [company_name, logo || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=120&h=120&fit=crop', pkg, raw_package || 10000, location || 'Hybrid', website || '#', description || '', min_cgpa || 6.5]
    );

    const created = await dbGet('SELECT * FROM Companies WHERE company_id = ?', [result.lastID]);
    res.status(201).json({ message: 'Company added successfully', company: created });
  } catch (error) {
    res.status(500).json({ message: 'Error adding company', error: error.message });
  }
}

export async function updateCompany(req, res) {
  try {
    const { id } = req.params;
    const { company_name, package: pkg, location, website, description, min_cgpa } = req.body;

    await dbRun(
      `UPDATE Companies 
       SET company_name = ?, package = ?, location = ?, website = ?, description = ?, min_cgpa = ?
       WHERE company_id = ?`,
      [company_name, pkg, location, website, description, min_cgpa, id]
    );

    res.json({ message: 'Company updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating company', error: error.message });
  }
}

export async function deleteCompany(req, res) {
  try {
    const { id } = req.params;
    await dbRun('DELETE FROM Companies WHERE company_id = ?', [id]);
    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting company', error: error.message });
  }
}
