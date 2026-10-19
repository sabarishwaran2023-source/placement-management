export const INITIAL_STUDENT_PROFILE = {
  id: "STU-2026-089",
  name: "Rahul Verma",
  email: "rahul.verma@college.edu",
  phone: "+91 98765 43210",
  department: "Computer Science & Engineering",
  deptCode: "CSE",
  cgpa: 8.8,
  backlogs: 0,
  graduationYear: 2026,
  profileCompletion: 90,
  resumeScore: 82,
  skills: ["Java", "Python", "SQL", "React", "Communication", "Git"],
  missingSkills: ["AWS", "Docker", "Kubernetes"],
  resumeUrl: "#",
  appliedCompaniesCount: 4,
  interviewsCount: 2
};

export const VISITING_COMPANIES = [
  {
    id: "COMP-001",
    name: "Infosys",
    logo: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=120&h=120&fit=crop",
    role: "System Engineer",
    package: "$9,000 / yr",
    rawPackage: 9000,
    visitDate: "18 Aug 2026",
    minCgpa: 7.0,
    maxBacklogs: 0,
    allowedDepts: ["CSE", "ECE", "EEE", "MECH"],
    requiredSkills: ["Java", "SQL", "Communication"],
    location: "Bangalore / Hybrid",
    status: "Shortlisted",
    appliedDate: "02 Aug 2026"
  },
  {
    id: "COMP-002",
    name: "TCS",
    logo: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=120&h=120&fit=crop",
    role: "Ninja Software Developer",
    package: "$7,500 / yr",
    rawPackage: 7500,
    visitDate: "12 Aug 2026",
    minCgpa: 6.5,
    maxBacklogs: 1,
    allowedDepts: ["CSE", "ECE", "EEE", "MECH"],
    requiredSkills: ["C++", "Java", "Python"],
    location: "Pune / On-site",
    status: "Rejected",
    appliedDate: "28 Jul 2026"
  },
  {
    id: "COMP-003",
    name: "Zoho",
    logo: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=120&h=120&fit=crop",
    role: "Software Development Engineer (SDE-1)",
    package: "$12,000 / yr",
    rawPackage: 12000,
    visitDate: "22 Aug 2026",
    minCgpa: 7.5,
    maxBacklogs: 0,
    allowedDepts: ["CSE", "ECE"],
    requiredSkills: ["Java", "Data Structures", "SQL"],
    location: "Chennai / Hybrid",
    status: "Under Review",
    appliedDate: "05 Aug 2026"
  },
  {
    id: "COMP-004",
    name: "Accenture",
    logo: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=120&h=120&fit=crop",
    role: "Application Development Associate",
    package: "$8,500 / yr",
    rawPackage: 8500,
    visitDate: "25 Aug 2026",
    minCgpa: 6.8,
    maxBacklogs: 0,
    allowedDepts: ["CSE", "ECE", "EEE"],
    requiredSkills: ["Cloud", "SQL", "React"],
    location: "Hyderabad",
    status: "Eligible",
    appliedDate: null
  },
  {
    id: "COMP-005",
    name: "Amazon",
    logo: "https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=120&h=120&fit=crop",
    role: "SDE Full-Time (Graduate)",
    package: "$24,000 / yr",
    rawPackage: 24000,
    visitDate: "30 Aug 2026",
    minCgpa: 8.5,
    maxBacklogs: 0,
    allowedDepts: ["CSE"],
    requiredSkills: ["Java", "Python", "AWS", "Data Structures"],
    location: "Bengaluru / On-site",
    status: "Interview Scheduled",
    appliedDate: "01 Aug 2026"
  }
];

export const INITIAL_JOB_OPENINGS = [
  {
    id: "JOB-101",
    title: "Software Engineer",
    company: "Infosys",
    applicants: 142,
    openings: 25,
    deadline: "10 Aug 2026",
    type: "Full-Time",
    status: "Active"
  },
  {
    id: "JOB-102",
    title: "Data Analyst",
    company: "Zoho",
    applicants: 89,
    openings: 10,
    deadline: "15 Aug 2026",
    type: "Full-Time",
    status: "Active"
  },
  {
    id: "JOB-103",
    title: "Cloud Engineer",
    company: "Accenture",
    applicants: 64,
    openings: 15,
    deadline: "20 Aug 2026",
    type: "Full-Time",
    status: "Pending Approval"
  },
  {
    id: "JOB-104",
    title: "SDE-1 Frontend",
    company: "Amazon",
    applicants: 210,
    openings: 8,
    deadline: "22 Aug 2026",
    type: "Full-Time",
    status: "Active"
  }
];

export const INTERVIEW_SCHEDULE = [
  {
    id: "INT-1",
    company: "Infosys",
    role: "System Engineer",
    date: "12 Aug 2026",
    time: "10:00 AM",
    venue: "Lab 4, Block B",
    interviewer: "Mr. Anand Sharma (Senior HR)",
    status: "Confirmed"
  },
  {
    id: "INT-2",
    company: "Amazon",
    role: "SDE-1 Graduate",
    date: "15 Aug 2026",
    time: "02:00 PM",
    venue: "Auditorium Hall 2",
    interviewer: "Ms. Priya Nair (Tech Lead)",
    status: "Scheduled"
  }
];

export const PLACEMENT_OFFICER_METRICS = {
  totalStudents: 850,
  totalCompanies: 120,
  totalDrives: 32,
  placementPercentage: 87,
  placedStudents: 740,
  unplacedStudents: 110,
  highestPackage: "$24,000",
  averagePackage: "$8,500",
  departmentWise: [
    { dept: "CSE", total: 300, placed: 282, percentage: 94, avgPkg: "$11,200" },
    { dept: "ECE", total: 250, placed: 220, percentage: 88, avgPkg: "$8,400" },
    { dept: "EEE", total: 180, placed: 145, percentage: 81, avgPkg: "$7,200" },
    { dept: "MECH", total: 120, placed: 93, percentage: 77, avgPkg: "$6,500" }
  ]
};

export const NOTIFICATIONS = [
  { id: 1, text: "Interview scheduled with Infosys tomorrow at 10:00 AM in Lab 4", time: "2 hours ago", unread: true },
  { id: 2, text: "Resume updated successfully (Score: 82%)", time: "1 day ago", unread: false },
  { id: 3, text: "New company added: Amazon (SDE Graduate Role)", time: "2 days ago", unread: false },
  { id: 4, text: "Placement Officer approved Zoho job application portal", time: "3 days ago", unread: false }
];
