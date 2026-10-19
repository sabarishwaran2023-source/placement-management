import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, AlertCircle, Award, ChevronRight, RefreshCw, X } from 'lucide-react';
import { generateAssessment, getAssessmentWithQuestions, startAssessment, submitAnswer, finishAssessment, getSkillWiseResults } from '../services/assessmentService';
import { computeAllSkillScores } from '../services/skillScoringService';

export default function MCQTestModal({ isOpen, onClose, userId, skills = [], onComplete }) {
  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [finalResult, setFinalResult] = useState(null);
  const [skillBreakdown, setSkillBreakdown] = useState([]);

  useEffect(() => {
    if (isOpen && userId) {
      initAssessment();
    } else {
      resetState();
    }
  }, [isOpen, userId]);

  const resetState = () => {
    setAssessment(null);
    setQuestions([]);
    setCurrentIndex(0);
    setSelectedOptions({});
    setLoading(true);
    setError('');
    setSubmitting(false);
    setIsFinished(false);
    setFinalResult(null);
    setSkillBreakdown([]);
  };

  const initAssessment = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Generate or fetch assessment
      const assessData = await generateAssessment(userId, skills);
      setAssessment(assessData);

      // 2. Fetch full question details strictly matched with student skills
      const qList = await getAssessmentWithQuestions(assessData.id, skills);
      if (!qList.length) {
        throw new Error('No questions found for this assessment.');
      }
      setQuestions(qList);

      // 3. Mark as in progress if pending
      if (assessData.status === 'pending') {
        await startAssessment(assessData.id);
      }
    } catch (err) {
      setError(err.message || 'Failed to load assessment questions.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (option) => {
    setSelectedOptions(prev => ({
      ...prev,
      [currentIndex]: option
    }));
  };

  const handleNext = async () => {
    const currentQ = questions[currentIndex];
    const selected = selectedOptions[currentIndex];

    if (selected && currentQ) {
      try {
        await submitAnswer(
          assessment.id,
          currentQ.id,           // assessment_questions row ID (not questions.id)
          userId,
          selected,
          currentQ.questions?.correct_option
        );
      } catch (err) {
        console.warn('Failed to record answer:', err);
      }
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      // 1. Submit final question answer if selected
      const currentQ = questions[currentIndex];
      const selected = selectedOptions[currentIndex];
      if (selected && currentQ) {
        try {
          await submitAnswer(
            assessment.id,
            currentQ.id,
            userId,
            selected,
            currentQ.questions?.correct_option || currentQ.correct_option
          );
        } catch (e) {
          console.warn('Answer save notice:', e);
        }
      }

      // 2. Compute exact test results from candidate selected options
      let correctCount = 0;
      const skillMap = {};

      questions.forEach((qObj, idx) => {
        const userSelected = selectedOptions[idx];
        const qData = qObj.questions || qObj;
        const correctOpt = qData.correct_option;
        const isCorrect = userSelected === correctOpt;
        const skillTag = qData.skill_tag || 'General';

        if (isCorrect) correctCount++;

        if (!skillMap[skillTag]) {
          skillMap[skillTag] = { skill_tag: skillTag, total: 0, correct: 0 };
        }
        skillMap[skillTag].total++;
        if (isCorrect) skillMap[skillTag].correct++;
      });

      const totalQs = questions.length;
      const scorePercent = totalQs > 0 ? Math.round((correctCount / totalQs) * 100) : 0;

      const breakdown = Object.values(skillMap).map(item => ({
        ...item,
        percent: item.total > 0 ? Math.round((item.correct / item.total) * 100) : 0
      }));

      const computedResult = {
        id: assessment?.id || `assess-${Date.now()}`,
        status: 'completed',
        total_questions: totalQs,
        correct_answers: correctCount,
        score_percent: scorePercent
      };

      // 3. Mark assessment completed in DB & service
      const result = await finishAssessment(assessment?.id, userId, computedResult);
      setFinalResult(result || computedResult);
      setSkillBreakdown(breakdown);

      // 4. Update overall student skill score matrix with exact MCQ performance
      await computeAllSkillScores(userId, breakdown);

      setIsFinished(true);
      if (onComplete) onComplete(result || computedResult);
    } catch (err) {
      setError(err.message || 'Failed to submit test.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 bg-slate-950 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-600/10 text-blue-400 border border-blue-500/20">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-white">Skill Assessment Test</h2>
              <p className="text-xs text-slate-400">Personalized MCQ evaluation based on your resume skills</p>
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
          <div className="py-16 text-center space-y-4">
            <RefreshCw className="w-10 h-10 text-blue-500 animate-spin mx-auto" />
            <p className="text-slate-400 text-sm font-medium">Generating your personalized test...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center space-y-4">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
            <p className="text-rose-300 text-sm font-medium">{error}</p>
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700"
            >
              Close Window
            </button>
          </div>
        )}

        {/* Finished / Score Report View */}
        {!loading && !error && isFinished && finalResult && (
          <div className="space-y-6 text-center py-4">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white text-3xl font-bold font-display mx-auto shadow-xl shadow-emerald-500/20">
              {finalResult.score_percent}%
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-white font-display">Assessment Completed!</h3>
              <p className="text-xs text-slate-400">
                You answered <strong className="text-emerald-400">{finalResult.correct_answers}</strong> out of <strong className="text-slate-200">{finalResult.total_questions}</strong> questions correctly.
              </p>
            </div>

            {/* Skill-wise breakdown */}
            {skillBreakdown.length > 0 && (
              <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 text-left space-y-3">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Skill Breakdown</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {skillBreakdown.map((s) => (
                    <div key={s.skill_tag} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-white block">{s.skill_tag}</span>
                        <span className="text-[11px] text-slate-400">{s.correct} / {s.total} Correct</span>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        s.percent >= 70 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        s.percent >= 50 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {s.percent}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/25 transition-all"
            >
              Return to Dashboard
            </button>
          </div>
        )}

        {/* Active Test View */}
        {!loading && !error && !isFinished && questions.length > 0 && (
          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-400">Question {currentIndex + 1} of {questions.length}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[11px]">
                  {questions[currentIndex]?.questions?.skill_tag}
                </span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Question Text */}
            <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Difficulty: {questions[currentIndex]?.questions?.difficulty?.toUpperCase()}
              </span>
              <h3 className="text-base font-semibold text-white leading-relaxed">
                {questions[currentIndex]?.questions?.question_text}
              </h3>
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-1 gap-3">
              {['A', 'B', 'C', 'D'].map((optKey) => {
                const optText = questions[currentIndex]?.questions?.[`option_${optKey.toLowerCase()}`];
                const isSelected = selectedOptions[currentIndex] === optKey;

                return (
                  <button
                    key={optKey}
                    onClick={() => handleSelectOption(optKey)}
                    className={`p-4 rounded-xl text-left text-xs font-medium border transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-white shadow-md shadow-blue-500/10'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[11px] shrink-0 ${
                      isSelected ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {optKey}
                    </span>
                    <span className="pt-0.5">{optText}</span>
                  </button>
                );
              })}
            </div>

            {/* Navigation Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-900">
              <button
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex(prev => prev - 1)}
                className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold disabled:opacity-40"
              >
                Previous
              </button>

              <button
                disabled={submitting}
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 flex items-center gap-2"
              >
                {submitting ? (
                  <>Submitting...</>
                ) : currentIndex === questions.length - 1 ? (
                  <>Finish Test</>
                ) : (
                  <>Next Question <ChevronRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
