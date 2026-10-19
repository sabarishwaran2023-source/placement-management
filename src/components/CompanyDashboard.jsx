import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  PlusCircle, 
  Users, 
  Calendar, 
  Download, 
  CheckCircle2, 
  XCircle, 
  Briefcase, 
  Search, 
  FileText, 
  ChevronRight,
  Filter,
  Check,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getOrCreateCompany, getCompanyJobs, createJob, updateJob } from '../services/jobService';
import { getJobApplications, updateApplicationStatus } from '../services/applicationService';
import { scheduleInterview } from '../services/interviewService';
import { createNotification } from '../services/notificationService';

export default function CompanyDashboard() {
  const { user, profile } = useAuth();

  const [activeTab, setActiveTab] = useState('openings'); // openings | postJob | applicants
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Job Form State
  const [newJob, setNewJob] = useState({
    title: '',
    description: '',
    location: 'Bangalore / Hybrid',
    salary: '8.5 - 12 LPA',
    job_type: 'Full-Time',
    min_cgpa: '7.0',
    max_backlogs: '0',
    deadline: '2026-09-30',
    skills: 'Java, Python, SQL, React'
  });

  // Schedule Interview Form Modal State
  const [schedulingAppId, setSchedulingAppId] = useState(null);
  const [interviewForm, setInterviewForm] = useState({
    round_name: 'Technical Round 1',
    interview_date: '2026-09-05',
    interview_time: '10:00',
    mode: 'Online',
    meeting_link: 'https://meet.google.com/abc-defg-hij',
    venue: 'Campus Hall A'
  });

  useEffect(() => {
    if (user?.id) {
      loadCompanyData();
    }
  }, [user]);

  const loadCompanyData = async () => {
    setLoading(true);
    try {
      // Get or create company record for HR user
      const compName = profile?.company_name || profile?.name || 'Partner Company';
      const activeId = user?.id || 'company-hr';
      const compData = await getOrCreateCompany(activeId, compName);
      setCompany(compData);

      // Get jobs for this company
      const companyJobs = await getCompanyJobs(compData?.id || activeId);
      setJobs(companyJobs || []);

      if (companyJobs && companyJobs.length > 0) {
        setSelectedJobId(companyJobs[0].id);
        const apps = await getJobApplications(companyJobs[0].id);
        setApplicants(apps || []);
      }
    } catch (err) {
      console.warn('Notice loading company data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJobSelect = async (jobId) => {
    setSelectedJobId(jobId);
    try {
      const apps = await getJobApplications(jobId);
      setApplicants(apps || []);
    } catch (err) {
      console.warn('Error fetching applicants:', err);
    }
  };

  const handlePostJob = async (e) => {
    e.preventDefault();
    if (!newJob.title?.trim()) {
      alert('Please enter a Job Title.');
      return;
    }

    try {
      const targetCompanyId = company?.id || user?.id || 'comp-default';
      const compName = company?.name || profile?.company_name || profile?.name || 'Partner Company';
      const skillNames = (newJob.skills || '').split(',').map(s => s.trim()).filter(Boolean);

      const created = await createJob(
        targetCompanyId,
        {
          title: newJob.title.trim(),
          description: newJob.description || '',
          location: newJob.location || 'Bangalore / Hybrid',
          salary: newJob.salary || '8.5 - 12 LPA',
          job_type: newJob.job_type || 'Full-Time',
          min_cgpa: parseFloat(newJob.min_cgpa) || 6.0,
          max_backlogs: parseInt(newJob.max_backlogs) || 0,
          deadline: newJob.deadline || '2026-09-30',
          status: 'Active',
          company_name: compName
        },
        skillNames
      );

      // Update state and list
      setJobs(prev => [created, ...(prev || [])]);
      alert('🎉 Placement Drive Published Successfully!');

      // Reset form
      setNewJob({
        title: '',
        description: '',
        location: 'Bangalore / Hybrid',
        salary: '8.5 - 12 LPA',
        job_type: 'Full-Time',
        min_cgpa: '7.0',
        max_backlogs: '0',
        deadline: '2026-09-30',
        skills: 'Java, Python, SQL, React'
      });

      // Switch to Active Openings tab so user sees their new drive immediately
      setActiveTab('openings');
    } catch (err) {
      alert('Failed to post job: ' + err.message);
    }
  };

  const handleStatusChange = async (appId, newStatus) => {
    try {
      await updateApplicationStatus(appId, newStatus);
      setApplicants(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));

      // Send real-time notification to the student
      const app = applicants.find(a => a.id === appId);
      if (app?.student_id) {
        const statusMessages = {
          'Shortlisted': `🎉 Congratulations! You have been shortlisted by ${company?.name || 'a company'}.`,
          'Rejected': `Your application for ${company?.name || 'a company'} has been reviewed. Unfortunately, it was not selected this time.`,
          'Interview Scheduled': `📅 Your interview with ${company?.name || 'a company'} has been scheduled. Check your interview details.`,
          'Selected': `🏆 Offer Extended! ${company?.name || 'A company'} has selected you for the position!`,
        };
        const message = statusMessages[newStatus];
        if (message) {
          createNotification(app.student_id, 'application_update', `Application ${newStatus}`, message).catch(() => {});
        }
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleScheduleInterviewSubmit = async (e) => {
    e.preventDefault();
    if (!schedulingAppId) return;

    try {
      await scheduleInterview(schedulingAppId, interviewForm);
      setApplicants(prev => prev.map(a => a.id === schedulingAppId ? { ...a, status: 'Interview Scheduled' } : a));

      // Notify student about the scheduled interview
      const app = applicants.find(a => a.id === schedulingAppId);
      if (app?.student_id) {
        createNotification(
          app.student_id,
          'interview_scheduled',
          'Interview Scheduled',
          `📅 Interview Round: ${interviewForm.round_name} with ${company?.name || 'Company'} on ${interviewForm.interview_date} at ${interviewForm.interview_time}. ${interviewForm.mode === 'Online' ? 'Link: ' + interviewForm.meeting_link : 'Venue: ' + interviewForm.venue}`
        ).catch(() => {});
      }

      setSchedulingAppId(null);
      alert('✅ Interview scheduled & notification sent to candidate!');
    } catch (err) {
      alert('Error scheduling interview: ' + err.message);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Schedule Interview Modal */}
      {schedulingAppId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-white font-display">Schedule Interview Round</h3>
            <form onSubmit={handleScheduleInterviewSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Round Name</label>
                <input
                  type="text"
                  value={interviewForm.round_name}
                  onChange={(e) => setInterviewForm({ ...interviewForm, round_name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 block mb-1">Date</label>
                  <input
                    type="date"
                    value={interviewForm.interview_date}
                    onChange={(e) => setInterviewForm({ ...interviewForm, interview_date: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Time</label>
                  <input
                    type="time"
                    value={interviewForm.interview_time}
                    onChange={(e) => setInterviewForm({ ...interviewForm, interview_time: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Meeting Link / Venue</label>
                <input
                  type="text"
                  value={interviewForm.meeting_link}
                  onChange={(e) => setInterviewForm({ ...interviewForm, meeting_link: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSchedulingAppId(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-bold"
                >
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Company Welcome Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">
                  {company?.name || 'Company Dashboard'}
                </h1>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                  Verified HR Partner
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Recruiter Email: <strong>{profile?.email || user?.email}</strong> | Posted Drives: {jobs.length}
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('postJob')}
            className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" /> Post New Job Opening
          </button>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="flex items-center gap-2 mt-8 pt-6 border-t border-slate-800/80">
          {[
            { id: 'openings', label: 'Active Job Drives', icon: Briefcase },
            { id: 'postJob', label: 'Post New Drive', icon: PlusCircle },
            { id: 'applicants', label: 'Applicant Evaluation Matrix', icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: JOB OPENINGS */}
      {activeTab === 'openings' && (
        <div className="space-y-6">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
            <h3 className="text-xl font-display font-bold text-white">Company Recruitment Drives</h3>

            {jobs.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <Briefcase className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-slate-400 text-xs">No active job drives posted yet.</p>
                <button
                  onClick={() => setActiveTab('postJob')}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
                >
                  Post First Opening
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {jobs.map((j) => (
                  <div key={j.id} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <h4 className="text-base font-bold text-white font-display">{j.title}</h4>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                          {j.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{j.location} | {j.salary}</p>
                      
                      <div className="mt-3 pt-3 border-t border-slate-900 flex items-center justify-between text-xs text-slate-300">
                        <span>Min CGPA: <strong className="text-slate-200">{j.min_cgpa}</strong></span>
                        <span>Deadline: <strong className="text-amber-400">{j.deadline || 'Ongoing'}</strong></span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        handleJobSelect(j.id);
                        setActiveTab('applicants');
                      }}
                      className="w-full py-2.5 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 font-bold text-xs flex items-center justify-center gap-1.5"
                    >
                      View Applicants <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: POST NEW JOB */}
      {activeTab === 'postJob' && (
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6 max-w-3xl mx-auto">
          <div>
            <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
              <PlusCircle className="w-6 h-6 text-indigo-400" /> Post New Campus Placement Drive
            </h3>
            <p className="text-xs text-slate-400 mt-1">Specify job role details, skill prerequisites, and CGPA thresholds.</p>
          </div>

          <form onSubmit={handlePostJob} className="space-y-4 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Job Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Software Engineer - Backend (Java / Python)"
                value={newJob.title}
                onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Location</label>
                <input
                  type="text"
                  value={newJob.location}
                  onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Salary Package (LPA)</label>
                <input
                  type="text"
                  value={newJob.salary}
                  onChange={(e) => setNewJob({ ...newJob, salary: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Min CGPA (0.00 to 10.00)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  placeholder="e.g. 7.50"
                  value={newJob.min_cgpa}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || (parseFloat(val) >= 0 && parseFloat(val) <= 10)) {
                      setNewJob({ ...newJob, min_cgpa: val });
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Max Backlogs</label>
                <input
                  type="number"
                  value={newJob.max_backlogs}
                  onChange={(e) => setNewJob({ ...newJob, max_backlogs: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Application Deadline</label>
                <input
                  type="date"
                  value={newJob.deadline}
                  onChange={(e) => setNewJob({ ...newJob, deadline: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Required Skills (comma separated)</label>
              <input
                type="text"
                placeholder="Java, Python, SQL, React, Data Structures"
                value={newJob.skills}
                onChange={(e) => setNewJob({ ...newJob, skills: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Job Description</label>
              <textarea
                rows={4}
                placeholder="Enter job responsibilities, tech stack, and eligibility criteria..."
                value={newJob.description}
                onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition-all"
            >
              Publish Job Drive
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: APPLICANTS */}
      {activeTab === 'applicants' && (
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-display font-bold text-white">Candidate Evaluation Matrix</h3>
              <p className="text-xs text-slate-400">Shortlist applicants based on AI match score & skill ratings</p>
            </div>

            {/* Job Selector Dropdown */}
            {jobs.length > 0 && (
              <select
                value={selectedJobId || ''}
                onChange={(e) => handleJobSelect(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white"
              >
                {jobs.map(j => (
                  <option key={j.id} value={j.id}>{j.title}</option>
                ))}
              </select>
            )}
          </div>

          {applicants.length === 0 ? (
            <p className="text-slate-500 text-xs text-center py-10">No candidate applications submitted for this job yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Student Name</th>
                    <th className="p-3.5">Dept</th>
                    <th className="p-3.5">CGPA</th>
                    <th className="p-3.5">Match Score</th>
                    <th className="p-3.5">Current Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {applicants.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-900/40">
                      <td className="p-3.5 font-bold text-white">
                        {app.profiles?.name || 'Student'}
                        <span className="block text-[10px] text-slate-500 font-normal">{app.profiles?.email}</span>
                      </td>
                      <td className="p-3.5 text-slate-300">{app.profiles?.department || 'CSE'}</td>
                      <td className="p-3.5 font-semibold text-emerald-400">{app.profiles?.cgpa || '8.5'}</td>
                      <td className="p-3.5 font-bold text-blue-400">{app.match_score || 0}%</td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          app.status === 'Accepted' || app.status === 'Shortlisted' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          app.status === 'Interview Scheduled' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                          app.status === 'Rejected' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                          'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {app.status || 'Under Review'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1.5">
                        <button
                          onClick={() => handleStatusChange(app.id, 'Accepted')}
                          className="px-3 py-1 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/30 text-emerald-400 text-[11px] font-bold border border-emerald-500/30 transition-all"
                        >
                          ✓ Accept
                        </button>
                        <button
                          onClick={() => setSchedulingAppId(app.id)}
                          className="px-3 py-1 rounded-lg bg-purple-600/15 hover:bg-purple-600/30 text-purple-400 text-[11px] font-bold border border-purple-500/30 transition-all"
                        >
                          Schedule
                        </button>
                        <button
                          onClick={() => handleStatusChange(app.id, 'Rejected')}
                          className="px-3 py-1 rounded-lg bg-rose-600/15 hover:bg-rose-600/30 text-rose-400 text-[11px] font-bold border border-rose-500/30 transition-all"
                        >
                          ✕ Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
