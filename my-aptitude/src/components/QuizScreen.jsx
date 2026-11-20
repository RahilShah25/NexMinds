import { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, CheckCircle2, XCircle, ChevronRight, Home, Clock, Share2, Sparkles,
  FastForward, Puzzle, Crown, Hash, Database, RotateCcw, HelpCircle,
  Award, ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { fetchAptitudeQuestions, getStaticFallbackQuestions } from '../lib/questionsService';
import './QuizScreen.css';

const CAT_META = {
  math: { label: 'Quantitative Aptitude', shortName: 'Math Sprint', color: '#F59E0B', icon: FastForward },
  quantitative: { label: 'Quantitative Aptitude', shortName: 'Math Sprint', color: '#F59E0B', icon: FastForward },
  puzzle: { label: 'Pattern Recognition', shortName: 'Spatial Puzzle', color: '#0284C7', icon: Puzzle },
  pattern: { label: 'Pattern Recognition', shortName: 'Spatial Puzzle', color: '#0284C7', icon: Puzzle },
  logic: { label: 'Logical Reasoning', shortName: 'Deduction Blitz', color: '#10B981', icon: Crown },
  logical: { label: 'Logical Reasoning', shortName: 'Deduction Blitz', color: '#10B981', icon: Crown },
  memory: { label: 'Numerical Agility', shortName: 'Series Memory', color: '#38BDF8', icon: Hash },
  numerical: { label: 'Numerical Agility', shortName: 'Series Memory', color: '#38BDF8', icon: Hash },
};

const LABELS = ['A', 'B', 'C', 'D'];
const TIMED_SECS = 30;

export default function QuizScreen({ config = {}, onComplete }) {
  const { addXP, recordQuizResult } = useAuth();
  const category = (config?.category || 'math').toLowerCase();
  const targetCount = config?.count || 5;
  const timed = config?.timed ?? true;
  const isDailyChallenge = config?.isDailyChallenge ?? false;

  const rawMeta = CAT_META[category] || CAT_META.math;
  const meta = { ...rawMeta };
  const Icon = meta.icon;

  const [questions, setQuestions] = useState(() => getStaticFallbackQuestions(category, targetCount));
  const [isDbQuestion, setIsDbQuestion] = useState(false);
  const [totalDbCount, setTotalDbCount] = useState(0);
  const xpAwardedRef = useRef(false);

  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [timer, setTimer] = useState(TIMED_SECS);
  const [phase, setPhase] = useState('quiz'); // 'quiz' | 'results'

  // Fetch Supabase DB questions dynamically
  const loadDbQuestions = useCallback(async () => {
    try {
      const { questions: dbQs, isFromDb, totalInDb } = await fetchAptitudeQuestions({
        category,
        count: targetCount,
      });

      if (dbQs && dbQs.length > 0) {
        setQuestions((prev) => (qIndex === 0 && selected === null ? dbQs : prev));
        setIsDbQuestion(isFromDb);
        setTotalDbCount(totalInDb);
      }
    } catch (err) {
      console.warn('[QuizScreen] Question fetch notice:', err);
    }
  }, [category, targetCount, qIndex, selected]);

  useEffect(() => {
    loadDbQuestions();
  }, [loadDbQuestions]);

  const currentQ = questions[qIndex] || questions[0];
  const isAnswered = selected !== null;
  const isLastQ = qIndex >= (questions.length || 1) - 1;

  const handleAnswer = (idx) => {
    if (isAnswered) return;
    setSelected(idx);
    const isCorrect = idx === currentQ.answer;
    setAnswers(prev => [...prev, {
      question: currentQ.q,
      options: currentQ.options,
      explanation: currentQ.explanation,
      selected: idx,
      correct: currentQ.answer,
      isCorrect
    }]);
  };

  // Timer Countdown
  useEffect(() => {
    if (!timed || isAnswered || phase !== 'quiz') return;
    if (timer <= 0) {
      handleAnswer(-1); // Timed out
      return;
    }
    const t = setTimeout(() => setTimer(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timer, timed, isAnswered, phase]);

  // Reset timer on question change
  useEffect(() => {
    setTimer(TIMED_SECS);
    setSelected(null);
  }, [qIndex]);

  const handleNext = () => {
    if (isLastQ) {
      try {
        if (!xpAwardedRef.current) {
          xpAwardedRef.current = true;
          const correctCount = answers.filter(a => a?.isCorrect).length;
          const totalQs = Math.max(1, questions.length || answers.length || 5);
          const baseXP = isDailyChallenge ? 50 : 35;
          const xpEarned = Math.round((correctCount / totalQs) * baseXP);
          if (xpEarned > 0 && typeof addXP === 'function') {
            try { addXP(xpEarned); } catch (e) { console.warn('addXP error:', e); }
          }
          if (typeof recordQuizResult === 'function') {
            try {
              recordQuizResult({
                category,
                score: correctCount,
                total: totalQs,
                xpEarned,
              });
            } catch (e) { console.warn('recordQuizResult error:', e); }
          }
        }
      } catch (err) {
        console.warn('Scoring calculation notice:', err);
      }
      setPhase('results');
    } else {
      setQIndex(i => i + 1);
    }
  };

  const handleRetry = async () => {
    xpAwardedRef.current = false;
    setAnswers([]);
    setSelected(null);
    setQIndex(0);
    setTimer(TIMED_SECS);

    try {
      const { questions: freshQs, isFromDb, totalInDb } = await fetchAptitudeQuestions({
        category,
        count: targetCount,
      });
      if (freshQs && freshQs.length > 0) {
        setQuestions(freshQs);
        setIsDbQuestion(isFromDb);
        setTotalDbCount(totalInDb);
      }
    } catch {
      setQuestions(getStaticFallbackQuestions(category, targetCount));
    }
    setPhase('quiz');
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = e.target.tagName ? e.target.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea') return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onComplete?.();
        return;
      }

      if (phase === 'results') {
        if (e.key === 'Enter' || e.key === ' ' || e.code === 'Space') {
          e.preventDefault();
          onComplete?.();
        }
        return;
      }

      if (!isAnswered) {
        let optIdx = -1;
        if (e.key === '1' || e.key === 'a' || e.key === 'A') optIdx = 0;
        else if (e.key === '2' || e.key === 'b' || e.key === 'B') optIdx = 1;
        else if (e.key === '3' || e.key === 'c' || e.key === 'C') optIdx = 2;
        else if (e.key === '4' || e.key === 'd' || e.key === 'D') optIdx = 3;

        if (optIdx >= 0 && optIdx < (currentQ.options?.length || 0)) {
          e.preventDefault();
          handleAnswer(optIdx);
        }
      } else {
        if (e.key === 'Enter' || e.key === ' ' || e.code === 'Space') {
          e.preventDefault();
          handleNext();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, isAnswered, currentQ, onComplete, handleNext, handleAnswer]);

  const timerPct = (timer / TIMED_SECS) * 100;
  const timerColor = timer > 15 ? 'var(--accent)' : timer > 7 ? 'var(--streak)' : 'var(--error)';

  if (phase === 'results') {
    const score = answers.filter(a => a?.isCorrect).length;
    const totalQs = Math.max(1, questions.length || answers.length || 5);
    const accuracy = Math.round((score / totalQs) * 100);
    const baseXP = isDailyChallenge ? 50 : 35;
    const xpEarned = Math.round((score / totalQs) * baseXP);

    return (
      <ResultsScreen
        score={score}
        total={totalQs}
        accuracy={accuracy}
        xpEarned={xpEarned}
        baseXP={baseXP}
        meta={meta}
        answers={answers}
        isDailyChallenge={isDailyChallenge}
        onRetry={handleRetry}
        onBack={onComplete}
      />
    );
  }

  return (
    <div className="quiz-screen" style={{ '--cat': meta.color }}>
      <div className="quiz-container">
        {/* ── Distraction-free Top Bar ── */}
        <header className="qs-header">
          <button
            type="button"
            className="qs-exit-btn"
            onClick={onComplete}
            aria-label="Exit Drill"
            title="Exit (Esc)"
          >
            <X size={18} />
          </button>

          <div className="qs-cat-pill">
            <Icon size={14} style={{ color: meta.color }} />
            <span>{meta.label}</span>
            {isDbQuestion && (
              <span className="qs-db-tag" title="Dynamic question loaded from Supabase">
                <Database size={10} /> Live DB
              </span>
            )}
          </div>

          <div className="qs-right-header">
            {timed && (
              <div className="qs-timer" style={{ color: timerColor }}>
                <Clock size={13} />
                <span>{timer}s</span>
              </div>
            )}
            <div className="qs-counter">
              <span>{qIndex + 1}</span>
              <span className="qs-counter-total">/{questions.length}</span>
            </div>
          </div>
        </header>

        {/* ── Progress & Timer Track ── */}
        {timed && (
          <div className="qs-timer-track">
            <div
              className="qs-timer-fill"
              style={{ width: `${timerPct}%`, background: timerColor }}
            />
          </div>
        )}

        {/* Question progress indicators */}
        <div className="qs-dots">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`qs-dot ${i < qIndex ? 'qs-dot--done' : i === qIndex ? 'qs-dot--active' : ''}`}
              style={i === qIndex ? { background: meta.color, boxShadow: `0 0 10px ${meta.color}` } : {}}
            />
          ))}
        </div>

        {/* ── Main Question Body ── */}
        <main className="qs-main">
          <div className="qs-question-box">
            <span className="qs-question-eyebrow">QUESTION {qIndex + 1}</span>
            <h1 className="qs-question-text">{currentQ.q}</h1>
          </div>

          <div className="qs-options-grid">
            {currentQ.options.map((opt, i) => {
              const isCorrectOpt = i === currentQ.answer;
              const isSelectedOpt = i === selected;
              let variant = '';
              if (isAnswered) {
                if (isCorrectOpt) variant = 'correct';
                else if (isSelectedOpt && !isCorrectOpt) variant = 'wrong';
                else variant = 'muted';
              }
              return (
                <button
                  key={i}
                  type="button"
                  className={`qs-option-btn ${isSelectedOpt ? 'qs-option--clicked' : ''} ${variant ? `qs-option--${variant}` : ''}`}
                  onClick={() => handleAnswer(i)}
                  disabled={isAnswered}
                >
                  <span className="qs-opt-key">{LABELS[i]}</span>
                  <span className="qs-opt-text">{opt}</span>
                  {isAnswered && isCorrectOpt && (
                    <CheckCircle2 size={18} className="qs-opt-icon text-success" />
                  )}
                  {isAnswered && isSelectedOpt && !isCorrectOpt && (
                    <XCircle size={18} className="qs-opt-icon text-error" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Step-by-Step Logic Explanation Card */}
          {isAnswered && (
            <div className={`qs-explanation-card ${selected === currentQ.answer ? 'qs-exp--correct' : 'qs-exp--wrong'}`}>
              <div className="qs-exp-header">
                {selected === currentQ.answer ? (
                  <>
                    <CheckCircle2 size={16} className="text-success" />
                    <span className="qs-exp-badge correct">Correct Solution</span>
                  </>
                ) : (
                  <>
                    <XCircle size={16} className="text-error" />
                    <span className="qs-exp-badge wrong">Incorrect — Conceptual Logic</span>
                  </>
                )}
              </div>
              <p className="qs-exp-text">{currentQ.explanation}</p>
            </div>
          )}
        </main>

        {/* Next Question / Finish Action */}
        {isAnswered && (
          <footer className="qs-footer">
            <button
              type="button"
              className="btn btn-primary btn-lg qs-next-action-btn"
              onClick={handleNext}
            >
              <span>{isLastQ ? 'Complete Drill & View Results' : 'Next Question'}</span>
              <ChevronRight size={18} />
            </button>
          </footer>
        )}
      </div>
    </div>
  );
}

/* ─── Results Screen with Mistake Review & Retry ────────────────── */
function ResultsScreen({
  score,
  total,
  accuracy,
  xpEarned,
  baseXP,
  meta,
  answers,
  isDailyChallenge,
  onRetry,
  onBack,
}) {
  const [copied, setCopied] = useState(false);
  const [reviewMistakesOpen, setReviewMistakesOpen] = useState(false);

  // Trigger celebratory confetti on high scores
  useEffect(() => {
    if (accuracy >= 60) {
      try {
        const fire = typeof confetti === 'function' ? confetti : (confetti?.default || null);
        if (typeof fire === 'function') {
          fire({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#2563EB', '#F59E0B', '#10B981', '#38BDF8'],
          });
        }
      } catch (err) {
        console.warn('Confetti launch notice:', err);
      }
    }
  }, [accuracy]);

  const getRating = () => {
    if (accuracy === 100) return { label: 'Flawless Performance', grade: 'S' };
    if (accuracy >= 80) return { label: 'Outstanding Accuracy', grade: 'A' };
    if (accuracy >= 60) return { label: 'Solid Performance', grade: 'B' };
    return { label: 'Good Practice Run', grade: 'C' };
  };

  const { label, grade } = getRating();
  const mistakes = answers.filter(a => !a.isCorrect);

  const handleShare = async () => {
    const text = `I scored ${score}/${total} (${accuracy}% accuracy) in ${meta.label} on MyAptitude!\n+${xpEarned} XP earned.\nPractice at https://nex-minds-beta.vercel.app/`;
    try {
      if (navigator.share) await navigator.share({ title: 'MyAptitude Score', text });
      else await navigator.clipboard.writeText(text);
    } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="quiz-screen quiz-results">
      <div className="results-card card card-glow">
        {/* Grade Ring */}
        <div className="results-grade-ring">
          <span className="results-grade">{grade}</span>
        </div>

        <h1 className="results-rating-title">{label}</h1>
        <p className="results-rating-sub">{meta.label} · {isDailyChallenge ? 'Daily Challenge' : 'Practice Drill'}</p>

        {/* Stats Row */}
        <div className="results-stats-grid">
          <div className="res-stat-item">
            <span className="res-stat-val">{score}/{total}</span>
            <span className="res-stat-lbl">Correct Answers</span>
          </div>
          <div className="res-stat-divider" />
          <div className="res-stat-item">
            <span className="res-stat-val">{accuracy}%</span>
            <span className="res-stat-lbl">Accuracy</span>
          </div>
          <div className="res-stat-divider" />
          <div className="res-stat-item">
            <span className="res-stat-val res-xp">+{xpEarned} XP</span>
            <span className="res-stat-lbl">XP Earned</span>
          </div>
        </div>

        {/* Question Chips Strip */}
        <div className="results-breakdown-section">
          <span className="results-breakdown-title">Session Summary</span>
          <div className="results-chips-row">
            {answers.map((a, i) => (
              <div
                key={i}
                className={`res-q-chip ${a.isCorrect ? 'res-q-chip--ok' : 'res-q-chip--fail'}`}
              >
                <span>Q{i + 1}</span>
                {a.isCorrect ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
              </div>
            ))}
          </div>
        </div>

        {/* Review Mistakes Dropdown / List */}
        {mistakes.length > 0 && (
          <div className="mistakes-review-box">
            <button
              type="button"
              className="mistakes-toggle-btn"
              onClick={() => setReviewMistakesOpen(!reviewMistakesOpen)}
            >
              <HelpCircle size={16} className="text-streak" />
              <span>Review {mistakes.length} Incorrect {mistakes.length === 1 ? 'Answer' : 'Answers'}</span>
              <ChevronRight
                size={16}
                style={{
                  transform: reviewMistakesOpen ? 'rotate(90deg)' : 'none',
                  transition: 'transform 0.2s',
                  marginLeft: 'auto'
                }}
              />
            </button>

            {reviewMistakesOpen && (
              <div className="mistakes-list">
                {mistakes.map((m, idx) => (
                  <div key={idx} className="mistake-item">
                    <p className="mistake-q">{m.question || 'Question'}</p>
                    <div className="mistake-answers-row">
                      <span className="mistake-your-ans">
                        Your answer: <strong>{Array.isArray(m.options) && m.selected >= 0 ? m.options[m.selected] : 'Timed out'}</strong>
                      </span>
                      <span className="mistake-correct-ans">
                        Correct: <strong>{Array.isArray(m.options) ? (m.options[m.correct] || m.options[0]) : 'Option'}</strong>
                      </span>
                    </div>
                    <p className="mistake-exp">{m.explanation || 'Verified derivation.'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="results-actions-row">
          <button
            type="button"
            className="btn btn-secondary btn-lg res-btn"
            onClick={onRetry}
          >
            <RotateCcw size={16} />
            <span>Retry Practice Drill</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-lg res-btn"
            onClick={handleShare}
          >
            <Share2 size={16} />
            <span>{copied ? 'Copied to Clipboard!' : 'Share Score'}</span>
          </button>

          <button
            type="button"
            className="btn btn-primary btn-lg res-btn"
            onClick={onBack}
          >
            <Home size={16} />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
}
