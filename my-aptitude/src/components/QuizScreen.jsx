import { useState, useEffect, useRef } from 'react';
import {
  X, CheckCircle2, XCircle, ChevronRight, Home, Clock, Share2, Sparkles,
  FastForward, Puzzle, Crown, Hash, Database, RotateCcw, HelpCircle,
  Award, ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { shuffleQuestionOptions } from '../lib/studyToolsAI';
import './QuizScreen.css';

/* ─── Static Question Bank ─────────────────────────────────── */
const QUESTIONS = {
  math: [
    { q: 'A car travels 120 km in 2 hours. What is its average speed?', options: ['50 km/h', '60 km/h', '70 km/h', '80 km/h'], answer: 1, explanation: 'Speed = Distance ÷ Time = 120 km ÷ 2 h = 60 km/h.' },
    { q: 'What is 15% of 240 calculated mentally?', options: ['32', '36', '40', '48'], answer: 1, explanation: '10% of 240 = 24. 5% = 12. Sum: 24 + 12 = 36.' },
    { q: '5 workers finish a job in 8 days. How long will 10 workers take?', options: ['6 days', '4 days', '3 days', '5 days'], answer: 1, explanation: 'Total work = 5 × 8 = 40 man-days. For 10 workers: 40 ÷ 10 = 4 days.' },
    { q: 'A 200m train moves at 54 km/h. How many seconds to cross a signal pole?', options: ['10 sec', '12 sec', '13.3 sec', '15 sec'], answer: 2, explanation: '54 km/h = 54 × (5/18) = 15 m/s. Time = 200 ÷ 15 ≈ 13.3 seconds.' },
    { q: 'Goods marked 25% above cost are sold at a 10% discount. What is the net profit %?', options: ['10%', '12.5%', '15%', '20%'], answer: 1, explanation: 'SP = 1.25 × 0.9 × CP = 1.125 CP → Net profit is 12.5%.' },
  ],
  puzzle: [
    { q: 'What comes next in the geometric progression: 2, 4, 8, 16, __ ?', options: ['24', '28', '32', '36'], answer: 2, explanation: 'Each term is multiplied by 2: 16 × 2 = 32.' },
    { q: 'Find the missing square in the series: 1, 4, 9, 16, 25, __ ?', options: ['30', '35', '36', '40'], answer: 2, explanation: 'Consecutive integer squares: 1², 2², 3², 4², 5², 6² = 36.' },
    { q: 'Which value fills the blank? 3, 6, 11, 18, 27, __ ?', options: ['36', '38', '40', '35'], answer: 1, explanation: 'Differences are odd primes: +3, +5, +7, +9, +11 → 27 + 11 = 38.' },
    { q: 'Letter sequence: A, C, F, J, O, __ ?', options: ['T', 'U', 'V', 'W'], answer: 1, explanation: 'Alphabet increments: +2, +3, +4, +5, +6 → O(15) + 6 = U(21).' },
    { q: 'Identify the odd element out: 4, 8, 12, 15, 16', options: ['4', '8', '12', '15'], answer: 3, explanation: '15 is not divisible by 4, whereas 4, 8, 12, and 16 are all multiples of 4.' },
  ],
  logic: [
    { q: 'All cats are animals. Some animals are pets.\nConclusion: "Some cats are pets" is:', options: ['Definitely True', 'Definitely False', 'Cannot be determined', 'Always False'], answer: 2, explanation: 'The pet subset may not intersect with the feline subset. We cannot logically conclude.' },
    { q: 'If A > B and B > C, what is the relation between A and C?', options: ['A < C', 'A = C', 'A > C', 'Cannot say'], answer: 2, explanation: 'By the transitive property of inequality: A > B > C → A > C.' },
    { q: 'Ram is taller than Shyam. Mohan is shorter than Shyam. Who is tallest?', options: ['Shyam', 'Mohan', 'Ram', 'Cannot say'], answer: 2, explanation: 'Ordering from tallest to shortest: Ram > Shyam > Mohan. Ram is the tallest.' },
    { q: 'All roses are flowers. Some flowers are red.\nConclusion: "Some roses are red" is:', options: ['True', 'Maybe True', 'False', 'Cannot say'], answer: 3, explanation: 'Red flowers could exist entirely outside of roses. The conclusion cannot be firmly drawn.' },
    { q: 'P is the father of Q. Q is the sister of R. What is P to R?', options: ['Uncle', 'Brother', 'Father', 'Grandfather'], answer: 2, explanation: 'Q and R are siblings. Since P is the father of Q, P is also the father of R.' },
  ],
  memory: [
    { q: 'What is the next prime number immediately following 13?', options: ['15', '16', '17', '19'], answer: 2, explanation: '14 is composite (2×7), 15 is composite (3×5), 16 is composite (4×4). 17 has only 1 and 17 as factors.' },
    { q: 'What is the square root of 2025?', options: ['40', '42', '45', '50'], answer: 2, explanation: '45 × 45 = 2025 (4 × 5 = 20, 5 × 5 = 25).' },
    { q: 'Solve the algebraic equation for x: 3x + 7 = 22', options: ['4', '5', '6', '3'], answer: 1, explanation: '3x = 22 − 7 = 15 → x = 15 ÷ 3 = 5.' },
    { q: 'What is the Lowest Common Multiple (LCM) of 4, 6, and 8?', options: ['16', '24', '48', '12'], answer: 1, explanation: 'Prime factors: 4=2², 6=2×3, 8=2³. LCM = 2³ × 3 = 24.' },
    { q: 'Mental math: 256 × 0.25 = ?', options: ['54', '60', '64', '68'], answer: 2, explanation: 'Multiplying by 0.25 is equivalent to dividing by 4: 256 ÷ 4 = 64.' },
  ],
};

QUESTIONS.quantitative = QUESTIONS.math;
QUESTIONS.pattern = QUESTIONS.puzzle;
QUESTIONS.logical = QUESTIONS.logic;
QUESTIONS.numerical = QUESTIONS.memory;

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
  const timed = config?.timed ?? true;
  const isDailyChallenge = config?.isDailyChallenge ?? false;

  const rawMeta = CAT_META[category] || CAT_META.math;
  const meta = { ...rawMeta };
  const Icon = meta.icon;

  const getInitialQuestions = (cat) => {
    return (QUESTIONS[cat] && QUESTIONS[cat].length > 0)
      ? QUESTIONS[cat]
      : (QUESTIONS.math || []);
  };

  const [questions, setQuestions] = useState(() => shuffleQuestionOptions(getInitialQuestions(category)));
  const [isDbQuestion, setIsDbQuestion] = useState(false);
  const xpAwardedRef = useRef(false);

  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [timer, setTimer] = useState(TIMED_SECS);
  const [phase, setPhase] = useState('quiz'); // 'quiz' | 'results'

  // Fetch Supabase DB questions dynamically
  useEffect(() => {
    let isMounted = true;
    const fetchDbQuestions = async () => {
      if (!isSupabaseConfigured()) return;
      try {
        const cat = category.toLowerCase();
        const validCats = [cat];
        if (cat === 'math' || cat === 'quantitative') validCats.push('math', 'quantitative');
        if (cat === 'puzzle' || cat === 'pattern') validCats.push('puzzle', 'pattern');
        if (cat === 'logic' || cat === 'logical') validCats.push('logic', 'logical');
        if (cat === 'memory' || cat === 'numerical') validCats.push('memory', 'numerical');

        const { data, error } = await supabase
          .from('questions')
          .select('*')
          .in('category', validCats)
          .limit(30);

        if (error) return;

        if (data && data.length > 0 && isMounted) {
          const parsed = data
            .map(row => ({
              id: row.id,
              q: row.question || row.q,
              options: Array.isArray(row.options)
                ? row.options
                : (typeof row.options === 'string' ? JSON.parse(row.options) : []),
              answer: typeof row.answer_index === 'number'
                ? row.answer_index
                : (typeof row.answer === 'number' ? row.answer : 0),
              explanation: row.explanation || '',
              difficulty: row.difficulty || 'medium',
              isFromDb: true,
            }))
            .filter(item => item.q && Array.isArray(item.options) && item.options.length >= 2);

          if (parsed.length > 0 && isMounted) {
            const shuffled = shuffleQuestionOptions([...parsed].sort(() => 0.5 - Math.random()).slice(0, 5));
            setQuestions(prev => (qIndex === 0 && selected === null ? shuffled : prev));
            setIsDbQuestion(true);
          }
        }
      } catch (err) {
        console.warn('DB Questions fetch notice:', err);
      }
    };

    fetchDbQuestions();
    return () => { isMounted = false; };
  }, [category]);

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

  const handleRetry = () => {
    xpAwardedRef.current = false;
    setAnswers([]);
    setSelected(null);
    setQIndex(0);
    setTimer(TIMED_SECS);
    setQuestions(shuffleQuestionOptions(getInitialQuestions(category)));
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
