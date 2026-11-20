import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import AuthModal from './components/AuthModal';
import Dashboard from './components/Dashboard';

/**
 * Inner app — has access to auth context.
 * Gated: Features are strictly inaccessible without logging in.
 * Authentication is exclusively Google OAuth / Sign In with Google.
 */
function AppInner() {
  const { user, login } = useAuth();

  // Auth modal visibility state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [initialView, setInitialView] = useState('dashboard');

  const openAuth = () => setIsAuthOpen(true);
  const closeAuth = () => setIsAuthOpen(false);

  const handleAuthSuccess = (userData) => {
    login(userData);
    closeAuth();
  };

  // If user is authenticated, render full in-app dashboard with active features
  if (user) {
    return <Dashboard initialView={initialView} />;
  }

  // When unauthenticated, show public landing page with zero exposed in-app features
  return (
    <>
      {/* Public Navigation — brand logo and Sign In with Google */}
      <Navbar
        onLogin={openAuth}
        onSignup={openAuth}
      />

      {/* Public Landing / Home page — intro only, all features locked behind authentication */}
      <LandingPage
        onLogin={openAuth}
        onSignup={openAuth}
      />

      {/* Google Auth Modal (conditionally rendered) */}
      {isAuthOpen && (
        <AuthModal
          onClose={closeAuth}
          onAuthSuccess={handleAuthSuccess}
        />
      )}
    </>
  );
}

/**
 * Root App — wraps everything in providers.
 */
export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
