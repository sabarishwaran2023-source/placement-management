import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  GraduationCap, 
  UserCheck, 
  ArrowRight, 
  Calendar, 
  Award, 
  TrendingUp, 
  Briefcase,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// Fallback companies for display on home page when DB is empty
const FALLBACK_COMPANIES = [
  { id: 'c1', name: 'Infosys', logo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=120&h=120&fit=crop', role: 'System Engineer', package: '$9,000 / yr', minCgpa: 7.0, visitDate: '18 Aug 2026' },
  { id: 'c2', name: 'TCS', logo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=120&h=120&fit=crop', role: 'Ninja Developer', package: '$7,500 / yr', minCgpa: 6.5, visitDate: '12 Aug 2026' },
  { id: 'c3', name: 'Zoho', logo: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=120&h=120&fit=crop', role: 'SDE-1', package: '$12,000 / yr', minCgpa: 7.5, visitDate: '22 Aug 2026' },
  { id: 'c4', name: 'Accenture', logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=120&h=120&fit=crop', role: 'App Dev Associate', package: '$8,500 / yr', minCgpa: 6.8, visitDate: '25 Aug 2026' },
  { id: 'c5', name: 'Amazon', logo: 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=120&h=120&fit=crop', role: 'SDE Graduate', package: '$24,000 / yr', minCgpa: 8.5, visitDate: '30 Aug 2026' },
];

export default function Home({ onNavigateRole }) {
  const [companies, setCompanies] = useState(FALLBACK_COMPANIES);

  useEffect(() => {
    // Load real companies from DB (jobs table joined with companies)
    supabase
      .from('jobs')
      .select('id, title, salary, min_cgpa, companies(name, logo_url)')
      .eq('status', 'Active')
      .limit(5)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setCompanies(data.map((j, idx) => ({
            id: j.id,
            name: j.companies?.name || 'Partner Company',
            logo: j.companies?.logo_url || FALLBACK_COMPANIES[idx % FALLBACK_COMPANIES.length].logo,
            role: j.title,
            package: j.salary || 'Competitive',
            minCgpa: j.min_cgpa || 6.5,
            visitDate: 'Ongoing Drive'
          })));
        }
      });
  }, []);


  const upcomingDrives = [
    { company: 'TCS', date: '12 Aug 2026', role: 'Ninja Software Dev', pkg: '$7.5k', badge: 'Registration Closing Soon' },
    { company: 'Infosys', date: '18 Aug 2026', role: 'System Engineer', pkg: '$9.0k', badge: 'Pre-placement Talk' },
    { company: 'Zoho', date: '22 Aug 2026', role: 'SDE-1', pkg: '$12.0k', badge: 'Registration Open' },
    { company: 'Amazon', date: '30 Aug 2026', role: 'SDE Graduate', pkg: '$24.0k', badge: 'High Package Drive' },
  ];

  return (
    <div className="space-y-16 pb-20">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-8 sm:p-12 md:p-16 shadow-2xl">
        
        {/* Glow effects */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-blue-400" /> APEX CAMPUS PLACEMENT MANAGEMENT PORTAL
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold text-white tracking-tight leading-tight">
            Find Your Dream Career. <br />
            <span className="gradient-text">Apply, Track & Get Placed.</span>
          </h1>

          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto font-normal leading-relaxed">
            A centralized digital placement platform connecting Students, Top Recruiters, and Placement Officers seamlessly with automated eligibility verification and code quality analytics.
          </p>

          {/* Quick Role Portal Buttons */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onNavigateRole('student')}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-xl shadow-blue-600/25 transition-all hover:scale-105"
            >
              <GraduationCap className="w-5 h-5" /> Student Login Portal
            </button>
            <button
              onClick={() => onNavigateRole('company')}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-sm border border-slate-700 transition-all hover:scale-105"
            >
              <Building2 className="w-5 h-5 text-indigo-400" /> Company / HR Portal
            </button>
            <button
              onClick={() => onNavigateRole('officer')}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-sm border border-slate-800 transition-all hover:scale-105"
            >
              <UserCheck className="w-5 h-5 text-emerald-400" /> Admin & TPO Portal
            </button>
          </div>

          {/* Quick Stats Pill */}
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto border-t border-slate-800/80">
            <div>
              <div className="text-2xl font-bold text-white font-display">850+</div>
              <div className="text-xs text-slate-400">Total Students</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-400 font-display">87%</div>
              <div className="text-xs text-slate-400">Placement Rate</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-indigo-400 font-display">120+</div>
              <div className="text-xs text-slate-400">Visiting Companies</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400 font-display">$24,000</div>
              <div className="text-xs text-slate-400">Highest Package</div>
            </div>
          </div>

        </div>
      </section>

      {/* Latest Companies Visiting Campus */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2">
              <Building2 className="w-6 h-6 text-blue-400" /> Latest Companies Visiting Campus
            </h2>
            <p className="text-xs text-slate-400 mt-1">Top tier recruiters actively hiring from Apex Institute</p>
          </div>
          <button 
            onClick={() => onNavigateRole('student')}
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
          >
            View All Drives <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Company Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {companies.map((comp) => (
            <div
              key={comp.id}
              className="glass-panel glass-panel-hover rounded-2xl p-5 border border-slate-800 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-slate-800 p-2 overflow-hidden mb-3 border border-slate-700 flex items-center justify-center">
                  <img src={comp.logo} alt={comp.name} className="w-full h-full object-cover rounded-lg" />
                </div>
                <h3 className="font-bold text-base text-white">{comp.name}</h3>
                <p className="text-xs text-blue-400 font-medium mt-0.5">{comp.role}</p>
                <div className="mt-3 space-y-1 text-[11px] text-slate-400">
                  <div className="flex items-center justify-between">
                    <span>Package:</span>
                    <span className="text-slate-200 font-semibold">{comp.package}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Min CGPA:</span>
                    <span className="text-slate-200 font-semibold">{comp.minCgpa}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" /> {comp.visitDate}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold">
                  Active Drive
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Upcoming Drives Timeline */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2">
              <Calendar className="w-6 h-6 text-purple-400" /> Upcoming Placement Drives
            </h2>
            <p className="text-xs text-slate-400 mt-1">Schedule of campus recruitment tests and interview rounds</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {upcomingDrives.map((drive, idx) => (
            <div
              key={idx}
              className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2.5 py-0.5 rounded-md bg-purple-500/10 text-purple-400 text-[10px] font-semibold border border-purple-500/20">
                    {drive.badge}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-2">{drive.company}</h3>
                  <p className="text-xs text-slate-400">{drive.role}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-400">{drive.pkg}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-800">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-purple-400" /> {drive.date}
                </span>
                <button
                  onClick={() => onNavigateRole('student')}
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  Register <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Special Feature: Course Requirement Software Metrics Banner */}
      <section className="glass-panel rounded-3xl p-8 border border-purple-500/30 bg-gradient-to-r from-slate-950 via-purple-950/20 to-slate-950 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-center md:text-left">
            <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 text-xs font-bold uppercase tracking-wider">
              Academic Course Feature
            </span>
            <h3 className="text-2xl sm:text-3xl font-display font-extrabold text-white">
              Integrated Software Metrics Dashboard
            </h3>
            <p className="text-slate-300 text-sm max-w-xl">
              Inspect the real-time code quality, Cyclomatic Complexity V(G), Halstead Volume, Maintainability Index (82/100), and Technical Debt analysis of this web portal.
            </p>
          </div>
          <button
            onClick={() => onNavigateRole('metrics')}
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-purple-600/30 flex items-center gap-2 whitespace-nowrap transition-all"
          >
            Launch Metrics Suite <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

    </div>
  );
}
