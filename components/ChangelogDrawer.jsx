'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';

function timeAgo(date) {
  if (!date) return 'Never';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function ChangelogDrawer({ endpointId, endpointName, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/endpoints/${endpointId}/changelog`);
        if (!res.ok) throw new Error('Failed');
        setLogs(await res.json());
      } catch {
        toast.error('Failed to load changelog');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [endpointId]);

  const clearHistory = async () => {
    if (!confirm('Clear all changelog history for this endpoint?')) return;
    try {
      const res = await fetch(`/api/endpoints/${endpointId}/changelog`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      setLogs([]);
      toast.success('History cleared');
    } catch {
      toast.error('Failed to clear history');
    }
  };

  if (!mounted) return null;

  return createPortal(
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer" id="changelog-drawer">
        <div className="drawer-header">
          <div>
            <div className="drawer-title">Changelog</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
              {endpointName}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {logs.length > 0 && (
              <button className="btn btn-danger btn-sm" onClick={clearHistory} id="clear-history-btn">
                Clear
              </button>
            )}
            <button className="modal-close" onClick={onClose} id="close-changelog-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <div className="drawer-body">
          {loading ? (
            <div style={{ display: 'flex', gap: 10, flexDirection: 'column' }}>
              {[...Array(3)].map((_, i) => (
                <div key={i} style={{ display: 'flex', gap: 12 }}>
                  <div className="skeleton" style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ height: 12, width: '60%', marginBottom: 8 }} />
                    <div className="skeleton" style={{ height: 14, width: '80%', marginBottom: 8 }} />
                    <div style={{ display: 'flex', gap: 6 }}>
                      <div className="skeleton" style={{ height: 20, width: 60, borderRadius: 100 }} />
                      <div className="skeleton" style={{ height: 20, width: 80, borderRadius: 100 }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="changelog-empty">
              <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
              <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>No changes recorded yet</div>
              <div>Refresh the endpoint to start tracking changes.</div>
            </div>
          ) : (
            <div>
              {logs.map((log, i) => (
                <div key={log._id || i} className="changelog-item">
                  <div className="changelog-dot">🔄</div>
                  <div className="changelog-content">
                    <div className="changelog-time">{timeAgo(log.createdAt)}</div>
                    <div className="changelog-summary">{log.summary || 'Data changed'}</div>
                    <div className="changelog-stats">
                      {log.newRowCount != null && (
                        <span className="badge badge-gray">
                          {log.newRowCount.toLocaleString()} rows
                        </span>
                      )}
                      {log.addedRows > 0 && (
                        <span className="badge badge-green">+{log.addedRows} added</span>
                      )}
                      {log.removedRows > 0 && (
                        <span className="badge badge-red">-{log.removedRows} removed</span>
                      )}
                      {log.newColumns?.length > 0 && (
                        <span className="badge badge-sky">+{log.newColumns.join(', ')}</span>
                      )}
                      {log.removedColumns?.length > 0 && (
                        <span className="badge badge-amber">-{log.removedColumns.join(', ')}</span>
                      )}
                    </div>
                    {log.previousRowCount != null && (
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 6 }}>
                        {log.previousRowCount.toLocaleString()} → {log.newRowCount?.toLocaleString()} rows
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}
