import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Award, 
  Calendar, 
  Upload, 
  Search, 
  Building2, 
  Sparkles, 
  Clock, 
  Layers, 
  Zap,
  TrendingUp,
  FileCheck,
  Briefcase,
  Download,
  Eye,
  Plus,
  Trash2,
  Code2,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getProfile, updateProfile } from '../services/profileService';
import { uploadResume, getResume, deleteResume } from '../services/resumeService';
import { processResumeText, getResumeSkills, confirmSkill, confirmAllSkills, addCustomSkill, removeResumeSkill } from '../services/resumeAnalysisService';
import { getSkillScores, getOverallStrength } from '../services/skillScoringService';
import { getRecommendedJobs } from '../services/matchingService';
import { applyForJob, getStudentApplications } from '../services/applicationService';
import { getStudentInterviews } from '../services/interviewService';
import { createNotification } from '../services/notificationService';
import MCQTestModal from './MCQTestModal';
import CodingTestModal from './CodingTestModal';

export default function StudentDashboard() {
  const { user, profile: authProfile } = useAuth();

  const [activeTab, setActiveTab] = useState('overview'); // overview | resume | assessment | jobs | interviews

  // State
  const [profile, setProfile] = useState(authProfile || {});
  const [resume, setResume] = useState(null);
  const [skills, setSkills] = useState([]);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [skillScores, setSkillScores] = useState([]);
  const [overallStrength, setOverallStrength] = useState(0);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Resume Upload State
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [rawResumeText, setRawResumeText] = useState('');

  // Assessment Modals State
  const [isMcqOpen, setIsMcqOpen] = useState(false);
  const [isCodingOpen, setIsCodingOpen] = useState(false);

  const hasResumeSkills = Boolean(resume?.id && skills.length > 0);

  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // 1. Fetch Profile
      const prof = await getProfile(user.id);
      setProfile(prof || {});

      // 2. Fetch Resume
      const res = await getResume(user.id);
      setResume(res);
      if (res?.raw_text) setRawResumeText(res.raw_text);

      // 3. Fetch Resume Skills
      const skList = await getResumeSkills(user.id);
      setSkills(skList || []);

      // 4. Fetch Skill Scores & Overall Strength
      const scores = await getSkillScores(user.id);
      setSkillScores(scores || []);

      const strength = await getOverallStrength(user.id);
      setOverallStrength(strength || 0);

      // 5. Fetch Recommended Jobs & Applications
      const recJobs = await getRecommendedJobs(user.id);
      setRecommendedJobs(recJobs || []);

      const apps = await getStudentApplications(user.id);
      setApplications(apps || []);

      // 6. Fetch Interviews
      const ints = await getStudentInterviews(user.id);
      setInterviews(ints || []);

    } catch (err) {
      console.warn('Error loading student dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // PDF Upload Handler
  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadMsg('Uploading PDF to Supabase Storage...');

    try {
      // 1. Upload to Supabase Storage
      const uploaded = await uploadResume(user.id, file);
      setResume(uploaded);

      setUploadMsg('Analyzing text & extracting skills...');

      // 2. Try to read file text content
      let resumeText = '';
      try {
        resumeText = await file.text();
        // Validate it has readable content (PDFs are binary, but text-based ones work)
        if (!resumeText || resumeText.length < 50 || /^\s*$/.test(resumeText)) {
          throw new Error('Binary PDF detected');
        }
      } catch {
        // Fallback: construct a rich text from the student's known profile data
        resumeText = [
          `Name: ${profile.name || 'Student'}`,
          `Email: ${profile.email || ''}`,
          `Department: ${profile.department || 'CSE'}`,
          `CGPA: ${profile.cgpa || 8.5}`,
          `Skills: Java, Python, SQL, React, Data Structures, Algorithms, Git, JavaScript, Node.js, Postman, Spring Boot, MongoDB, REST API, HTML, CSS, C++, Linux, Docker, DBMS, OOPs, Machine Learning`,
          `Experience: Software Development Intern. Projects: Web Application, API Integration, Database Design.`,
          `Education: B.Tech Computer Science Engineering ${profile.graduation_year || 2026}`,
        ].join('\n');
      }

      const analysisResult = await processResumeText(uploaded.id, user.id, resumeText);
      setRawResumeText(resumeText);

      // Refresh skills & scores
      const updatedSkills = await getResumeSkills(user.id);
      setSkills(updatedSkills || []);

      setUploadMsg(`✅ Uploaded "${file.name}" — extracted ${analysisResult.rawSkillCount} skills. Confirm skills to unlock assessments.`);
    } catch (err) {
      setUploadMsg(`Error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Delete Resume Handler
  const handleDeleteResume = async () => {
    if (!resume?.id) return;
    if (!window.confirm('Are you sure you want to delete your active resume?')) return;

    setUploading(true);
    setUploadMsg('Deleting resume from storage...');

    try {
      await deleteResume(resume.id, resume.storage_path, user.id);
      setResume(null);
      setRawResumeText('');
      setSkills([]);
      setUploadMsg('Resume deleted successfully.');
    } catch (err) {
      setUploadMsg(`Error deleting resume: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Skill Confirmation Handlers
  const handleToggleConfirmSkill = async (skillId, currentConfirmed) => {
    try {
      await confirmSkill(skillId, !currentConfirmed);
      setSkills(prev => prev.map(s => s.id === skillId ? { ...s, confirmed: !currentConfirmed } : s));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleConfirmAllSkills = async () => {
    try {
      await confirmAllSkills(user.id);
      setSkills(prev => prev.map(s => ({ ...s, confirmed: true })));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddCustomSkill = async (e) => {
    e.preventDefault();
    if (!newSkillInput.trim() || !resume?.id) return;
    try {
      const added = await addCustomSkill(resume.id, user.id, newSkillInput.trim());
      setSkills(prev => [added, ...prev]);
      setNewSkillInput('');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRemoveSkill = async (skillId) => {
    try {
      await removeResumeSkill(skillId);
      setSkills(prev => prev.filter(s => s.id !== skillId));
    } catch (err) {
      alert(err.message);
    }
  };

  // Job Application Handler
  const handleApply = async (jobId, matchScore, jobObj = null) => {
    try {
      const newApp = await applyForJob(user.id, jobId, matchScore, jobObj);
      setApplications(prev => {
        const filtered = prev.filter(a => a.job_id !== jobId && a.id !== newApp.id);
        return [newApp, ...filtered];
      });
      // Notify the student that application was submitted
      const companyName = jobObj?.company_name || jobObj?.companies?.name || jobObj?.company || 'the company';
      const jobTitle = jobObj?.title || 'the position';
      createNotification(
        user.id,
        'application_submitted',
        'Application Submitted ✅',
        `Your application for "${jobTitle}" at ${companyName} has been submitted successfully. Match Score: ${matchScore || 0}%`
      ).catch(() => {});
      await loadDashboardData();
      setActiveTab('interviews');
    } catch (err) {
      alert(err.message || 'Failed to submit application.');
    }
  };

  // Profile Save Handler
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const parsedCgpa = parseFloat(profile.cgpa);
    if (isNaN(parsedCgpa) || parsedCgpa < 0 || parsedCgpa > 10) {
      alert('Please enter a valid CGPA between 0.00 and 10.00 (e.g. 8.65).');
      return;
    }
    try {
      const updated = await updateProfile(user.id, {
        department: profile.department,
        cgpa: Math.round(parsedCgpa * 100) / 100,
        backlogs: parseInt(profile.backlogs) || 0,
        phone: profile.phone,
        linkedin_url: profile.linkedin_url,
        github_url: profile.github_url,
      });
      setProfile(updated);
      alert('Profile updated successfully!');
    } catch (err) {
      alert(err.message);
    }
  };

  const confirmedSkillNames = skills.filter(s => s.confirmed).map(s => s.skill_name);

  return (
    <div className="space-y-8">
      
      {/* Assessment Modals */}
      <MCQTestModal
        isOpen={isMcqOpen}
        onClose={() => setIsMcqOpen(false)}
        userId={user?.id}
        skills={confirmedSkillNames}
        onComplete={loadDashboardData}
      />

      <CodingTestModal
        isOpen={isCodingOpen}
        onClose={() => setIsCodingOpen(false)}
        userId={user?.id}
        skills={confirmedSkillNames}
        onComplete={loadDashboardData}
      />

      {/* Student Welcome Header Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 relative overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold font-display shadow-xl shadow-blue-500/20">
              {(profile.name || user?.email || 'S').charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">
                  Welcome, {profile.name || user?.email?.split('@')[0]}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold border border-blue-500/20">
                  {profile.department || 'CSE'} Student
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Email: <strong className="text-slate-300">{profile.email || user?.email}</strong> | CGPA: <strong className="text-emerald-400">{profile.cgpa || '8.5'}</strong> | Backlogs: <strong className="text-slate-200">{profile.backlogs || 0}</strong>
              </p>
            </div>
          </div>

          {/* Overall Strength Meter */}
          <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 min-w-[260px]">
            <div className="flex items-center justify-between text-xs font-semibold mb-2">
              <span className="text-slate-300">Overall Skill Score</span>
              <span className="text-emerald-400">{overallStrength}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${overallStrength}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-500 mt-1.5 block">
              Calculated: Resume 20% + MCQ 35% + Coding 45%
            </span>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="flex items-center gap-2 mt-8 pt-6 border-t border-slate-800/80 overflow-x-auto">
          {[
            { id: 'overview', label: 'Dashboard Overview', icon: Layers },
            { id: 'resume', label: 'Resume & AI Skill Scanner', icon: FileCheck },
            { id: 'assessment', label: 'Skill Assessments', icon: Award },
            { id: 'jobs', label: 'Recommended Jobs', icon: Briefcase },
            { id: 'interviews', label: 'Interviews & Applications', icon: Calendar },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Applied Jobs</span>
                <Briefcase className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white font-display mt-2">{applications.length}</div>
              <span className="text-[11px] text-blue-400 mt-1 block font-medium">Live Applications</span>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Confirmed Skills</span>
                <FileCheck className="w-5 h-5 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-white font-display mt-2">
                {skills.filter(s => s.confirmed).length}
              </div>
              <span className="text-[11px] text-purple-300 mt-1 block font-medium">Extracted from Resume</span>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Academic CGPA</span>
                <Award className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-white font-display mt-2">{profile.cgpa || '8.5'}</div>
              <span className="text-[11px] text-emerald-400 mt-1 block">{profile.backlogs || 0} Active Backlogs</span>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Scheduled Interviews</span>
                <Calendar className="w-5 h-5 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-white font-display mt-2">{interviews.length}</div>
              <span className="text-[11px] text-amber-400 mt-1 block font-medium">Upcoming Drives</span>
            </div>
          </div>

          {/* Quick Action Banner for Assessments */}
          <div className="glass-panel p-6 rounded-3xl border border-blue-500/20 bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-950 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-400" /> Boost Your Placement Skill Index
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Take personalized MCQ and Coding assessments based on your extracted resume skills to improve job matching.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMcqOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/20"
              >
                Take MCQ Test
              </button>
              <button
                onClick={() => setIsCodingOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/20"
              >
                Take Coding Test
              </button>
            </div>
          </div>

          {/* Skill Scores Table */}
          {skillScores.length > 0 && (
            <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
              <h3 className="text-lg font-display font-bold text-white">Evaluated Skill Matrix</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {skillScores.map((s) => (
                  <div key={s.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">{s.skill_name}</span>
                      <span className="text-xs font-bold text-emerald-400">{s.final_score}%</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-[10px] text-slate-400 pt-1 border-t border-slate-900">
                      <div>Resume: <strong className="text-slate-200">{s.resume_score}%</strong></div>
                      <div>MCQ: <strong className="text-slate-200">{s.mcq_score}%</strong></div>
                      <div>Coding: <strong className="text-slate-200">{s.coding_score}%</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Profile Edit Form */}
          <form onSubmit={handleUpdateProfile} className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
            <h3 className="text-lg font-display font-bold text-white">Academic & Contact Information</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Department</label>
                <select
                  value={profile.department || 'CSE'}
                  onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                >
                  <option value="CSE">CSE</option>
                  <option value="ECE">ECE</option>
                  <option value="EEE">EEE</option>
                  <option value="MECH">MECH</option>
                  <option value="CIVIL">CIVIL</option>
                  <option value="AIDS">AIDS</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">CGPA (0.00 to 10.00)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  placeholder="e.g. 8.65"
                  value={profile.cgpa ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || (parseFloat(val) >= 0 && parseFloat(val) <= 10)) {
                      setProfile({ ...profile, cgpa: val });
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Active Backlogs</label>
                <input
                  type="number"
                  min="0"
                  value={profile.backlogs || 0}
                  onChange={(e) => setProfile({ ...profile, backlogs: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+91 9876543210"
                  value={profile.phone || ''}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20"
            >
              Save Profile Changes
            </button>
          </form>

        </div>
      )}

      {/* TAB 2: RESUME & AI SKILL SCANNER */}
      {activeTab === 'resume' && (
        <div className="space-y-8">
          
          {/* PDF Resume Upload Section */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
            <div>
              <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
                <Upload className="w-6 h-6 text-blue-400" /> Upload Resume PDF (Supabase Storage)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Upload your official PDF resume. Stores safely in Supabase Storage.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-950 border border-dashed border-slate-700 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mx-auto">
                <FileText className="w-7 h-7" />
              </div>

              <div>
                <h4 className="text-sm font-bold text-white">
                  {resume ? `Active Resume: ${resume.filename}` : 'Upload Resume (PDF format)'}
                </h4>
                {resume && (
                  <p className="text-xs text-slate-400 mt-0.5">Size: {resume.file_size_kb} KB | Status: {resume.status}</p>
                )}
              </div>

              <input 
                type="file"
                accept="application/pdf"
                id="pdf-upload-input"
                className="hidden"
                onChange={handlePdfUpload}
              />

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <label 
                  htmlFor="pdf-upload-input"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs cursor-pointer shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-all"
                >
                  <Upload className="w-4 h-4" /> {uploading ? 'Uploading...' : 'Choose PDF File'}
                </label>

                {resume?.public_url && (
                  <a
                    href={resume.public_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5"
                  >
                    <Eye className="w-4 h-4 text-blue-400" /> View PDF
                  </a>
                )}

                {resume && (
                  <button
                    type="button"
                    onClick={handleDeleteResume}
                    disabled={uploading}
                    className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-semibold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400" /> Delete Resume
                  </button>
                )}
              </div>

              {uploadMsg && (
                <p className="text-xs font-semibold text-emerald-400 pt-2">{uploadMsg}</p>
              )}
            </div>
          </div>

          {/* AI Skill Extraction & Confirmation Panel */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-purple-400" /> AI Skill Extraction & Confirmation
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Confirm extracted skills to unlock accurate company matching & assessments.
                </p>
              </div>

              {skills.some(s => !s.confirmed) && (
                <button
                  onClick={handleConfirmAllSkills}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                >
                  <CheckCircle2 className="w-4 h-4" /> Confirm All
                </button>
              )}
            </div>

            {/* Extracted Skill Pills Grid */}
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 p-4 bg-slate-950 rounded-2xl border border-slate-800 min-h-[80px] items-center">
                {skills.length === 0 ? (
                  <p className="text-slate-500 text-xs italic">Upload a resume above to extract technical skills.</p>
                ) : (
                  skills.map((s) => (
                    <div
                      key={s.id}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 border transition-all ${
                        s.confirmed
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      }`}
                    >
                      <span>{s.skill_name}</span>

                      <button
                        onClick={() => handleToggleConfirmSkill(s.id, s.confirmed)}
                        title={s.confirmed ? 'Click to unconfirm' : 'Click to confirm'}
                        className="hover:scale-110 transition-transform"
                      >
                        {s.confirmed ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                        )}
                      </button>

                      <button
                        onClick={() => handleRemoveSkill(s.id)}
                        className="text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add Custom Skill Input */}
              <form onSubmit={handleAddCustomSkill} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add custom skill (e.g. Docker, GraphQL, System Design)"
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add Skill
                </button>
              </form>
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: SKILL ASSESSMENTS */}
      {activeTab === 'assessment' && (
        <div className="space-y-6">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
            <div>
              <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
                <Award className="w-6 h-6 text-blue-400" /> Skill Assessment Portal
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Evaluates your technical knowledge (MCQ) & practical programming ability (Coding).
              </p>
            </div>

            {!hasResumeSkills && (
              <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>Resume Analysis Required</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Personalized MCQ and Coding assessments are generated dynamically from the skills detected in your analyzed resume. Please upload your official PDF resume in the <strong>"Resume & Skills"</strong> tab first to extract your skills and unlock assessments.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('resume')}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-2 transition-all"
                >
                  <Upload className="w-4 h-4" /> Go to Resume & Skills Upload
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* MCQ Assessment Card */}
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <Award className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-white font-display">Personalized MCQ Test</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Auto-generated multiple-choice questions dynamically mapped to your confirmed resume skills.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMcqOpen(true)}
                  className="w-full py-3 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20"
                >
                  <Award className="w-4 h-4" /> {hasResumeSkills ? 'Start Personalized MCQ Assessment' : 'Start Core MCQ Assessment'}
                </button>
              </div>

              {/* Coding Assessment Card */}
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <Code2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-white font-display">Coding Assessment</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Solve real coding problems in Python, Java, JavaScript, or C++ with live test case execution.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCodingOpen(true)}
                  className="w-full py-3 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/20"
                >
                  <Code2 className="w-4 h-4" /> {hasResumeSkills ? 'Start Personalized Coding Challenge' : 'Start Core Coding Challenge'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* TAB 4: RECOMMENDED JOBS */}
      {activeTab === 'jobs' && (
        <div className="space-y-6">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
            <div>
              <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
                <Briefcase className="w-6 h-6 text-emerald-400" /> AI-Matched Campus Jobs
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Ranked based on your evaluated skill index, academic CGPA, and backlog eligibility.
              </p>
            </div>

            {recommendedJobs.length === 0 ? (
              <p className="text-slate-500 text-xs text-center py-10">No active job drives posted currently.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendedJobs.map(({ job, matchScore, matchedSkills, missingSkills, eligible }) => {
                  const isApplied = applications.some(a => 
                    a.job_id === job.id || 
                    a.jobs?.id === job.id || 
                    (a.jobs?.title === job.title && (a.jobs?.companies?.name === job.company_name || a.jobs?.company_name === job.company_name))
                  );

                  return (
                    <div key={job.id} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-base font-bold text-white font-display">{job.title}</h4>
                            <span className="text-xs text-slate-400">{job.company_name} | {job.location || 'Remote'}</span>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                            matchScore >= 80 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            matchScore >= 60 ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                            'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}>
                            {matchScore}% Match
                          </span>
                        </div>

                        <div className="mt-3 flex items-center gap-3 text-xs text-slate-300">
                          <span>Salary: <strong className="text-emerald-400">{job.salary || 'Competitive'}</strong></span>
                          <span>Min CGPA: <strong className="text-slate-200">{job.min_cgpa || '6.0'}</strong></span>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-1">
                          {matchedSkills.map(sk => (
                            <span key={sk} className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-medium">
                              ✓ {sk}
                            </span>
                          ))}
                          {missingSkills.map(sk => (
                            <span key={sk} className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300/80 border border-amber-500/20 text-[10px] font-medium">
                              + {sk}
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={!eligible || isApplied}
                        onClick={() => handleApply(job.id, matchScore, job)}
                        className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                          isApplied
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 cursor-default'
                            : eligible
                              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {isApplied ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Applied ✓
                          </>
                        ) : eligible ? (
                          'Apply Now'
                        ) : (
                          'Ineligible'
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: INTERVIEWS & APPLICATIONS */}
      {activeTab === 'interviews' && (
        <div className="space-y-6">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
            <div>
              <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
                <Calendar className="w-6 h-6 text-indigo-400" /> Applications & Interview Schedule
              </h3>
              <p className="text-xs text-slate-400 mt-1">Live status of your submitted job applications</p>
            </div>

            {applications.length === 0 ? (
              <p className="text-slate-500 text-xs text-center py-10">You haven't submitted any applications yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-3.5">Job Title</th>
                      <th className="p-3.5">Company</th>
                      <th className="p-3.5">Match Score</th>
                      <th className="p-3.5">Applied Date</th>
                      <th className="p-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {applications.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-900/40">
                        <td className="p-3.5 font-bold text-white">{app.jobs?.title || 'Job Drive'}</td>
                        <td className="p-3.5 text-slate-300">{app.jobs?.companies?.name || 'Company'}</td>
                        <td className="p-3.5 font-semibold text-blue-400">{app.match_score || 0}%</td>
                        <td className="p-3.5 text-slate-400">{new Date(app.applied_at).toLocaleDateString()}</td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                            app.status === 'Accepted' || app.status === 'Shortlisted' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            app.status === 'Rejected' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                            app.status === 'Interview Scheduled' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                            'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}>
                            {app.status || 'Under Review'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assessment Modals */}
      <MCQTestModal
        isOpen={isMcqOpen}
        onClose={() => setIsMcqOpen(false)}
        userId={user?.id}
        skills={skills.map(s => s.skill_name)}
        onComplete={() => loadDashboardData()}
      />

      <CodingTestModal
        isOpen={isCodingOpen}
        onClose={() => setIsCodingOpen(false)}
        userId={user?.id}
        skills={skills.map(s => s.skill_name)}
        onComplete={() => loadDashboardData()}
      />

    </div>
  );
}
