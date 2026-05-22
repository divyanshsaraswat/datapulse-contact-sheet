'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import DataPreviewTable from './DataPreviewTable';
import ChangelogDrawer from './ChangelogDrawer';

function timeAgo(date) {
  if (!date) return 'Never fetched';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const TAG_COLORS = [
  'badge-purple', 'badge-teal', 'badge-sky', 'badge-orange', 'badge-green', 'badge-amber',
];

function tagColor(tag) {
  let hash = 0;
  for (const c of tag) hash = (hash * 31 + c.charCodeAt(0)) % TAG_COLORS.length;
  return TAG_COLORS[hash];
}

export default function NotebookCell({ endpoint: initial, onUpdate, onDelete }) {
  const [endpoint, setEndpoint] = useState(initial);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [showChangelog, setShowChangelog] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Keep local state in sync with parent updates
  useState(() => { setEndpoint(initial); }, [initial]);

  const refresh = async (e) => {
    e?.stopPropagation();
    setLoading(true);
    if (!expanded) setExpanded(true);
    try {
      const res = await fetch(`/api/endpoints/${endpoint._id}/fetch`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fetch failed');

      setEndpoint(data.endpoint);
      setRows(data.rows || []);
      setColumns(data.columns || []);
      onUpdate?.(data.endpoint);

      if (data.hasUpdate) {
        toast.success(`${endpoint.name}: Data changed! ${data.changelog?.summary || ''}`, { duration: 4000 });
      } else {
        toast.success(`${endpoint.name}: Up to date (${(data.rowCount || 0).toLocaleString()} rows)`);
      }
    } catch (err) {
      toast.error(`${endpoint.name}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const togglePin = async (e) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/endpoints/${endpoint._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !endpoint.isPinned }),
      });
      const updated = await res.json();
      setEndpoint(updated);
      onUpdate?.(updated);
    } catch {
      toast.error('Failed to update pin');
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    if (!confirm(`Delete "${endpoint.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/endpoints/${endpoint._id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      toast.success(`"${endpoint.name}" deleted`);
      onDelete?.(endpoint._id);
    } catch {
      toast.error('Delete failed');
    }
  };

  const copyUrl = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(endpoint.url);
    toast.success('URL copied!');
  };

  const acknowledgeUpdate = async (e) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/endpoints/${endpoint._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hasUpdate: false }),
      });
      const updated = await res.json();
      setEndpoint(updated);
      onUpdate?.(updated);
    } catch { /* silent */ }
  };

  const statusClass = endpoint.status === 'ok' ? 'ok'
    : endpoint.status === 'error' ? 'error'
    : loading ? 'fetching' : 'idle';

  const cellClasses = [
    'nb-cell',
    statusClass,
    endpoint.hasUpdate ? 'has-update' : '',
    endpoint.isPinned ? 'pinned' : '',
    endpoint.status === 'error' ? 'status-error' : '',
  ].filter(Boolean).join(' ');

  return (
    <>
      <div className={cellClasses} id={`endpoint-${endpoint._id}`}>
        {/* Header row (always visible, clickable to expand) */}
        <div className="nb-cell-header" onClick={() => setExpanded((v) => !v)}>
          {/* Status dot */}
          <span className={`status-dot ${loading ? 'fetching' : statusClass}`} />

          {/* Name + meta */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="nb-cell-name">
              {endpoint.isPinned && <span title="Pinned" style={{ fontSize: 13 }}>📌</span>}
              {endpoint.name}
              {endpoint.hasUpdate && (
                <span className="badge badge-update" style={{ marginLeft: 4 }}>
                  🔄 Updated
                </span>
              )}
            </div>
            <div className="nb-cell-url" title={endpoint.url}>{endpoint.url}</div>
            <div className="nb-cell-meta">
              <span className="nb-cell-stat">
                🕐 <strong>{timeAgo(endpoint.lastFetchedAt)}</strong>
              </span>
              {endpoint.lastRowCount != null && (
                <span className="nb-cell-stat">
                  📊 <strong>{endpoint.lastRowCount.toLocaleString()}</strong> rows
                </span>
              )}
              {endpoint.lastColumns?.length > 0 && (
                <span className="nb-cell-stat">
                  📋 <strong>{endpoint.lastColumns.length}</strong> columns
                </span>
              )}
              {endpoint.status === 'error' && (
                <span style={{ fontSize: 12, color: 'var(--rose)' }}>
                  ⚠ {endpoint.errorMessage}
                </span>
              )}
            </div>
          </div>

          {/* Tags */}
          {endpoint.tags?.length > 0 && (
            <div className="nb-cell-tags" onClick={(e) => e.stopPropagation()}>
              {endpoint.tags.slice(0, 3).map((tag) => (
                <span key={tag} className={`badge ${tagColor(tag)}`}>{tag}</span>
              ))}
              {endpoint.tags.length > 3 && (
                <span className="badge badge-gray">+{endpoint.tags.length - 3}</span>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="nb-cell-actions" onClick={(e) => e.stopPropagation()}>
            {/* Refresh */}
            <button
              className="btn btn-ghost btn-sm"
              onClick={refresh}
              disabled={loading}
              id={`refresh-btn-${endpoint._id}`}
              title="Refresh endpoint"
            >
              {loading ? (
                <span className="spinner" style={{ width: 13, height: 13 }} />
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
              )}
              {loading ? 'Fetching…' : 'Refresh'}
            </button>

            {/* Pin */}
            <button
              className="btn btn-ghost btn-icon-sm"
              onClick={togglePin}
              title={endpoint.isPinned ? 'Unpin' : 'Pin to top'}
              id={`pin-btn-${endpoint._id}`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill={endpoint.isPinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </button>

            {/* Changelog */}
            <button
              className="btn btn-ghost btn-icon-sm"
              onClick={(e) => { e.stopPropagation(); setShowChangelog(true); }}
              title="View changelog"
              id={`changelog-btn-${endpoint._id}`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </button>

            {/* Copy URL */}
            <button
              className="btn btn-ghost btn-icon-sm"
              onClick={copyUrl}
              title="Copy URL"
              id={`copy-btn-${endpoint._id}`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </button>

            {/* More menu */}
            <div style={{ position: 'relative' }}>
              <button
                className="btn btn-ghost btn-icon-sm"
                onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
                id={`more-btn-${endpoint._id}`}
                title="More options"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
                </svg>
              </button>
              {menuOpen && (
                <div
                  style={{
                    position: 'absolute', right: 0, top: '110%',
                    background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-lg)', padding: 6, zIndex: 10, minWidth: 160,
                    boxShadow: 'var(--shadow-lg)', animation: 'slideUp 0.15s ease',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {endpoint.hasUpdate && (
                    <button className="user-menu-item" onClick={acknowledgeUpdate} style={{ fontSize: 12.5 }}>
                      ✅ Mark as seen
                    </button>
                  )}
                  <a
                    href={endpoint.url}
                    target="_blank"
                    rel="noreferrer"
                    className="user-menu-item"
                    style={{ fontSize: 12.5 }}
                    onClick={() => setMenuOpen(false)}
                  >
                    🔗 Open URL
                  </a>
                  <div className="user-menu-divider" />
                  <button className="user-menu-item danger" onClick={handleDelete} style={{ fontSize: 12.5 }}>
                    🗑 Delete endpoint
                  </button>
                </div>
              )}
            </div>

            {/* Expand chevron */}
            <svg
              className={`nb-expand-icon ${expanded ? 'open' : ''}`}
              width="14" height="14" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </div>

        {/* Expandable body */}
        <div className={`nb-cell-body ${expanded ? 'expanded' : 'collapsed'}`}>
          {loading && rows.length === 0 ? (
            <div className="nb-loading">
              <div className="skeleton-line" style={{ width: '30%' }} />
              <div className="skeleton-line" style={{ width: '100%', height: 200 }} />
            </div>
          ) : endpoint.status === 'error' && rows.length === 0 ? (
            <div className="nb-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Fetch failed</div>
                <div style={{ fontSize: 12 }}>{endpoint.errorMessage}</div>
                <button className="btn btn-danger btn-sm" style={{ marginTop: 10 }} onClick={refresh}>
                  Retry
                </button>
              </div>
            </div>
          ) : rows.length === 0 ? (
            <div style={{ padding: '28px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>🔄</div>
              Hit <strong style={{ color: 'var(--text-secondary)' }}>Refresh</strong> to fetch and preview this endpoint's data.
            </div>
          ) : (
            <DataPreviewTable rows={rows} columns={columns} />
          )}
        </div>
      </div>

      {showChangelog && (
        <ChangelogDrawer
          endpointId={endpoint._id}
          endpointName={endpoint.name}
          onClose={() => setShowChangelog(false)}
        />
      )}
    </>
  );
}
