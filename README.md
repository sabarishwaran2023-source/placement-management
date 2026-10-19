# Placement Management & Metrics Portal

A comprehensive Campus Placement Management System and Software Metrics Portal built with React, Node.js/Express, SQLite, and Supabase.

---

## 🚀 Features

- **Multi-Role Dashboards**: Student, Company/Recruiter, and Placement Officer.
- **Placement & Interview Workflow**: Job postings, resume uploads, application tracking, online tests, and interview scheduling.
- **Software Metrics & COCOMO II**: Real-time project metrics analysis, LOC, Halstead complexity, cyclomatic complexity, defect density, and COCOMO II effort estimation.
- **Automated Testing**: Jest and Supertest test suites covering authentication, metrics endpoints, and health checks with code coverage.
- **SonarQube Integration**: Static code analysis and quality gate scanning.

---

## 🛠️ Quick Start

### 1. Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### 2. Environment Configuration
Copy the sample environment variables:
```bash
# Root (Frontend)
cp .env.example .env

# Backend
cp backend/.env.example backend/.env
```

---

## 💻 Running Locally

### Backend (Terminal 1)
```bash
cd backend
npm install
npm start
```
* Backend runs at: `http://localhost:5000`
* Health Check: `http://localhost:5000/api/health`

### Frontend (Terminal 2)
```bash
npm install
npm run dev
```
* Frontend runs at: `http://localhost:5173`

---

## 🧪 Testing (Jest & Supertest)

Run backend unit and integration tests:
```bash
cd backend
npm test
```

Generate test coverage report:
```bash
npm run test:coverage
```

---

## 📊 Software Metrics & SonarQube

### Run Metrics Analysis Script
```bash
npm run metrics
```

### SonarQube Scanner
```bash
# Start SonarQube server (adjust path to your installation)
cd "C:\sonarqube\bin\windows-x86-64"
.\StartSonar.bat

# In the project root, run the scan
npx @sonar/scan
```