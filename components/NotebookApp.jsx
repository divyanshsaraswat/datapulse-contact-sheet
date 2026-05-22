'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import Navbar from './Navbar';
import NotificationBanner from './NotificationBanner';
import SearchFilterBar from './SearchFilterBar';
import NotebookCell from './NotebookCell';
import AddEndpointModal from './AddEndpointModal';

export default function NotebookApp() {
  const [endpoints, setEndpoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingUpdates, setCheckingUpdates] = useState(false);
  const [updates, setUpdates] = useState([]);         // from check-all
  const [showNotif, setShowNotif] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshingAll, setRefreshingAll] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTags, setActiveTags] = useState([]);

  // ─── Load endpoints ───────────────────────────────────────────────
  const loadEndpoints = useCallback(async () => {
    try {
      const res = await fetch('/api/endpoints');
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setEndpoints(data);
      return data;
    } catch (err) {
      toast.error('Could not load endpoints: ' + err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Check for updates (page load) ───────────────────────────────
  const checkForUpdates = useCallback(async (force = false) => {
    setCheckingUpdates(true);
    try {
      const res = await fetch('/api/endpoints/check-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force }),
      });
      if (!res.ok) return;
      const { updated, checked } = await res.json();

      if (checked > 0) {
        // Refresh endpoint list to pick up new hashes/statuses
        await loadEndpoints();
      }

      if (updated?.length > 0) {
        setUpdates(updated);
        setShowNotif(true);
      }
    } catch (err) {
      console.warn('Update check failed:', err.message);
    } finally {
      setCheckingUpdates(false);
    }
  }, [loadEndpoints]);

  // On mount: load then check updates
  useEffect(() => {
    loadEndpoints().then(() => checkForUpdates());
  }, []); // eslint-disable-line

  // ─── Refresh all ─────────────────────────────────────────────────
  const handleRefreshAll = async () => {
    setRefreshingAll(true);
    try {
      const res = await fetch('/api/endpoints/check-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true }),
      });
      const { checked, updated, errors } = await res.json();
      await loadEndpoints();

      if (updated?.length > 0) {
        setUpdates(updated);
        setShowNotif(true);
        toast.success(`${updated.length} endpoint${updated.length > 1 ? 's' : ''} updated!`);
      } else {
        toast.success(`All ${checked} endpoints up to date`);
      }
      if (errors?.length > 0) {
        toast.error(`${errors.length} endpoint${errors.length > 1 ? 's' : ''} failed`);
      }
    } catch (err) {
      toast.error('Refresh all failed: ' + err.message);
    } finally {
      setRefreshingAll(false);
    }
  };

  // ─── CRUD helpers ─────────────────────────────────────────────────
  const handleUpdate = useCallback((updated) => {
    setEndpoints((prev) => prev.map((ep) => ep._id === updated._id ? updated : ep));
  }, []);

  const handleDelete = useCallback((id) => {
    setEndpoints((prev) => prev.filter((ep) => ep._id !== id));
  }, []);

  const handleCreated = useCallback((ep) => {
    setEndpoints((prev) => [ep, ...prev]);
  }, []);

  // ─── All tags (from all endpoints) ───────────────────────────────
  const allTags = useMemo(() => {
    const set = new Set();
    for (const ep of endpoints) {
      for (const t of ep.tags || []) set.add(t);
    }
    return [...set].sort();
  }, [endpoints]);

  // ─── Toggle tag filter ────────────────────────────────────────────
  const toggleTag = (tag) =>
    setActiveTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);

  // ─── Filtered + sorted endpoints ─────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...endpoints];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (ep) =>
          ep.name.toLowerCase().includes(q) ||
          ep.url.toLowerCase().includes(q) ||
          ep.description?.toLowerCase().includes(q) ||
          ep.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Tag filter
    if (activeTags.length > 0) {
      list = list.filter((ep) => activeTags.every((t) => ep.tags?.includes(t)));
    }

    // Status filter
    if (filterStatus !== 'all') {
      if (filterStatus === 'idle') {
        list = list.filter((ep) => ep.status === 'idle' || !ep.lastFetchedAt);
      } else {
        list = list.filter((ep) => ep.status === filterStatus);
      }
    }

    // Sort
    list.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'lastFetchedAt':
          return new Date(b.lastFetchedAt || 0) - new Date(a.lastFetchedAt || 0);
        case 'rowCount':
          return (b.lastRowCount || 0) - (a.lastRowCount || 0);
        case 'updatedAt':
        default:
          return new Date(b.updatedAt) - new Date(a.updatedAt);
      }
    });

    // Pinned always first
    list.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

    return list;
  }, [endpoints, search, activeTags, filterStatus, sortBy]);

  // ─── Jump to cell ─────────────────────────────────────────────────
  const jumpTo = (id) => {
    const el = document.getElementById(`endpoint-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      el.style.transition = 'box-shadow 0.3s ease';
      el.style.boxShadow = '0 0 0 2px rgba(245,158,11,0.6), 0 0 40px rgba(245,158,11,0.1)';
      setTimeout(() => { el.style.boxShadow = ''; }, 2000);
    }
    setShowNotif(false);
  };

  const updateCount = endpoints.filter((ep) => ep.hasUpdate).length;

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <>
      <Navbar
        updateCount={updateCount}
        onShowNotification={() => setShowNotif((v) => !v)}
      />

      {/* Notification banner */}
      {showNotif && updates.length > 0 && (
        <NotificationBanner
          updates={updates}
          onDismiss={() => setShowNotif(false)}
          onJumpTo={jumpTo}
        />
      )}

      {/* Checking updates indicator */}
      {checkingUpdates && (
        <div className="checking-bar">
          <span className="spinner" style={{ width: 13, height: 13 }} />
          Checking all endpoints for updates…
        </div>
      )}

      {/* Toolbar */}
      <SearchFilterBar
        search={search} onSearch={setSearch}
        sortBy={sortBy} onSort={setSortBy}
        filterStatus={filterStatus} onFilterStatus={setFilterStatus}
        activeTags={activeTags} onTagToggle={toggleTag} onTagsClear={() => setActiveTags([])}
        allTags={allTags}
        onRefreshAll={handleRefreshAll} refreshingAll={refreshingAll}
        onAddEndpoint={() => setShowAddModal(true)}
        endpointCount={filtered.length}
      />

      {/* Notebook */}
      <main className="notebook">
        {loading ? (
          // Skeleton cells
          [...Array(3)].map((_, i) => (
            <div key={i} className="nb-cell" style={{ padding: 20, gap: 12, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div className="skeleton" style={{ width: 8, height: 8, borderRadius: '50%' }} />
                <div className="skeleton" style={{ height: 16, width: '30%' }} />
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                  <div className="skeleton" style={{ height: 28, width: 72, borderRadius: 8 }} />
                  <div className="skeleton" style={{ height: 28, width: 28, borderRadius: 8 }} />
                </div>
              </div>
              <div className="skeleton" style={{ height: 12, width: '55%' }} />
              <div className="skeleton" style={{ height: 12, width: '25%' }} />
            </div>
          ))
        ) : filtered.length === 0 && endpoints.length === 0 ? (
          // Empty state
          <div className="empty-state">
            <div className="empty-icon">📡</div>
            <h2 className="empty-title">No endpoints yet</h2>
            <p className="empty-subtitle">
              Add your first CSV API endpoint to start monitoring data changes and previewing results in a notebook-style interface.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => setShowAddModal(true)}
              id="first-add-btn"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add your first endpoint
            </button>
          </div>
        ) : filtered.length === 0 ? (
          // No search results
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h2 className="empty-title">No matches</h2>
            <p className="empty-subtitle">
              No endpoints match your current search or filter. Try adjusting your query.
            </p>
            <button className="btn btn-ghost" onClick={() => { setSearch(''); setActiveTags([]); setFilterStatus('all'); }}>
              Clear filters
            </button>
          </div>
        ) : (
          filtered.map((ep) => (
            <NotebookCell
              key={ep._id}
              endpoint={ep}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))
        )}
      </main>

      {/* FAB */}
      {!loading && endpoints.length > 0 && (
        <button
          className="fab"
          onClick={() => setShowAddModal(true)}
          title="Add endpoint"
          id="fab-add-btn"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      )}

      {/* Add endpoint modal */}
      {showAddModal && (
        <AddEndpointModal
          onClose={() => setShowAddModal(false)}
          onCreated={handleCreated}
        />
      )}
    </>
  );
}
