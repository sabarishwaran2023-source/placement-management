import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, User, Building2, GraduationCap, UserCheck, KeyRound, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, initialRole = 'student' }) {
  const { signIn, signUp, resetPassword, resendConfirmation } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department: 'CSE',
    cgpa: '',
    registerNumber: '',
    graduationYear: new Date().getFullYear() + 1,
    companyName: ''
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResend, setShowResend] = useState(false); // show resend email button

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode('login');
      setSelectedRole(initialRole);
      setErrorMsg('');
      setSuccessMsg('');
      setShowResend(false);
      setFormData({ name: '', email: '', password: '', department: 'CSE', cgpa: '', registerNumber: '', graduationYear: new Date().getFullYear() + 1, companyName: '' });
    }
  }, [isOpen, initialRole]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await signIn({ email: formData.email, password: formData.password });
        onAuthSuccess();
        onClose();

      } else if (mode === 'register') {
        const extraData = {};
        if (selectedRole === 'student') {
          const parsedCgpa = parseFloat(formData.cgpa);
          if (isNaN(parsedCgpa) || parsedCgpa < 0 || parsedCgpa > 10) {
            setErrorMsg('Please enter a valid CGPA between 0.00 and 10.00 (e.g. 8.65).');
            setLoading(false);
            return;
          }
          extraData.department = formData.department;
          extraData.cgpa = Math.round(parsedCgpa * 100) / 100;
          if (formData.registerNumber) extraData.register_number = formData.registerNumber;
          if (formData.graduationYear) extraData.graduation_year = parseInt(formData.graduationYear);
        }
        if (selectedRole === 'company') {
          extraData.company_name = formData.companyName;
        }
        const result = await signUp({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          role: selectedRole,
          extraData
        });

        // If email confirmation is OFF → Supabase returns a session → auto-login now
        if (result?.session) {
          onAuthSuccess();
          onClose();
        } else {
          // Email confirmation is ON → ask user to check inbox
          setSuccessMsg('Account created! Please check your email to confirm, then sign in.');
          setMode('login');
        }

      } else if (mode === 'forgot') {
        await resetPassword(formData.email);
        setSuccessMsg('Password reset email sent! Check your inbox.');
        setMode('login');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { id: 'student', label: 'Student', icon: GraduationCap },
    { id: 'company', label: 'Company HR', icon: Building2 },
    { id: 'admin', label: 'Admin / TPO', icon: UserCheck }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-slate-950 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-5">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex p-3 rounded-2xl bg-blue-600/10 text-blue-400 border border-blue-500/20 mb-2">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white">
            {mode === 'login' && 'Welcome Back'}
            {mode === 'register' && 'Create Account'}
            {mode === 'forgot' && 'Reset Password'}
          </h2>
          <p className="text-xs text-slate-400">
            {mode === 'login' && 'Sign in to your placement dashboard'}
            {mode === 'register' && 'Join Apex Placement Management Portal'}
            {mode === 'forgot' && 'We\'ll send a reset link to your email'}
          </p>
        </div>

        {/* Role Selector (only for login + register) */}
        {mode !== 'forgot' && (
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900 rounded-2xl border border-slate-800 text-xs">
            {roles.map((r) => {
              const Icon = r.icon;
              const active = selectedRole === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedRole(r.id)}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-xl font-semibold transition-all ${
                    active
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" /> {r.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Success / Error Messages */}
        {successMsg && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium overflow-hidden">
            <div className="p-3 text-center">{errorMsg}</div>
            {showResend && formData.email && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await resendConfirmation(formData.email);
                    setErrorMsg('');
                    setShowResend(false);
                    setSuccessMsg(`Confirmation email resent to ${formData.email}. Please check your inbox!`);
                  } catch {
                    setSuccessMsg('Confirmation email resent! Please check your inbox and spam folder.');
                    setShowResend(false);
                    setErrorMsg('');
                  }
                }}
                className="w-full py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold border-t border-rose-500/20 transition-colors flex items-center justify-center gap-2"
              >
                <Mail className="w-3.5 h-3.5" /> Resend Confirmation Email
              </button>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Back button in forgot mode */}
          {mode === 'forgot' && (
            <button type="button" onClick={() => setMode('login')}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors mb-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </button>
          )}

          {/* Full Name — register only */}
          {mode === 'register' && (
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text" required
                  placeholder={selectedRole === 'company' ? 'HR Recruiter Name' : 'e.g. Rahul Verma'}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="email" required
                placeholder={selectedRole === 'company' ? 'hr@company.com' : 'rahul@college.edu'}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Password — login + register */}
          {mode !== 'forgot' && (
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="password" required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          )}

          {/* Company Name — register as company */}
          {mode === 'register' && selectedRole === 'company' && (
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Company Name</label>
              <input
                type="text" required
                placeholder="e.g. Infosys, TCS, Zoho"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          )}

          {/* Department + CGPA — register as student */}
          {mode === 'register' && selectedRole === 'student' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    {['CSE','ECE','EEE','MECH','CIVIL','IT','AIDS','AIML'].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">CGPA (0.00–10.00)</label>
                  <input
                    type="number" step="0.01" min="0" max="10"
                    placeholder="e.g. 8.65"
                    value={formData.cgpa}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || (parseFloat(val) >= 0 && parseFloat(val) <= 10)) {
                        setFormData({ ...formData, cgpa: val });
                      }
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Register Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 21CSE0042"
                    value={formData.registerNumber}
                    onChange={(e) => setFormData({ ...formData, registerNumber: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Graduation Year</label>
                  <select
                    value={formData.graduationYear}
                    onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    {[2024,2025,2026,2027,2028].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold text-xs shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2"
          >
            {loading
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing…</>
              : mode === 'login'
                ? `Sign In as ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`
                : mode === 'register'
                  ? `Create ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Account`
                  : 'Send Reset Link'
            }
          </button>
        </form>

        {/* Footer links */}
        <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-900 space-y-2">
          {mode === 'login' && (
            <>
              <div>
                Don't have an account?{' '}
                <button onClick={() => { setMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
                  className="text-blue-400 font-semibold hover:underline">Sign Up</button>
              </div>
              <div>
                <button onClick={() => { setMode('forgot'); setErrorMsg(''); setSuccessMsg(''); }}
                  className="text-slate-500 hover:text-blue-400 transition-colors">Forgot password?</button>
              </div>
            </>
          )}
          {mode === 'register' && (
            <div>
              Already registered?{' '}
              <button onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
                className="text-blue-400 font-semibold hover:underline">Sign In</button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

