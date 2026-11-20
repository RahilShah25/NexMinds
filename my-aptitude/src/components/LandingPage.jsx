import { useState, useEffect, useRef } from 'react';
import {
  Brain, Zap, Target, TrendingUp, ChevronRight,
  Star, Users, Clock, Award, ArrowRight,
  BarChart2, Shield, Flame, CheckCircle2,
  FastForward, Puzzle, Crown, Hash, Sparkles,
  FileText, Play, Layers, Trophy
} from 'lucide-react';
import './LandingPage.css';

const CATEGORIES = [
  {
    id: 'math',
    label: 'Quantitative Aptitude',
    shortName: 'Math Sprint',
    icon: FastForward,
    color: '#F59E0B',
    count: '240+ Problems',
    topics: ['Percentages & Ratios', 'Time, Speed & Distance', 'Work Kinetics', 'Profit & Loss'],
    sampleQ: 'A train moves at 54 km/h. How long to cross a 200m platform?',
  },
  {
    id: 'puzzle',
    label: 'Pattern Recognition',
    shortName: 'Spatial Matrix',
    icon: Puzzle,
    color: '#0284C7',
    count: '180+ Problems',
    topics: ['Matrix Completion', 'Spatial Rotation', 'Sequence Folding', 'Analogy Inversion'],
    sampleQ: 'Find the missing sequence: 1, 4, 9, 16, 25, __ ?',
  },
  {
    id: 'logic',
    label: 'Logical Reasoning',
    shortName: 'Deduction & Logic',
    icon: Crown,
    color: '#10B981',
    count: '210+ Problems',
    topics: ['Syllogisms & Logic', 'Blood Relations', 'Seating Arrangements', 'Conditionals'],
    sampleQ: 'If all A are B and some B are C, can we conclude some A are C?',
  },
  {
    id: 'memory',
    label: 'Numerical Agility',
    shortName: 'Series Velocity',
    icon: Hash,
    color: '#38BDF8',
    count: '160+ Problems',
    topics: ['Missing Digits', 'Prime Intervals', 'Mental Approximation', 'Fast Arithmetic'],
    sampleQ: 'What is the square root of 2025 computed mentally?',
  },
];

const STEPS = [
  {
    step: '01',
    title: 'Baseline Diagnostic',
    desc: 'Select your target assessment module. The adaptive rating engine benchmarks your starting performance rating across 4 cognitive domains.',
    icon: Target,
  },
  {
    step: '02',
    title: 'Adaptive Blitz Drills',
    desc: 'Solve high-yield 2-minute sprints. The question engine dynamically tunes difficulty right at your edge of learning.',
    icon: Zap,
  },
  {
    step: '03',
    title: 'Mastery & Leaderboards',
    desc: 'Earn XP, defend your daily streak, unlock honor badges, and climb competitive peer leaderboards.',
    icon: Trophy,
  },
];

const STATS = [
  { value: '750+', label: 'Curated Challenges', sub: 'Continuously updated' },
  { value: '10k+', label: 'Active Thinkers', sub: 'Global community' },
  { value: '99.4%', label: 'Exam Success Rate', sub: 'Reported by alumni' },
  { value: '< 3m', label: 'Daily Session Time', sub: 'High retention format' },
];

const TESTIMONIALS = [
  {
    name: 'Aarav Mehta',
    role: 'CAT 99.4%ile & IIM-A Admit',
    avatar: 'AM',
    text: 'MyAptitude turned speed math from a dread into my competitive advantage. The instant explanations and streak multipliers kept me addicted.',
  },
  {
    name: 'Priya Sundaram',
    role: 'Software Engineer @ Microsoft',
    avatar: 'PS',
    text: 'The pattern recognition and logical deduction sprints matched the exact style of top tech coding OA cognitive rounds. Absolutely indispensable.',
  },
  {
    name: 'Kavya Nair',
    role: 'GATE AIR 42 Ranker',
    avatar: 'KN',
    text: 'The Document Study Tool is insane. I uploaded my university slides and got tailored 15-question MCQs and cheatsheets in under 10 seconds.',
  },
];

export default function LandingPage({ onLogin, onSignup }) {
  const [activeCategory, setActiveCategory] = useState(0);
  const heroRef = useRef(null);

  // Smooth mouse gradient tracking
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const handleMove = (e) => {
      const { clientX, clientY } = e;
      const { width, height, left, top } = hero.getBoundingClientRect();
      const x = ((clientX - left) / width - 0.5) * 40;
      const y = ((clientY - top) / height - 0.5) * 30;
      hero.style.setProperty('--mouse-x', `${x}px`);
      hero.style.setProperty('--mouse-y', `${y}px`);
    };
    hero.addEventListener('mousemove', handleMove, { passive: true });
    return () => hero.removeEventListener('mousemove', handleMove);
  }, []);

  return (
    <main className="landing" aria-label="MyAptitude landing page">
      {/* Background Ambience */}
      <div className="landing-ambient-glow landing-ambient-glow--cobalt" aria-hidden="true" />
      <div className="landing-ambient-glow landing-ambient-glow--cyan" aria-hidden="true" />
      <div className="landing-grid-pattern" aria-hidden="true" />

      {/* ── 1. HERO SECTION ─────────────────────────────────── */}
      <section className="hero-section" ref={heroRef} id="hero">
        <div className="container hero-container">
          <div className="hero-text-col">
            {/* Live Launch Badge */}
            <div className="hero-badge" onClick={onSignup} role="button" tabIndex={0}>
              <span className="badge-dot" />
              <span>Next-Gen Cognitive Engine Live</span>
              <ChevronRight size={14} className="hero-badge-arrow" />
            </div>

            {/* Main Headline */}
            <h1 className="hero-title">
              Master Aptitude.<br />
              <span className="hero-title-gradient">Accelerate Your Mind.</span>
            </h1>

            {/* Subheading */}
            <p className="hero-subtitle">
              The high-velocity cognitive training platform engineered for CAT, GATE,
              top tech interviews, and competitive exams. Sign in with Google to unlock
              interactive problem modules, AI study tools, and live Elo rating benchmarks.
            </p>

            {/* Google Authentication CTA */}
            <div className="hero-cta-group">
              <button
                id="hero-start-btn"
                type="button"
                className="btn btn-primary btn-xl hero-main-btn"
                onClick={onLogin}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Sign In with Google</span>
                <ArrowRight size={18} />
              </button>
            </div>

            {/* Trust and Social Proof Badges */}
            <div className="hero-trust-row">
              <div className="trust-item">
                <CheckCircle2 size={16} className="trust-icon" />
                <span>Google OAuth Verification</span>
              </div>
              <div className="trust-separator" />
              <div className="trust-item">
                <CheckCircle2 size={16} className="trust-icon" />
                <span>Zero Guest Mode</span>
              </div>
              <div className="trust-separator" />
              <div className="trust-item">
                <CheckCircle2 size={16} className="trust-icon" />
                <span>Instant Cloud Sync</span>
              </div>
            </div>
          </div>

          {/* Gated Platform Access Visual Card */}
          <div className="hero-visual-col">
            <div className="hero-card card card-glow hero-locked-card">
              <div className="hero-card-header locked-header-row">
                <div className="hero-card-dots">
                  <span className="dot dot--red" />
                  <span className="dot dot--yellow" />
                  <span className="dot dot--green" />
                </div>
                <div className="locked-badge">
                  <span>Sign In Required</span>
                </div>
              </div>

              <div className="hero-card-body locked-card-body">
                <div className="locked-icon-wrap">
                  <Brain size={26} />
                </div>
                <h3 className="locked-title">All In-App Features Gated</h3>
                <p className="locked-desc">
                  To protect competition integrity and track genuine skill Elo ratings, all practice sprints,
                  AI Document Vision tools, and handbooks require an active account.
                </p>

                <div className="locked-features-list">
                  <div className="locked-feat-item" onClick={onLogin} role="button" tabIndex={0}>
                    <span>Quantitative, Logic &amp; Pattern Modules</span>
                    <span className="locked-tag">Gated</span>
                  </div>
                  <div className="locked-feat-item" onClick={onLogin} role="button" tabIndex={0}>
                    <span>Smart Study Hub (AI Vision &amp; 10–20 MCQs)</span>
                    <span className="locked-tag">Gated</span>
                  </div>
                  <div className="locked-feat-item" onClick={onLogin} role="button" tabIndex={0}>
                    <span>Formula Handbooks &amp; Proofs</span>
                    <span className="locked-tag">Gated</span>
                  </div>
                  <div className="locked-feat-item" onClick={onLogin} role="button" tabIndex={0}>
                    <span>Dynamic Elo Ratings &amp; Leaderboards</span>
                    <span className="locked-tag">Gated</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-primary w-full mt-2"
                  onClick={onLogin}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Sign In with Google to Unlock</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. METRICS / STATS STRIP ────────────────────────── */}
      <section className="stats-strip" id="stats-strip" aria-label="Platform metrics">
        <div className="container">
          <div className="stats-grid">
            {STATS.map((stat) => (
              <div key={stat.label} className="stat-card card">
                <p className="stat-number">{stat.value}</p>
                <p className="stat-title">{stat.label}</p>
                <p className="stat-sub">{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. FOUR APTITUDE MODULES OVERVIEW ───────────────── */}
      <div id="features" style={{ position: 'relative', top: '-70px' }} />
      <section className="categories-section" id="categories" aria-label="Aptitude categories">
        <div className="container">
          <div className="section-head text-center">
            <span className="badge badge-accent">Core Curriculum</span>
            <h2 className="section-title">
              Four Specialized Pillars.<br />
              <span className="text-accent">Zero Weak Spots.</span>
            </h2>
            <p className="section-desc">
              From speed mental calculation to complex deductive matrices,
              train the exact cognitive pathways tested in competitive benchmarks.
            </p>
          </div>

          <div className="categories-grid">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <div
                  key={cat.id}
                  className="cat-card card card-interactive"
                  onClick={onLogin}
                  role="button"
                  tabIndex={0}
                  style={{ '--cat-color': cat.color }}
                >
                  <div className="cat-card-top">
                    <div className="cat-icon-wrap" style={{ background: `${cat.color}18`, color: cat.color }}>
                      <Icon size={24} />
                    </div>
                    <span className="cat-count-badge">{cat.count}</span>
                  </div>

                  <h3 className="cat-card-title">{cat.label}</h3>
                  <p className="cat-card-sub">{cat.shortName}</p>

                  <div className="cat-topics-list">
                    {cat.topics.map((t) => (
                      <span key={t} className="cat-topic-pill">
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="cat-card-footer">
                    <span className="cat-practice-action">
                      <span>Sign In to Access Module</span>
                      <ChevronRight size={16} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 4. HOW IT WORKS IN 3 STEPS ──────────────────────── */}
      <section className="how-it-works-section" id="how-it-works" aria-label="How it works">
        <div className="container">
          <div className="section-head text-center">
            <span className="badge badge-streak">The Learning Loop</span>
            <h2 className="section-title">
              Designed for Flow.<br />
              <span className="text-accent">Engineered for Results.</span>
            </h2>
            <p className="section-desc">
              A high-density training cycle that turns 5 minutes of daily practice
              into measurable cognitive gains.
            </p>
          </div>

          <div className="steps-grid">
            {STEPS.map((step) => {
              const StepIcon = step.icon;
              return (
                <div key={step.step} className="step-card card">
                  <div className="step-number-row">
                    <span className="step-number">{step.step}</span>
                    <div className="step-icon-badge">
                      <StepIcon size={20} className="text-accent" />
                    </div>
                  </div>
                  <h3 className="step-title">{step.title}</h3>
                  <p className="step-desc">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 5. AI DOCUMENT STUDY HUB SPOTLIGHT ──────────────── */}
      <section className="smart-hub-spotlight" id="smart-hub">
        <div className="container">
          <div className="smart-hub-card card card-glow">
            <div className="smart-hub-grid">
              <div className="smart-hub-content">
                <span className="badge badge-accent">
                  <Sparkles size={12} /> Powered by Gemini AI
                </span>
                <h2 className="smart-hub-title">
                  Turn Any Syllabus or Notes<br />
                  Into an Instant Practice Module.
                </h2>
                <p className="smart-hub-desc">
                  Upload lecture slides, PDF textbooks, or syllabus sheets.
                  Our client-side document parser extracts core topics and generates
                  adaptive 10–20 question MCQs, printable cheatsheets, and interactive flashcards.
                </p>

                <div className="smart-hub-features">
                  <div className="sh-feat">
                    <CheckCircle2 size={16} className="text-success" />
                    <span>Instant 10–20 MCQ generation with diagram vision</span>
                  </div>
                  <div className="sh-feat">
                    <CheckCircle2 size={16} className="text-success" />
                    <span>Direct vector PDF export for offline revision</span>
                  </div>
                  <div className="sh-feat">
                    <CheckCircle2 size={16} className="text-success" />
                    <span>Active recall flashcards &amp; interactive mind maps</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-primary btn-lg smart-hub-cta"
                  onClick={onLogin}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Sign In with Google for Smart Study Hub</span>
                </button>
              </div>

              <div className="smart-hub-preview-col">
                <div className="sh-preview-window">
                  <div className="sh-preview-header">
                    <FileText size={16} className="text-accent-light" />
                    <span>Document Intelligence Engine Preview</span>
                  </div>
                  <div className="sh-preview-tools">
                    <div className="sh-tool-pill active">10–20 Concept MCQs</div>
                    <div className="sh-tool-pill">Cheatsheet PDF</div>
                    <div className="sh-tool-pill">Active Recall</div>
                  </div>
                  <div className="sh-preview-box text-center" style={{ padding: '36px 20px' }}>
                    <div className="locked-icon-wrap" style={{ margin: '0 auto 14px' }}>
                      <Brain size={24} />
                    </div>
                    <h4 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700 }}>Tool Locked Behind Sign In</h4>
                    <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--text-muted)' }}>
                      Log in to upload PowerPoint slides, PDFs, or images for AI diagram analysis and custom MCQ generation.
                    </p>
                    <button type="button" className="btn btn-sm btn-secondary" onClick={onLogin}>
                      Sign In with Google to Upload
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. TESTIMONIALS ─────────────────────────────────── */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-head text-center">
            <span className="badge badge-accent">Learner Proof</span>
            <h2 className="section-title">
              Trusted by Ambitious Thinkers.
            </h2>
            <p className="section-desc">
              Here is how students and professionals sharpen their edge with MyAptitude.
            </p>
          </div>

          <div className="testimonials-grid">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="testimonial-card card">
                <div className="t-stars">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={15} fill="#F59E0B" color="#F59E0B" />
                  ))}
                </div>
                <p className="t-text">&ldquo;{t.text}&rdquo;</p>
                <div className="t-author">
                  <div className="t-avatar">{t.avatar}</div>
                  <div>
                    <h4 className="t-name">{t.name}</h4>
                    <p className="t-role">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. FINAL HIGH-CONVERSION CTA ────────────────────── */}
      <section className="final-cta-section" id="cta">
        <div className="container">
          <div className="final-cta-card card card-glow text-center">
            <div className="final-cta-glow" aria-hidden="true" />
            <span className="badge badge-accent">Secure Platform Access</span>
            <h2 className="final-cta-title">
              Ready to Outthink the Competition?
            </h2>
            <p className="final-cta-desc">
              Join thousands of learners building sharper minds every single day.
              Sign in with your Google account to get instant access.
            </p>
            <div className="final-cta-buttons">
              <button
                type="button"
                className="btn btn-primary btn-xl"
                onClick={onLogin}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Sign In with Google to Start Practicing</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. LANDING FOOTER ───────────────────────────────── */}
      <footer className="landing-footer">
        <div className="container">
          <div className="landing-footer-grid">
            <div className="l-footer-col l-footer-col--brand">
              <div className="navbar-logo">
                <div className="logo-icon">
                  <Brain size={20} strokeWidth={2.5} />
                </div>
                <span className="logo-text">
                  My<span className="logo-accent">Aptitude</span>
                </span>
              </div>
              <p className="l-footer-tagline">
                Premium adaptive aptitude training &amp; cognitive intelligence platform.
                Built for serious exam prep and competitive problem solvers.
              </p>
              <p className="l-footer-subtext">
                Powered by React, Supabase &amp; Google Gemini AI.
              </p>
            </div>

            <div className="l-footer-col">
              <h4 className="l-footer-heading">Platform Access</h4>
              <ul className="l-footer-list">
                <li><button type="button" onClick={onLogin}>Sign In with Google</button></li>
                <li><a href="#hero">Back to Top</a></li>
              </ul>
            </div>

            <div className="l-footer-col">
              <h4 className="l-footer-heading">Security &amp; Policy</h4>
              <ul className="l-footer-list">
                <li><span>Verified Cloud Sync</span></li>
                <li><span>Zero Guest Mode</span></li>
                <li><span>Fair Competition Standards</span></li>
              </ul>
            </div>
          </div>

          <div className="landing-footer-bottom">
            <p>© {new Date().getFullYear()} MyAptitude (NexMinds). All rights reserved.</p>
            <p className="l-footer-note">Authenticated Access Only.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
