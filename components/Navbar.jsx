'use client';

import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';

export default function Navbar({ updateCount = 0, onShowNotification }) {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handle(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  return (
    <nav className="navbar">
      {/* Brand */}
      <a href="/" className="navbar-brand">
        <div className="navbar-logo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            <path d="M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12" opacity=".6" />
          </svg>
        </div>
        <span className="navbar-title">DataPulse</span>
      </a>

      {/* Right side */}
      <div className="navbar-right" style={{ position: 'relative' }} ref={menuRef}>
        {/* Notification bell */}
        <button
          className="notif-btn"
          onClick={onShowNotification}
          title="Updates"
          id="notif-bell-btn"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {updateCount > 0 && (
            <span className="notif-count">{updateCount > 9 ? '9+' : updateCount}</span>
          )}
        </button>

        {/* User avatar */}
        {session?.user?.image ? (
          <Image
            src={session.user.image}
            alt={session.user.name || 'User'}
            width={34}
            height={34}
            className="user-avatar"
            onClick={() => setMenuOpen((v) => !v)}
            id="user-avatar-btn"
          />
        ) : (
          <div
            className="user-avatar"
            style={{
              background: 'linear-gradient(135deg,#7c3aed,#2dd4bf)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, color: 'white', cursor: 'pointer',
            }}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {session?.user?.name?.[0]?.toUpperCase() || '?'}
          </div>
        )}

        {/* Dropdown menu */}
        {menuOpen && (
          <div className="user-menu">
            <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid var(--border-subtle)', marginBottom: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                {session?.user?.name}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
                {session?.user?.email}
              </div>
            </div>
            <button
              className="user-menu-item danger"
              onClick={() => signOut({ callbackUrl: '/login' })}
              id="signout-btn"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign Out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
