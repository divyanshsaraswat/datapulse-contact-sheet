'use client';

export default function NotificationBanner({ updates = [], onDismiss, onJumpTo }) {
  if (updates.length === 0) return null;

  return (
    <div className="notif-banner" role="alert" id="update-notification-banner">
      <span className="notif-icon">🔔</span>
      <div className="notif-content">
        <div className="notif-title">
          {updates.length} endpoint{updates.length > 1 ? 's have' : ' has'} new data since your last visit
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 8 }}>
          Click an endpoint below to jump to it, then refresh to see the latest data.
        </div>
        <div className="notif-list">
          {updates.map((u) => (
            <button
              key={u.id}
              className="notif-item"
              onClick={() => onJumpTo?.(u.id)}
              id={`notif-item-${u.id}`}
            >
              <span>📋</span>
              <span>{u.name}</span>
              {u.changelog?.summary && (
                <span style={{ opacity: 0.7 }}>· {u.changelog.summary}</span>
              )}
            </button>
          ))}
        </div>
      </div>
      <button className="notif-dismiss" onClick={onDismiss} title="Dismiss" id="dismiss-notif-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
