import React from 'react';
import { GraduationCap, Heart, ShieldCheck, Activity } from 'lucide-react';

export default function Footer({ onNavigateRole }) {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-400 text-xs py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="font-display font-bold text-white text-base">APEX INSTITUTE</span>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Official Campus Placement Management Portal with integrated Software Metrics Dashboard for code quality evaluation.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-white mb-3">Role Portals</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => onNavigateRole('student')} className="hover:text-blue-400 transition-colors">
                  Student Dashboard
                </button>
              </li>
              <li>
                <button onClick={() => onNavigateRole('company')} className="hover:text-indigo-400 transition-colors">
                  Company / HR Portal
                </button>
              </li>
              <li>
                <button onClick={() => onNavigateRole('officer')} className="hover:text-emerald-400 transition-colors">
                  Placement Officer Console
                </button>
              </li>
            </ul>
          </div>

          {/* Software Metrics Course Links */}
          <div>
            <h4 className="font-bold text-white mb-3">Software Metrics Suite</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => onNavigateRole('metrics')} className="hover:text-purple-400 transition-colors flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-purple-400" /> LOC & Cyclomatic V(G)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigateRole('metrics')} className="hover:text-purple-400 transition-colors">
                  Maintainability Index (82)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigateRole('metrics')} className="hover:text-purple-400 transition-colors">
                  Halstead Metrics ($V = N \log_2 \eta$)
                </button>
              </li>
            </ul>
          </div>

          {/* Static Analyzer Tools */}
          <div>
            <h4 className="font-bold text-white mb-3">Supported Toolchains</h4>
            <div className="flex flex-wrap gap-1.5 text-[10px]">
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">SonarQube</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">ESLint</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">CKJM</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">Radon</span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">PMD / SpotBugs</span>
            </div>
          </div>

        </div>

        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-slate-500 text-[11px]">
          <p>© 2026 Apex Institute of Technology - Training & Placement Cell. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built for Software Metrics Course <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </p>
        </div>
      </div>
    </footer>
  );
}
