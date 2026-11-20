import { useState, useEffect } from 'react';
import { X, Play, Clock, Zap, Flame, FastForward, Puzzle, Crown, Hash } from 'lucide-react';
import './PracticeModal.css';

// Maps category id → display info
const CAT_META = {
  math:        { label: 'Math Sprint',        icon: FastForward, color: '#FF9500' },
  quantitative:{ label: 'Math Sprint',        icon: FastForward, color: '#FF9500' },
  puzzle:      { label: 'Pattern Recognition', icon: Puzzle,      color: '#0284C7' },
  pattern:     { label: 'Pattern Recognition', icon: Puzzle,      color: '#0284C7' },
  logic:       { label: 'Logical Reasoning',   icon: Crown,       color: '#10B981' },
  logical:     { label: 'Logical Reasoning',   icon: Crown,       color: '#10B981' },
  memory:      { label: 'Numerical Agility',  icon: Hash,        color: '#38BDF8' },
  numerical:   { label: 'Numerical Agility',  icon: Hash,        color: '#38BDF8' },
};

export default function PracticeModal({
  isOpen,
  onClose,
  initialCategory = 'math',
  isDailyChallenge = false,
  onLaunchPractice,
}) {
  const [timed, setTimed] = useState(true);
  const [questionCount, setQuestionCount] = useState(5);
  const [launching, setLaunching] = useState(false);

  const meta = CAT_META[initialCategory] || CAT_META['math'];
  const Icon = meta.icon;
  const xpReward = isDailyChallenge ? 50 : Math.round(35 * (questionCount / 5));

  const handleLaunch = () => {
    setLaunching(true);
    setTimeout(() => {
      setLaunching(false);
      onClose();
      onLaunchPractice?.({ category: initialCategory, count: questionCount, timed, isDailyChallenge });
    }, 400);
  };

  useEffect(() => {
    if (!isOpen || launching) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
      } else if (e.key === 'Enter' || e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        handleLaunch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, launching, timed, initialCategory, isDailyChallenge]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} aria-hidden="true">
      <div
        className="practice-setup-modal card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="practice-modal-title"
      >
        {/* Header */}
        <div className="pm-header">
          <div className="pm-cat-tag" style={{ color: meta.color, borderColor: `${meta.color}40`, background: `${meta.color}12` }}>
            <Icon size={14} />
            <span>{isDailyChallenge ? 'Daily Challenge' : 'Practice'}</span>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {launching ? (
          <div className="pm-launching">
            <div className="pm-launch-icon" style={{ borderColor: `${meta.color}60`, background: `${meta.color}14` }}>
              <Zap size={28} style={{ color: meta.color }} />
            </div>
            <p className="pm-launch-text">Loading questions…</p>
            <div className="progress-bar progress-bar--sm" style={{ width: '100%', marginTop: 10 }}>
              <div className="progress-fill" style={{ width: '100%', background: meta.color, animation: 'fillProgress 1s ease' }} />
            </div>
          </div>
        ) : (
          <div className="pm-body">
            {/* Category hero */}
            <div className="pm-cat-hero" style={{ borderColor: `${meta.color}30` }}>
              <div className="pm-cat-icon" style={{ background: `${meta.color}18`, color: meta.color }}>
                <Icon size={24} />
              </div>
              <div className="pm-cat-info">
                <h2 id="practice-modal-title" className="pm-cat-name">{meta.label}</h2>
                <span className="pm-cat-sub">{questionCount} Questions • Supabase Dynamic Bank</span>
              </div>
            </div>

            {/* Question count selector */}
            <div className="pm-count-section">
              <span className="pm-count-title">Number of Questions:</span>
              <div className="pm-count-chips">
                {[5, 10, 15].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    className={`pm-count-chip ${questionCount === cnt ? 'active' : ''}`}
                    onClick={() => setQuestionCount(cnt)}
                  >
                    {cnt} Questions
                  </button>
                ))}
              </div>
            </div>

            {/* Timer toggle */}
            <button
              type="button"
              className="pm-timer-btn"
              style={timed ? {
                color: '#C6FF45',
                borderColor: 'rgba(198,255,69,0.35)',
                background: 'rgba(198,255,69,0.06)'
              } : {}}
              onClick={() => setTimed(!timed)}
            >
              <Clock size={14} />
              <span>{timed ? 'Timed Mode' : 'Zen Mode (Untimed)'}</span>
              <span className="pm-timer-status">{timed ? 'ON' : 'OFF'}</span>
            </button>

            {/* Reward row */}
            <div className="pm-reward-row">
              <span className="pm-reward-xp">
                <Zap size={13} className="text-lime" />
                +{xpReward} XP
              </span>
              {isDailyChallenge && (
                <span className="pm-reward-bonus">
                  <Flame size={13} /> 1.5× Daily Bonus
                </span>
              )}
            </div>

            {/* Launch */}
            <button
              id="confirm-launch-practice-btn"
              type="button"
              className="pm-launch-btn"
              style={{ '--cat-color': meta.color }}
              onClick={handleLaunch}
            >
              <Play size={15} fill="#0A0A0A" />
              <span>Start Session</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
