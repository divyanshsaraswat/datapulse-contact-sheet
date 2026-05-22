'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

const SUGGESTED_TAGS = ['production', 'staging', 'analytics', 'finance', 'sales', 'internal', 'external'];

export default function AddEndpointModal({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [headers, setHeaders] = useState([{ key: '', value: '' }]);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // null | { ok, rows, cols, error }

  const addTag = (t) => {
    const cleaned = t.trim().toLowerCase();
    if (cleaned && !tags.includes(cleaned)) setTags((prev) => [...prev, cleaned]);
    setTagInput('');
  };

  const removeTag = (t) => setTags((prev) => prev.filter((x) => x !== t));

  const handleTagKey = (e) => {
    if (['Enter', ',', 'Tab'].includes(e.key)) {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  const addHeader = () => setHeaders((prev) => [...prev, { key: '', value: '' }]);
  const removeHeader = (i) => setHeaders((prev) => prev.filter((_, idx) => idx !== i));
  const updateHeader = (i, field, val) =>
    setHeaders((prev) => prev.map((h, idx) => (idx === i ? { ...h, [field]: val } : h)));

  const testEndpoint = async () => {
    if (!url.trim()) { toast.error('Enter a URL first'); return; }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/endpoints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || 'Test',
          url: url.trim(),
          description: '',
          tags: [],
          headers: headers.filter((h) => h.key.trim()),
          _testOnly: true,
        }),
      });
      // We'll test by creating a temp endpoint and immediately fetching — simplified: just try a direct fetch via our proxy
      // Actually let's just call check with a POST to a temp check endpoint
      // Instead, let's call the test endpoint
      if (!res.ok) {
        const d = await res.json();
        setTestResult({ ok: false, error: d.error });
      } else {
        const ep = await res.json();
        // now fetch it
        const fetchRes = await fetch(`/api/endpoints/${ep._id}/fetch`, { method: 'POST' });
        const fetchData = await fetchRes.json();
        // delete the test endpoint
        await fetch(`/api/endpoints/${ep._id}`, { method: 'DELETE' });
        if (!fetchRes.ok) {
          setTestResult({ ok: false, error: fetchData.error });
        } else {
          setTestResult({ ok: true, rows: fetchData.rowCount, cols: fetchData.columns?.length });
        }
      }
    } catch (err) {
      setTestResult({ ok: false, error: err.message });
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Name is required'); return; }
    if (!url.trim()) { toast.error('URL is required'); return; }

    setSaving(true);
    try {
      const res = await fetch('/api/endpoints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          url: url.trim(),
          description: description.trim(),
          tags,
          headers: headers.filter((h) => h.key.trim()),
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to create');
      }
      const created = await res.json();
      toast.success(`"${created.name}" added!`);
      onCreated?.(created);
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" id="add-endpoint-modal">
        <div className="modal-header">
          <h2 className="modal-title">Add Endpoint</h2>
          <button className="modal-close" onClick={onClose} id="close-modal-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Name */}
            <div className="form-group">
              <label className="label" htmlFor="ep-name">Name *</label>
              <input
                id="ep-name"
                className="input"
                placeholder="e.g. Sales Report Q4"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* URL */}
            <div className="form-group">
              <label className="label" htmlFor="ep-url">CSV Endpoint URL *</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  id="ep-url"
                  className="input input-mono"
                  placeholder="https://api.example.com/data.csv"
                  value={url}
                  onChange={(e) => { setUrl(e.target.value); setTestResult(null); }}
                  required
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={testEndpoint}
                  disabled={testing || !url.trim()}
                  id="test-endpoint-btn"
                  style={{ flexShrink: 0 }}
                >
                  {testing ? <span className="spinner" style={{ width: 13, height: 13 }} /> : '⚡'}
                  {testing ? 'Testing…' : 'Test'}
                </button>
              </div>
              {testResult && (
                <div style={{
                  marginTop: 8, padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                  fontSize: 12.5,
                  background: testResult.ok ? 'var(--emerald-bg)' : 'var(--rose-bg)',
                  color: testResult.ok ? 'var(--emerald)' : 'var(--rose)',
                  border: `1px solid ${testResult.ok ? 'rgba(16,185,129,0.25)' : 'rgba(244,63,94,0.25)'}`,
                }}>
                  {testResult.ok
                    ? `✅ Connected — ${testResult.rows?.toLocaleString()} rows, ${testResult.cols} columns`
                    : `❌ ${testResult.error}`}
                </div>
              )}
              <p className="form-hint">Must return plain CSV (text/csv or text/plain). Fetched server-side.</p>
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="label" htmlFor="ep-desc">Description</label>
              <textarea
                id="ep-desc"
                className="input"
                placeholder="What does this endpoint contain?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            {/* Tags */}
            <div className="form-group">
              <label className="label" htmlFor="ep-tags">Tags</label>
              {tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {tags.map((t) => (
                    <span key={t} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '3px 10px', borderRadius: 100,
                      background: 'var(--primary-bg)', color: 'var(--primary-light)',
                      border: '1px solid rgba(124,58,237,0.3)', fontSize: 12,
                    }}>
                      {t}
                      <button type="button" onClick={() => removeTag(t)} style={{
                        background: 'none', border: 'none', color: 'inherit',
                        cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center',
                      }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <input
                id="ep-tags"
                className="input"
                placeholder="Type tag and press Enter, comma, or Tab"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKey}
                onBlur={() => tagInput && addTag(tagInput)}
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
                {SUGGESTED_TAGS.filter((t) => !tags.includes(t)).map((t) => (
                  <button
                    key={t} type="button"
                    className="tag"
                    style={{ fontSize: 11 }}
                    onClick={() => addTag(t)}
                  >
                    + {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom headers */}
            <div className="form-group">
              <label className="label">Custom Headers (optional)</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {headers.map((h, i) => (
                  <div key={i} className="kv-row">
                    <input
                      className="input input-mono"
                      placeholder="Header name"
                      value={h.key}
                      onChange={(e) => updateHeader(i, 'key', e.target.value)}
                      id={`header-key-${i}`}
                    />
                    <input
                      className="input input-mono"
                      placeholder="Value"
                      value={h.value}
                      onChange={(e) => updateHeader(i, 'value', e.target.value)}
                      id={`header-val-${i}`}
                    />
                    <button type="button" className="kv-remove" onClick={() => removeHeader(i)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}
                <button type="button" className="btn btn-ghost btn-sm" onClick={addHeader} style={{ alignSelf: 'flex-start' }}>
                  + Add Header
                </button>
              </div>
              <p className="form-hint">Add Authorization, API-Key, or other headers for protected endpoints.</p>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose} id="cancel-btn">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving} id="save-endpoint-btn">
              {saving ? <><span className="spinner" /> Saving…</> : 'Add Endpoint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
