'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [greeting, setGreeting] = useState('Welcome back');

  useEffect(() => {
    if (session) router.replace('/');
  }, [session, router]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good Morning.');
    } else if (hour < 17) {
      setGreeting('Good Afternoon.');
    } else {
      setGreeting('Good Evening.');
    }
  }, []);

  if (status === 'loading') {
    return (
      <div className="login-split-page" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <span className="spinner spinner-lg" style={{ color: '#7c3aed' }} />
      </div>
    );
  }

  const handleSignIn = async () => {
    setLoading(true);
    try {
      await signIn('google', { callbackUrl: '/' });
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="login-split-page">
      {/* Left panel: Auth Form and Features */}
      <div className="login-auth-pane">
        <div className="login-auth-content">
          {/* Logo Header */}
          <div className="login-brand-header">
            <div className="login-logo-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                <path d="M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" opacity=".6" />
              </svg>
            </div>
            <span className="login-brand-name">DataPulse</span>
          </div>

          {/* Main Auth Wrap */}
          <div className="login-form-wrap">
            <h1 className="login-welcome-title">
              <span className="greeting-light">{greeting}</span>
              <span className="greeting-bold">Welcome back!</span>
            </h1>
            
            {/* Elegant Glass Features Card */}
            <div className="login-features-list">
              <div className="login-feature-item">
                <span className="feature-icon">📓</span>
                <div className="feature-text">
                  <span className="feature-title">Notebook-style CSV Viewer</span>
                  <span className="feature-desc">Inspect, filter, and sort your CSV endpoints in a unified, cell-based interface.</span>
                </div>
              </div>
              <div className="login-feature-item">
                <span className="feature-icon">🔔</span>
                <div className="feature-text">
                  <span className="feature-title">Automated Sync & Change Alerts</span>
                  <span className="feature-desc">Receive instant alerts and row/column count updates whenever endpoint data shifts.</span>
                </div>
              </div>
              <div className="login-feature-item">
                <span className="feature-icon">🔍</span>
                <div className="feature-text">
                  <span className="feature-title">Search, Sort & Tag Filters</span>
                  <span className="feature-desc">Organize and search your APIs easily with smart custom tag systems.</span>
                </div>
              </div>
              <div className="login-feature-item">
                <span className="feature-icon">📜</span>
                <div className="feature-text">
                  <span className="feature-title">Full Diff Changelogs</span>
                  <span className="feature-desc">Audit detailed modification histories with visual row and column comparisons.</span>
                </div>
              </div>
            </div>

            {/* Google Authentication Button */}
            <button
              id="google-signin-btn"
              className="login-google-btn"
              onClick={handleSignIn}
              disabled={loading}
            >
              {loading ? (
                <span className="spinner" style={{ borderTopColor: '#7c3aed' }} />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
              {loading ? 'Signing you in…' : 'Continue with Google'}
            </button>
          </div>

          {/* Footer branding */}
          <div className="login-auth-footer">
            <span className="secure-badge">🔒 Private by design</span>
            <p>Your endpoint requests are executed secure, isolated, and server-side.</p>
          </div>
        </div>
      </div>

      {/* Right panel: Showcase illustration (Data network diagram styled with theme colors) */}
      <div className="login-showcase-pane">
        <div className="showcase-glow showcase-glow-1" />
        <div className="showcase-glow showcase-glow-2" />
        <div className="showcase-grid" />

        <div className="network-illustration-container">
          <svg className="network-svg" viewBox="0 0 600 800" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="lineGrad" x1="0" y1="400" x2="600" y2="400" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.45" />
                <stop offset="60%" stopColor="var(--accent)" stopOpacity="0.25" />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Concentric rings */}
            <path d="M 0 280 A 120 120 0 0 1 0 520" stroke="rgba(255, 255, 255, 0.025)" strokeDasharray="4 4" strokeWidth="1.5" />
            <path d="M 0 160 A 240 240 0 0 1 0 640" stroke="rgba(255, 255, 255, 0.025)" strokeDasharray="6 6" strokeWidth="1.5" />
            <path d="M 0 40 A 360 360 0 0 1 0 760" stroke="rgba(255, 255, 255, 0.015)" strokeDasharray="8 8" strokeWidth="1.5" />
            <path d="M 0 -80 A 480 480 0 0 1 0 880" stroke="rgba(255, 255, 255, 0.01)" strokeDasharray="10 10" strokeWidth="1.5" />

            {/* Network Connections */}
            {/* Horizontal branch */}
            <path d="M 0 400 H 180 L 300 360 L 450 340 M 300 360 L 450 380 M 180 400 L 300 440 L 450 420 M 300 440 L 450 460" stroke="url(#lineGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

            {/* Upper 30deg branch */}
            <path d="M 0 400 L 160 300 L 280 220 L 400 180 M 280 220 L 400 240 M 160 300 L 280 320 L 400 300" stroke="url(#lineGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

            {/* Lower 30deg branch */}
            <path d="M 0 400 L 160 500 L 280 480 L 400 500 M 160 500 L 280 580 L 400 560 M 280 580 L 400 620" stroke="url(#lineGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

            {/* Upper 60deg branch */}
            <path d="M 0 400 L 120 200 L 220 120 L 320 80 M 220 120 L 320 140" stroke="url(#lineGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

            {/* Lower 60deg branch */}
            <path d="M 0 400 L 120 600 L 220 680 L 320 660 M 220 680 L 320 720" stroke="url(#lineGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

            {/* Hub node */}
            <circle cx="0" cy="400" r="16" fill="var(--primary)" opacity="0.15" />
            <circle cx="0" cy="400" r="6" fill="var(--primary)" />

            {/* Floating nodes with pulsate animation */}
            <circle cx="180" cy="400" r="5" fill="var(--primary)" className="pulse-node-purple" />
            <circle cx="300" cy="360" r="4.5" fill="var(--accent)" className="pulse-node-teal" />
            <circle cx="300" cy="440" r="4.5" fill="var(--accent)" className="pulse-node-teal" />
            <circle cx="450" cy="340" r="3.5" fill="#ffffff" className="pulse-node-white" />
            <circle cx="450" cy="380" r="3" fill="var(--accent)" />
            <circle cx="450" cy="420" r="3.5" fill="#ffffff" className="pulse-node-white" />
            <circle cx="450" cy="460" r="3" fill="var(--accent)" />

            <circle cx="160" cy="300" r="5" fill="var(--primary)" className="pulse-node-purple" />
            <circle cx="280" cy="220" r="4" fill="var(--accent)" />
            <circle cx="280" cy="320" r="4" fill="var(--accent)" className="pulse-node-teal" />
            <circle cx="400" cy="180" r="3" fill="var(--primary-light)" />
            <circle cx="400" cy="240" r="3.5" fill="var(--accent)" className="pulse-node-teal" />
            <circle cx="400" cy="300" r="3" fill="var(--primary-light)" />

            <circle cx="160" cy="500" r="5" fill="var(--primary)" className="pulse-node-purple" />
            <circle cx="280" cy="480" r="4" fill="var(--accent)" />
            <circle cx="280" cy="580" r="4" fill="var(--accent)" className="pulse-node-teal" />
            <circle cx="400" cy="500" r="3" fill="var(--accent)" />
            <circle cx="400" cy="560" r="3.5" fill="var(--primary-light)" className="pulse-node-purple" />
            <circle cx="400" cy="620" r="3" fill="var(--accent)" />

            <circle cx="120" cy="200" r="5" fill="var(--primary)" className="pulse-node-purple" />
            <circle cx="220" cy="120" r="4" fill="var(--accent)" className="pulse-node-teal" />
            <circle cx="320" cy="80" r="3" fill="var(--primary-light)" />
            <circle cx="320" cy="140" r="3" fill="var(--accent)" />

            <circle cx="120" cy="600" r="5" fill="var(--primary)" className="pulse-node-purple" />
            <circle cx="220" cy="680" r="4" fill="var(--accent)" className="pulse-node-teal" />
            <circle cx="320" cy="660" r="3" fill="var(--primary-light)" />
            <circle cx="320" cy="720" r="3" fill="var(--accent)" />
          </svg>
        </div>
      </div>
    </div>
  );
}
