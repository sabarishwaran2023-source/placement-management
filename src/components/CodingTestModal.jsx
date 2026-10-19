import React, { useState, useEffect } from 'react';
import { Code2, Play, CheckCircle2, XCircle, AlertCircle, RefreshCw, X, Terminal, Cpu } from 'lucide-react';
import { getCodingQuestions, executeCode, runTestCases, saveCodingSubmission } from '../services/codingService';
import { computeAllSkillScores } from '../services/skillScoringService';

const DEFAULT_STARTER_CODE = {
  'Python': `def solve(input_data):\n    # Write your solution here\n    return input_data\n`,
  'Java': `public class Solution {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}\n`,
  'JavaScript': `function solve(input) {\n    // Write your solution here\n    return input;\n}\n`,
  'C++': `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n`
};

export default function CodingTestModal({ isOpen, onClose, userId, skills = [], onComplete }) {
  const [questions, setQuestions] = useState([]);
  const [selectedQIndex, setSelectedQIndex] = useState(0);
  const [language, setLanguage] = useState('Python');
  const [code, setCode] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [customOutput, setCustomOutput] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submissionSuccess, setSubmissionSuccess] = useState(null);

  useEffect(() => {
    if (isOpen) {
      initCodingQuestions();
    } else {
      resetState();
    }
  }, [isOpen]);

  const resetState = () => {
    setQuestions([]);
    setSelectedQIndex(0);
    setLanguage('Python');
    setCode('');
    setCustomInput('');
    setCustomOutput(null);
    setTestResults(null);
    setLoading(true);
    setExecuting(false);
    setSubmitting(false);
    setError('');
    setSubmissionSuccess(null);
  };

  const initCodingQuestions = async () => {
    setLoading(true);
    setError('');
    try {
      const qList = await getCodingQuestions(skills);
      setQuestions(qList);
      if (qList.length > 0) {
        setCode(DEFAULT_STARTER_CODE['Python']);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch coding questions.');
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    setCode(DEFAULT_STARTER_CODE[newLang] || '');
  };

  const handleRunCustomCode = async () => {
    setExecuting(true);
    setCustomOutput(null);
    try {
      const currentQ = questions[selectedQIndex];
      const stdin = customInput || currentQ?.sample_input || '';
      const result = await executeCode(code, language, stdin, currentQ?.sample_output);
      setCustomOutput(result);
    } catch (err) {
      setCustomOutput({ stderr: err.message });
    } finally {
      setExecuting(false);
    }
  };

  const handleRunAllTestCases = async () => {
    setExecuting(true);
    setTestResults(null);
    try {
      const currentQ = questions[selectedQIndex];
      const tcs = currentQ?.test_cases || [
        { input: currentQ?.sample_input, expected_output: currentQ?.sample_output }
      ];
      const results = await runTestCases(code, language, tcs);
      setTestResults(results);
    } catch (err) {
      setError(err.message || 'Error executing test cases.');
    } finally {
      setExecuting(false);
    }
  };

  const handleSubmitSolution = async () => {
    if (!userId) return;
    setSubmitting(true);
    setSubmissionSuccess(null);
    try {
      const currentQ = questions[selectedQIndex];
      const tcs = currentQ?.test_cases || [
        { input: currentQ?.sample_input, expected_output: currentQ?.sample_output }
      ];
      const results = await runTestCases(code, language, tcs);
      setTestResults(results);

      const subData = await saveCodingSubmission(userId, currentQ.id, code, language, results);
      await computeAllSkillScores(userId);

      setSubmissionSuccess(subData);
      if (onComplete) onComplete(subData);
    } catch (err) {
      setError(err.message || 'Failed to save submission.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentQ = questions[selectedQIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 bg-slate-950 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-600/10 text-purple-400 border border-purple-500/20">
              <Code2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-white">Coding Skill Assessment</h2>
              <p className="text-xs text-slate-400">Solve coding challenges to compute your practical programming score</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-20 text-center space-y-4">
            <RefreshCw className="w-10 h-10 text-purple-500 animate-spin mx-auto" />
            <p className="text-slate-400 text-sm font-medium">Loading coding challenges...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center space-y-4">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
            <p className="text-rose-300 text-sm font-medium">{error}</p>
          </div>
        )}

        {!loading && !error && questions.length === 0 && (
          <div className="py-16 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-slate-500 mx-auto" />
            <p className="text-slate-400 text-sm">No coding questions available for your skills currently.</p>
          </div>
        )}

        {/* Challenge View */}
        {!loading && !error && currentQ && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Problem Description & Question Switcher */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* Question Switcher Pills */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {questions.map((q, idx) => (
                  <button
                    key={q.id}
                    onClick={() => {
                      setSelectedQIndex(idx);
                      setTestResults(null);
                      setSubmissionSuccess(null);
                      setCustomOutput(null);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      selectedQIndex === idx
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    Q{idx + 1}: {q.skill_tag}
                  </button>
                ))}
              </div>

              {/* Problem Details Card */}
              <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 bg-slate-900/60">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white font-display">{currentQ.title}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    currentQ.difficulty === 'easy' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    currentQ.difficulty === 'medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {currentQ.difficulty}
                  </span>
                </div>

                <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                  {currentQ.problem_text}
                </p>

                {currentQ.sample_input && (
                  <div className="space-y-1 pt-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Sample Input</span>
                    <pre className="p-2.5 rounded-xl bg-slate-950 text-emerald-400 font-mono text-[11px] border border-slate-800">
                      {currentQ.sample_input}
                    </pre>
                  </div>
                )}

                {currentQ.sample_output && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Expected Sample Output</span>
                    <pre className="p-2.5 rounded-xl bg-slate-950 text-blue-400 font-mono text-[11px] border border-slate-800">
                      {currentQ.sample_output}
                    </pre>
                  </div>
                )}
              </div>

              {/* Submission Notification banner */}
              {submissionSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    Solution submitted successfully! Score: {submissionSuccess.score_percent}%
                  </div>
                </div>
              )}

            </div>

            {/* Right Column: Code Editor & Execution Output */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Toolbar: Language selector & Actions */}
              <div className="flex items-center justify-between bg-slate-900 p-2 rounded-2xl border border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-purple-400 ml-2" />
                  <select
                    value={language}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 font-medium"
                  >
                    {['Python', 'Java', 'JavaScript', 'C++'].map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={executing}
                    onClick={handleRunCustomCode}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 text-emerald-400" /> Run
                  </button>

                  <button
                    disabled={submitting || executing}
                    onClick={handleSubmitSolution}
                    className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all flex items-center gap-1.5"
                  >
                    {submitting ? 'Submitting...' : 'Submit Solution'}
                  </button>
                </div>
              </div>

              {/* Code Editor TextArea */}
              <div className="relative">
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  rows={12}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs text-purple-200 focus:outline-none focus:border-purple-500/80 leading-relaxed resize-none shadow-inner"
                  placeholder="// Type code solution here..."
                />
              </div>

              {/* Console Output Panel */}
              <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                  <span className="text-slate-400 font-sans text-xs font-semibold flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-purple-400" /> Execution Console
                  </span>
                  {executing && <span className="text-amber-400 text-[11px] animate-pulse font-sans">Running code...</span>}
                </div>

                {/* Custom Run Result */}
                {customOutput && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-sans">Output:</span>
                    <pre className={`whitespace-pre-wrap font-mono text-xs ${customOutput.stderr ? 'text-rose-400 font-semibold' : 'text-emerald-400'}`}>
                      {customOutput.stderr || customOutput.stdout || customOutput.status?.description || 'Executed cleanly'}
                    </pre>
                  </div>
                )}

                {/* Test Cases Results */}
                {testResults && (
                  <div className="space-y-2 font-sans">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Test Case Results</span>
                    <div className="grid grid-cols-1 gap-2">
                      {testResults.map((tc, idx) => (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                            tc.passed
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                              : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {tc.passed ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
                            <span>Test Case #{idx + 1}</span>
                          </div>
                          <span className="font-bold">{tc.passed ? 'PASSED' : 'FAILED'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!customOutput && !testResults && (
                  <p className="text-slate-600 text-xs font-sans italic">Click "Run" or "Submit Solution" to view output results here.</p>
                )}

              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
