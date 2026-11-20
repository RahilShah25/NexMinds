import { useState, useEffect } from 'react';
import {
  X, Brain, Target, ShieldCheck,
  Loader2, Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './AuthModal.css';

const TARGET_ROLES = [
  { id: 'student', label: 'College Student' },
  { id: 'swe', label: 'Software Engineer' },
  { id: 'cat', label: 'CAT Aspirant' },
  { id: 'gate', label: 'GATE / Tech Exam' },
  { id: 'upsc', label: 'UPSC / Govt Exam' },
];

/* ── Dedicated Google Sign-In Form ───────────────────────── */
function GoogleAuthForm({ onSuccess }) {
  const { loginWithGoogle } = useAuth();
  const [selectedRole, setSelectedRole] = useState(() => {
    try {
      return localStorage.getItem('myaptitude_selected_role') || 'student';
    } catch {
      return 'student';
    }
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    try {
      localStorage.setItem('myaptitude_selected_role', roleId);
    } catch {}
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await loginWithGoogle();
      const loggedUser = res?.user || res;
      if (loggedUser) {
        loggedUser.role = selectedRole;
        onSuccess(loggedUser);
      }
    } catch (err) {
      console.error('Google login error:', err);
      setErrorMsg(err.message || 'Unable to connect with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form-container" aria-label="Sign In with Google">
      {/* Brand Icon & Welcome */}
      <div className="auth-header text-center">
        <div className="auth-brand-icon">
          <Brain size={28} strokeWidth={2.5} />
        </div>
        <h2 className="auth-title">
          Sign In with Google
        </h2>
        <p className="auth-subtitle">
          Connect your Google account to access all practice modules, Smart Study AI tools, and performance tracking.
        </p>
      </div>

      {/* Target Focus Track Selector */}
      <div className="auth-role-section">
        <span className="auth-role-label">Choose Your Target Track:</span>
        <div className="auth-role-pills">
          {TARGET_ROLES.map((role) => (
            <button
              key={role.id}
              type="button"
              className={`auth-role-pill ${selectedRole === role.id ? 'active' : ''}`}
              onClick={() => handleRoleSelect(role.id)}
            >
              {selectedRole === role.id && <Check size={12} className="auth-role-check" />}
              <span>{role.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Error Message Alert */}
      {errorMsg && (
        <div className="auth-error-alert" role="alert">
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Primary Google Sign-In Action */}
      <button
        type="button"
        id="google-fast-login-btn"
        className="btn btn-google w-full auth-google-main-btn"
        onClick={handleGoogleLogin}
        disabled={loading}
      >
        {loading ? (
          <Loader2 size={20} className="auth-spinner" />
        ) : (
          <svg className="google-svg" width="22" height="22" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
        )}
        <span>{loading ? 'Connecting with Google...' : 'Sign In with Google'}</span>
      </button>

      {/* Trust & Privacy Footnote */}
      <div className="auth-footnote">
        <ShieldCheck size={14} className="text-success" />
        <span>Verified Google OAuth · Secure &amp; Instant Dashboard Access</span>
      </div>
    </div>
  );
}

/* ── Auth Modal Shell ──────────────────────────────── */
export default function AuthModal({
  onClose,
  onAuthSuccess,
}) {
  // Close on Escape key
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Prevent background scrolling
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="modal-backdrop"
      onClick={handleBackdropClick}
      role="presentation"
      id="auth-modal-backdrop"
    >
      <div
        className="auth-modal-panel card card-glow"
        role="dialog"
        aria-modal="true"
        aria-label="Sign In with Google Dialog"
      >
        {/* Close Button */}
        <button
          type="button"
          className="modal-close-btn auth-close-btn"
          onClick={onClose}
          aria-label="Close dialog"
          id="modal-close-btn"
        >
          <X size={18} />
        </button>

        <GoogleAuthForm onSuccess={onAuthSuccess} />
      </div>
    </div>
  );
}
