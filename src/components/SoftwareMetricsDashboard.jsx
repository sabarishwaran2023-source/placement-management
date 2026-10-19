import React, { useState, useEffect } from 'react';
import {
  Activity,
  Code2,
  ShieldCheck,
  FileText,
  TrendingUp,
  TrendingDown,
  Zap,
  Bug,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  HelpCircle,
  Database,
  Calendar,
  Clock,
  Users,
  Compass,
  ArrowUpRight,
  RefreshCw,
  Sliders,
  Check,
  ChevronRight,
  Info,
  Terminal,
  ExternalLink,
  X
} from 'lucide-react';
import { 
  LOC_METRICS, 
  FPA_METRICS, 
  CYCLOMATIC_METRICS, 
  COCOMO_METRICS, 
  SYSTEM_METRICS_OVERVIEW,
  analyzeCodeQuality 
} from '../utils/metricsCalculator';
import { 
  fetchMetricSnapshot, 
  fetchModuleMetrics, 
  fetchEffortEstimates 
} from '../services/softwareMetricsService';

export default function SoftwareMetricsDashboard({ onClose }) {
  const [activeTab, setActiveTab] = useState('loc'); // 'loc' | 'fpa' | 'cc' | 'cocomo'

  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);

  // Interactive Live Code Analyzer state
  const [customCode, setCustomCode] = useState(`// Placement Portal: AI-Assisted Candidate Match Algorithm
function calculateMatchScore(candidate, job) {
  let score = 0;
  let missingSkills = [];

  // 1. Academic eligibility check
  if (candidate.cgpa >= job.minCgpa && candidate.backlogs === 0) {
    score += 25;
  } else {
    return { eligible: false, matchScore: 0, reason: "Academic criteria not met" };
  }

  // 2. Department eligibility
  if (job.eligibleDepartments.includes(candidate.department)) {
    score += 15;
  }

  // 3. Technical skill verification
  for (let i = 0; i < job.requiredSkills.length; i++) {
    const skill = job.requiredSkills[i];
    if (candidate.verifiedSkills.includes(skill)) {
      score += 12; // Weighted match
    } else {
      missingSkills.push(skill);
    }
  }

  // 4. Assessment multiplier
  if (candidate.mcqScore > 80 && candidate.codingScore > 75) {
    score += 20;
  } else if (candidate.mcqScore > 60 || candidate.codingScore > 60) {
    score += 10;
  }

  return {
    eligible: true,
    matchScore: Math.min(100, score),
    missingSkills
  };
}`);

  const [liveAnalysis, setLiveAnalysis] = useState(() => analyzeCodeQuality(customCode));

  useEffect(() => {
    loadDatabaseMetrics();
  }, []);

  const loadDatabaseMetrics = async () => {
    setLoading(true);
    try {
      const snapData = await fetchMetricSnapshot();
      setSnapshot(snapData);
    } catch (err) {
      console.warn('Using local metrics dataset:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunLiveAnalysis = () => {
    setLiveAnalysis(analyzeCodeQuality(customCode));
  };

  return (
    <div className="space-y-8 pb-16 animate-fadeIn">

      {/* Top Banner Header */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-purple-500/30 bg-gradient-to-r from-slate-950 via-purple-950/20 to-slate-950 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center text-white text-2xl font-bold font-display shadow-xl shadow-purple-500/25 ring-2 ring-purple-400/20">
              <Activity className="w-8 h-8" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white">
                  Software Metrics Dashboard
                </h1>
                <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold uppercase tracking-wider">
                  Admin &amp; Development Team
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 text-xs font-semibold">
                  v2.0.0
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl">
                Dedicated engineering measurement dashboard tracking <strong>Lines of Code (LOC)</strong>, 
                <strong> Function Point Analysis (FPA)</strong>, <strong>Cyclomatic Complexity (CC)</strong>, and 
                <strong> COCOMO II Effort Estimation</strong> across all platform modules.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-950/60 border border-purple-500/30 text-xs text-purple-200">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Quality Gate: <strong className="text-emerald-400">PASSED</strong></span>
            </div>
            <button
              onClick={loadDatabaseMetrics}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 transition-colors"
              title="Refresh metrics from database"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Sync</span>
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 text-xs text-rose-300 font-semibold transition-all hover:scale-105 shadow-lg shadow-rose-950/40"
                title="Close Dashboard"
              >
                <X className="w-4 h-4 text-rose-400" />
                <span>Close Dashboard</span>
              </button>
            )}
          </div>
        </div>

        {/* Measurement Methodology Disclaimer Notice */}
        <div className="mt-6 pt-4 border-t border-purple-500/20 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="flex items-start gap-2 bg-blue-950/30 border border-blue-500/20 rounded-xl p-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
            <div>
              <strong className="text-emerald-300 font-semibold">Actual Code Measurements:</strong>
              <p className="text-slate-300 text-[11px] mt-0.5">
                LOC (11,583 lines across 51 files) and Cyclomatic Complexity ($CC = E - N + 2P$) are computed directly from static analysis of our repository.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2 bg-purple-950/30 border border-purple-500/20 rounded-xl p-3">
            <span className="w-2 h-2 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
            <div>
              <strong className="text-purple-300 font-semibold">Parametric Estimation Models:</strong>
              <p className="text-slate-300 text-[11px] mt-0.5">
                Function Points (194 AFP via IFPUG weights) and COCOMO II (48.8 PM) are documented engineering estimates, clearly labeled as models.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Primary Top KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* 1. LOC Card */}
        <div 
          onClick={() => setActiveTab('loc')}
          className={`glass-panel p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
            activeTab === 'loc' ? 'border-blue-500 bg-blue-950/20 shadow-lg shadow-blue-500/10' : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <Code2 className="w-4 h-4" /> Code Size (# LOC)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
              Actual Measured
            </span>
          </div>
          <div className="text-3xl font-display font-extrabold text-white mt-3">
            {LOC_METRICS.summary.totalLoc.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
            <span>Frontend: <strong className="text-slate-200">7,832</strong></span>
            <span>Backend: <strong className="text-slate-200">3,751</strong></span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden flex">
            <div className="bg-blue-500 h-full" style={{ width: '67.6%' }} title="Frontend 67.6%" />
            <div className="bg-purple-500 h-full" style={{ width: '32.4%' }} title="Backend 32.4%" />
          </div>
        </div>

        {/* 2. Function Points Card */}
        <div 
          onClick={() => setActiveTab('fpa')}
          className={`glass-panel p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
            activeTab === 'fpa' ? 'border-purple-500 bg-purple-950/20 shadow-lg shadow-purple-500/10' : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <FileText className="w-4 h-4" /> Functional Size (# FP)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold">
              IFPUG Estimate
            </span>
          </div>
          <div className="text-3xl font-display font-extrabold text-white mt-3">
            {FPA_METRICS.summary.roundedFP} <span className="text-lg text-purple-400 font-normal">AFP</span>
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
            <span>188 UFP &times; 1.03 VAF</span>
            <span className="text-purple-300 font-medium">31 Transactions</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-2 truncate">
            Inputs: 10 &middot; Outputs: 6 &middot; Queries: 6 &middot; Data: 9
          </div>
        </div>

        {/* 3. Cyclomatic Complexity Card */}
        <div 
          onClick={() => setActiveTab('cc')}
          className={`glass-panel p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
            activeTab === 'cc' ? 'border-amber-500 bg-amber-950/20 shadow-lg shadow-amber-500/10' : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Activity className="w-4 h-4" /> Complexity (# CC)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
              Actual Measured
            </span>
          </div>
          <div className="text-3xl font-display font-extrabold text-amber-400 mt-3">
            {CYCLOMATIC_METRICS.systemAverageCC} <span className="text-sm text-slate-400 font-normal">Avg / Max 16</span>
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
            <span>CC = E - N + 2P</span>
            <span className="text-emerald-400 font-semibold">Optimal &lt; 10</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-2 truncate">
            Scored algorithms: Skill Extraction, Matching, Quiz
          </div>
        </div>

        {/* 4. COCOMO Effort Card */}
        <div 
          onClick={() => setActiveTab('cocomo')}
          className={`glass-panel p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
            activeTab === 'cocomo' ? 'border-emerald-500 bg-emerald-950/20 shadow-lg shadow-emerald-500/10' : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Zap className="w-4 h-4" /> Effort (# COCOMO)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold">
              Parametric Model
            </span>
          </div>
          <div className="text-3xl font-display font-extrabold text-emerald-400 mt-3">
            {COCOMO_METRICS.calculatedResults.personMonths} <span className="text-base text-slate-400 font-normal">PM</span>
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
            <span>Duration: <strong className="text-slate-200">9.8 Months</strong></span>
            <span>Team: <strong className="text-slate-200">5.0 Devs</strong></span>
          </div>
          <div className="text-[10px] text-slate-500 mt-2 truncate">
            11 Phases: Requirements &rarr; Testing &rarr; CI/CD
          </div>
        </div>

      </div>

      {/* Interactive Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        {[
          { id: 'loc', label: '1. Code Size (LOC)', icon: Code2, badge: '11,583 Lines' },
          { id: 'fpa', label: '2. Functional Size (FPA)', icon: FileText, badge: '194 FP' },
          { id: 'cc', label: '3. Code Complexity (CC)', icon: Activity, badge: 'CC = E - N + 2P' },
          { id: 'cocomo', label: '4. Effort Estimate (COCOMO)', icon: Zap, badge: '48.8 PM' }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-850 border border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: LINES OF CODE (LOC) DEEP DIVE                                      */}
      {/* ========================================================================= */}
      {activeTab === 'loc' && (
        <div className="space-y-6">

          {/* Sizing Overview Banner */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-semibold uppercase">Total Source LOC</span>
              <div className="text-2xl font-bold text-white font-display">11,583 lines</div>
              <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Excludes third-party node_modules
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-semibold uppercase">Frontend Repository</span>
              <div className="text-2xl font-bold text-blue-400 font-display">7,832 lines</div>
              <span className="text-[11px] text-slate-400">31 files (React, Vite, CSS) &bull; 67.6%</span>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-semibold uppercase">Backend Repository</span>
              <div className="text-2xl font-bold text-purple-400 font-display">3,751 lines</div>
              <span className="text-[11px] text-slate-400">20 files (Express, SQLite, DB) &bull; 32.4%</span>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-semibold uppercase">Measurement Utility</span>
              <div className="text-2xl font-bold text-amber-400 font-display">cloc v1.98</div>
              <span className="text-[11px] text-slate-400">Exact physical line counting</span>
            </div>
          </div>

          {/* Module-Wise LOC Table */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-400" />
                  Module-Wise Code Sizing &amp; Distribution
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Breakdown across Authentication, Resume Processing, Assessments, Matching, and Admin Portals.
                </p>
              </div>
              <span className="text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                5 Modules Analyzed
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Module Name</th>
                    <th className="py-3 px-4">Layer / Scope</th>
                    <th className="py-3 px-4">Files</th>
                    <th className="py-3 px-4">Total LOC</th>
                    <th className="py-3 px-4">SLOC (Excl. Comments)</th>
                    <th className="py-3 px-4">Share</th>
                    <th className="py-3 px-4">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {LOC_METRICS.byModule.map((mod) => (
                    <tr key={mod.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4 font-semibold text-white">
                        {mod.name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono text-[11px]">
                          {mod.layer}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-mono">
                        {mod.files} files
                      </td>
                      <td className="py-3 px-4 font-bold text-blue-400 font-mono text-sm">
                        {mod.loc.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-mono">
                        {mod.sloc.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-200">{mod.pctOfTotal}%</span>
                          <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-blue-500 h-full" style={{ width: `${mod.pctOfTotal}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px] max-w-xs">
                        {mod.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Version Growth & Language Split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Version Growth History */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Code Growth Comparison Between Versions
              </h4>
              <p className="text-xs text-slate-400">
                Tracking source code evolution from initial MVP release to the current v2.0.0 architecture.
              </p>

              <div className="space-y-3">
                {LOC_METRICS.versionHistory.map((ver, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <strong className="text-white font-display">{ver.version}</strong>
                        <span className="text-[10px] text-slate-500 font-mono">{ver.date}</span>
                      </div>
                      <span className="font-bold font-mono text-blue-400">{ver.totalLoc.toLocaleString()} LOC</span>
                    </div>

                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                      <div 
                        className="bg-blue-500 h-full" 
                        style={{ width: `${(ver.frontendLoc / 12000) * 100}%` }} 
                        title={`Frontend: ${ver.frontendLoc}`} 
                      />
                      <div 
                        className="bg-purple-500 h-full" 
                        style={{ width: `${(ver.backendLoc / 12000) * 100}%` }} 
                        title={`Backend: ${ver.backendLoc}`} 
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Frontend: {ver.frontendLoc.toLocaleString()} &middot; Backend: {ver.backendLoc.toLocaleString()}</span>
                      <span className="text-slate-500 italic text-[10px]">{ver.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Language Breakdown */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Code2 className="w-4 h-4 text-amber-400" />
                Language Composition Breakdown
              </h4>
              <p className="text-xs text-slate-400">
                Source language share according to file extensions across the entire project root.
              </p>

              <div className="space-y-4">
                {LOC_METRICS.byLanguage.map((lang, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white font-medium">{lang.name}</span>
                      <span className="font-mono text-slate-300">{lang.loc.toLocaleString()} LOC ({lang.pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${lang.pct}%`, backgroundColor: lang.color }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs text-slate-300">
                <span className="font-semibold text-purple-300 block mb-1">Architecture Note:</span>
                Frontend is structured with modular React 18 functional components and Tailwind CSS utilities. Backend is implemented with standard ES Modules Node.js/Express and SQLite3 with promisified queries.
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: FUNCTION POINT ANALYSIS (FPA) DEEP DIVE                            */}
      {/* ========================================================================= */}
      {activeTab === 'fpa' && (
        <div className="space-y-6">

          {/* FPA Formula Summary Header */}
          <div className="glass-panel p-6 rounded-2xl border border-purple-500/30 bg-purple-950/10 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <span className="text-xs text-purple-300 font-semibold uppercase">Unadjusted FP (UFP)</span>
              <div className="text-3xl font-bold text-white font-display mt-1">188</div>
              <span className="text-[11px] text-slate-400">Sum of EI, EO, EQ, ILF, EIF</span>
            </div>
            <div>
              <span className="text-xs text-purple-300 font-semibold uppercase">Value Adjustment (VAF)</span>
              <div className="text-3xl font-bold text-purple-400 font-display mt-1">1.03</div>
              <span className="text-[11px] text-slate-400">VAF = 0.65 + (0.01 &times; 38 TDI)</span>
            </div>
            <div>
              <span className="text-xs text-purple-300 font-semibold uppercase">Adjusted FP (AFP)</span>
              <div className="text-3xl font-bold text-emerald-400 font-display mt-1">193.64</div>
              <span className="text-[11px] text-emerald-300 font-semibold">&approx; 194 Function Points</span>
            </div>
            <div>
              <span className="text-xs text-purple-300 font-semibold uppercase">Counting Standard</span>
              <div className="text-2xl font-bold text-amber-400 font-display mt-1">IFPUG 4.3.1</div>
              <span className="text-[11px] text-slate-400">Functional Size Measurement</span>
            </div>
          </div>

          {/* 5 FP Components Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FPA_METRICS.components.map((comp, idx) => (
              <div key={idx} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">{comp.type}</h4>
                  <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 font-mono font-bold text-xs border border-purple-500/30">
                    {comp.totalFP} FP
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {comp.description}
                </p>

                <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                  <div className="text-[11px] font-semibold text-slate-300 mb-1">
                    Inventory Items ({comp.items.length}):
                  </div>
                  {comp.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="flex items-center justify-between text-[11px] py-1 border-b border-slate-900/50">
                      <span className="text-slate-300 truncate max-w-[180px]">{item.name}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          {item.complexity}
                        </span>
                        <span className="font-mono font-semibold text-purple-400">{item.fp} FP</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 14 General System Characteristics (GSCs) */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-purple-400" />
                  14 General System Characteristics (GSCs) &middot; Total Degree of Influence = 38
                </h4>
                <p className="text-xs text-slate-400">
                  Each characteristic is rated from 0 (No Influence) to 5 (Essential).
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-purple-300 bg-purple-950/60 px-3 py-1.5 rounded-lg border border-purple-500/30">
                Formula: VAF = 0.65 + (0.01 &times; &sum; TDI) = 1.03
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {FPA_METRICS.generalCharacteristics.map((gsc) => (
                <div key={gsc.id} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs text-white font-medium block">
                      {gsc.id}. {gsc.name}
                    </span>
                    <span className="text-[10px] text-slate-400">{gsc.desc}</span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-xs font-bold font-mono text-purple-400 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-500/20">
                      DI: {gsc.di}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CYCLOMATIC COMPLEXITY (CC) DEEP DIVE                               */}
      {/* ========================================================================= */}
      {activeTab === 'cc' && (
        <div className="space-y-6">

          {/* Formula & Risk Banner */}
          <div className="glass-panel p-6 rounded-2xl border border-amber-500/30 bg-amber-950/10 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  McCabe's Cyclomatic Complexity Formula
                </span>
                <div className="text-2xl sm:text-3xl font-mono font-extrabold text-white mt-1">
                  CC = E &minus; N + 2P
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  Measures the number of linearly independent paths through program source code. 
                  Where <strong className="text-amber-300">E</strong> = number of control-flow edges, 
                  <strong className="text-amber-300"> N</strong> = number of nodes, and 
                  <strong className="text-amber-300"> P</strong> = number of connected components (P = 1 for a single subroutine).
                </p>
              </div>

              <div className="flex items-center gap-4 bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                <div className="text-center">
                  <span className="text-[10px] text-slate-400 uppercase block">System Avg CC</span>
                  <span className="text-2xl font-bold font-mono text-emerald-400">6.8</span>
                </div>
                <div className="w-px h-10 bg-slate-800" />
                <div className="text-center">
                  <span className="text-[10px] text-slate-400 uppercase block">Max Peak CC</span>
                  <span className="text-2xl font-bold font-mono text-amber-400">16</span>
                </div>
              </div>
            </div>

            {/* Risk Category Legend */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-amber-500/20">
              {CYCLOMATIC_METRICS.riskClassificationGuide.map((risk, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-2 text-xs">
                  <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] border ${risk.badge}`}>
                    CC {risk.range}
                  </span>
                  <div>
                    <strong className="text-white block">{risk.risk}</strong>
                    <span className="text-[10px] text-slate-400">{risk.testEffort}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Specific Platform Algorithms Analysis Table */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-5 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-amber-400" />
                Function-Level Complexity Analysis (Platform Core Modules)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Exact edge-node measurement across Resume Skill Extraction, Assessment Scoring, Job Eligibility, and Matching.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Function / Algorithm</th>
                    <th className="py-3 px-4">Module &amp; File</th>
                    <th className="py-3 px-4">Nodes (N)</th>
                    <th className="py-3 px-4">Edges (E)</th>
                    <th className="py-3 px-4">CC (E - N + 2P)</th>
                    <th className="py-3 px-4">Risk Level</th>
                    <th className="py-3 px-4">Min. Unit Tests</th>
                    <th className="py-3 px-4">Refactoring &amp; Quality Advice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {CYCLOMATIC_METRICS.keyAlgorithms.map((algo, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-white">
                        {algo.functionName}()
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-300 block font-medium">{algo.module}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{algo.filePath}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">{algo.nodes}</td>
                      <td className="py-3 px-4 font-mono text-slate-300">{algo.edges}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-lg font-mono font-bold text-sm ${
                          algo.cc <= 10 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          CC = {algo.cc}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          algo.riskRating.includes('Low') 
                            ? 'bg-emerald-500/20 text-emerald-300' 
                            : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {algo.riskRating}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-blue-400">
                        &ge; {algo.minTestCases} tests
                      </td>
                      <td className="py-3 px-4 text-slate-300 text-[11px] max-w-xs">
                        {algo.recommendation}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Interactive Live CC AST Analyzer */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-blue-400" />
                  Interactive Live Cyclomatic Complexity Analyzer
                </h4>
                <p className="text-xs text-slate-400">
                  Edit or paste JavaScript function code below to calculate CC, Nodes, Edges, and Maintainability Index in real-time.
                </p>
              </div>

              <button
                onClick={handleRunLiveAnalysis}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors shadow-lg shadow-blue-500/20"
              >
                <Sparkles className="w-3.5 h-3.5" /> Re-Analyze AST
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <textarea
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                  rows={14}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-colors selection:bg-blue-600 selection:text-white"
                  spellCheck={false}
                />
              </div>

              <div className="glass-panel p-4 rounded-xl border border-slate-800/80 space-y-3 bg-slate-950/40">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Computed AST Metrics
                </span>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase">Cyclomatic Complexity</span>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold font-mono text-amber-400">
                      CC = {liveAnalysis.cyclomaticComplexity}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                      liveAnalysis.cyclomaticComplexity <= 10 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {liveAnalysis.riskRating}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    Formula: {liveAnalysis.edges} (E) &minus; {liveAnalysis.nodes} (N) + 2(1) = {liveAnalysis.cyclomaticComplexity}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Decision Points</span>
                    <strong className="text-white font-mono text-sm">{liveAnalysis.decisionPoints}</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Lines of Code</span>
                    <strong className="text-white font-mono text-sm">{liveAnalysis.loc} LOC</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Maintainability</span>
                    <strong className="text-emerald-400 font-mono text-sm">{liveAnalysis.maintainabilityIndex} / 100</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Tech Debt Hours</span>
                    <strong className="text-blue-400 font-mono text-sm">{liveAnalysis.technicalDebtHours} hrs</strong>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="font-semibold text-slate-300 block mb-0.5">Test Recommendation:</span>
                  Requires minimum of <strong>{liveAnalysis.cyclomaticComplexity} independent unit test cases</strong> to achieve 100% branch path coverage.
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: COCOMO II EFFORT ESTIMATE DEEP DIVE                                 */}
      {/* ========================================================================= */}
      {activeTab === 'cocomo' && (
        <div className="space-y-6">

          {/* COCOMO Formula & Results Summary */}
          <div className="glass-panel p-6 rounded-2xl border border-emerald-500/30 bg-emerald-950/10 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  COCOMO II Parametric Model (Semi-Detached Mode)
                </span>
                <div className="text-2xl sm:text-3xl font-mono font-extrabold text-white mt-1">
                  PM = A &times; (KSLOC)<sup>B</sup> &times; EAF
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  Estimates effort from software size (11.583 KLOC). 
                  Parameters: <strong className="text-emerald-300">A = 3.0</strong>, 
                  <strong className="text-emerald-300"> B = 1.12</strong>, 
                  <strong className="text-emerald-300"> EAF = 1.04</strong> (Effort Adjustment Factor from 11 cost drivers).
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                <div className="text-center">
                  <span className="text-[10px] text-slate-400 uppercase block">Total Effort</span>
                  <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
                    {COCOMO_METRICS.calculatedResults.personMonths}
                  </span>
                  <span className="text-[9px] text-slate-500 block">Person-Months</span>
                </div>
                <div className="text-center border-x border-slate-800 px-2">
                  <span className="text-[10px] text-slate-400 uppercase block">Duration</span>
                  <span className="text-xl sm:text-2xl font-bold font-mono text-blue-400">
                    {COCOMO_METRICS.calculatedResults.developmentDurationMonths}
                  </span>
                  <span className="text-[9px] text-slate-500 block">Calendar Mos</span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-slate-400 uppercase block">Team Size</span>
                  <span className="text-xl sm:text-2xl font-bold font-mono text-purple-400">
                    {COCOMO_METRICS.calculatedResults.averageStaffSize}
                  </span>
                  <span className="text-[9px] text-slate-500 block">Engineers</span>
                </div>
              </div>
            </div>

            {/* Calculations Breakdown Step-by-Step */}
            <div className="pt-3 border-t border-emerald-500/20 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Step 1: Effort Calculation</span>
                <span className="font-mono text-white text-xs mt-0.5 block">
                  3.0 &times; (11.583)<sup>1.12</sup> &times; 1.04 = <strong>48.8 PM</strong>
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Step 2: Schedule Duration</span>
                <span className="font-mono text-white text-xs mt-0.5 block">
                  TDEV = 2.5 &times; (48.8)<sup>0.35</sup> = <strong>9.75 Months</strong>
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Step 3: Average Staffing</span>
                <span className="font-mono text-white text-xs mt-0.5 block">
                  Staff S = 48.8 PM / 9.75 Mos = <strong>5.0 Devs</strong>
                </span>
              </div>
            </div>
          </div>

          {/* 11 Planned Development Phases Tracker */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-400" />
                  11 Planned Development Phases &middot; Progress vs. Effort
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Comparison between estimated planned effort (PM) and actual engineering effort across project milestones.
                </p>
              </div>
              <span className="text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1.5 rounded-lg font-semibold">
                Status: Final Integration &amp; QA Phase
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Phase # &amp; Description</th>
                    <th className="py-3 px-4">Effort Share (%)</th>
                    <th className="py-3 px-4">Planned (PM)</th>
                    <th className="py-3 px-4">Actual (PM)</th>
                    <th className="py-3 px-4">Variance</th>
                    <th className="py-3 px-4">Lead Role</th>
                    <th className="py-3 px-4">Phase Progress</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {COCOMO_METRICS.developmentPhases.map((phase) => {
                    const variance = (phase.actualPM - phase.plannedPM).toFixed(1);
                    return (
                      <tr key={phase.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 px-4 font-semibold text-white">
                          {phase.id}. {phase.phase}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300">
                          {phase.sharePct}%
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300">
                          {phase.plannedPM} PM
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                          {phase.actualPM} PM
                        </td>
                        <td className="py-3 px-4 font-mono">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                            parseFloat(variance) <= 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
                          }`}>
                            {variance} PM
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {phase.owner}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-slate-200">{phase.progressPct}%</span>
                            <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-emerald-500 h-full" style={{ width: `${phase.progressPct}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            phase.status === 'Completed'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-blue-500/20 text-blue-300'
                          }`}>
                            {phase.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Effort Multipliers (Cost Drivers) */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              COCOMO II Effort Adjustment Factor (EAF = 1.04) Calibration
            </h4>
            <p className="text-xs text-slate-400">
              Assessed cost driver ratings according to project requirements and team profile:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {COCOMO_METRICS.costDrivers.map((driver, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-white font-medium block">{driver.driver}</span>
                    <span className="text-[10px] text-slate-400">{driver.rating}</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/20">
                    &times; {driver.multiplier.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Quality Gate / Tooling Integrations Footer */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Static Analysis &amp; Quality Gate Compliance
          </h4>
          <span className="text-xs text-slate-400">
            Validated against IEEE &amp; IFPUG software measurement guidelines
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {SYSTEM_METRICS_OVERVIEW.toolIntegrations.map((tool, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{tool.name}</span>
                <span className="text-[10px] text-slate-500 font-mono">{tool.version}</span>
              </div>
              <span className="text-xs text-emerald-400 font-semibold block">{tool.status}</span>
              <span className="text-[10px] text-slate-400 block truncate">{tool.metric}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
