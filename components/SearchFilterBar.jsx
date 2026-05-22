'use client';

import CustomSelect from './CustomSelect';

const STATUS_OPTS = [
  { value: 'all', label: 'All status' },
  { value: 'ok', label: '✅ OK' },
  { value: 'error', label: '❌ Error' },
  { value: 'idle', label: '⬜ Never fetched' },
];

const SORT_OPTS = [
  { value: 'updatedAt', label: 'Last modified' },
  { value: 'lastFetchedAt', label: 'Last fetched' },
  { value: 'name', label: 'Name A→Z' },
  { value: 'rowCount', label: 'Row count ↓' },
];

export default function SearchFilterBar({
  search, onSearch,
  sortBy, onSort,
  filterStatus, onFilterStatus,
  activeTags, onTagToggle, onTagsClear,
  allTags,
  onRefreshAll, refreshingAll,
  onAddEndpoint,
  endpointCount,
}) {
  return (
    <>
      {/* Main toolbar row */}
      <div className="toolbar">
        {/* Search */}
        <div className="search-wrap">
          <span className="search-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </span>
          <input
            id="endpoint-search"
            className="input search-input"
            type="text"
            placeholder="Search endpoints, URLs, tags…"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear" onClick={() => onSearch('')} title="Clear search">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Sort */}
        <CustomSelect
          id="sort-select"
          value={sortBy}
          onChange={onSort}
          options={SORT_OPTS}
        />

        {/* Status filter */}
        <CustomSelect
          id="status-filter"
          value={filterStatus}
          onChange={onFilterStatus}
          options={STATUS_OPTS}
        />

        {/* Refresh all */}
        <button
          id="refresh-all-btn"
          className="btn btn-ghost btn-sm"
          onClick={onRefreshAll}
          disabled={refreshingAll}
          title="Re-fetch all endpoints"
        >
          {refreshingAll ? (
            <span className="spinner" style={{ width: 13, height: 13 }} />
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          )}
          {refreshingAll ? 'Refreshing…' : 'Refresh All'}
        </button>

        {/* Add endpoint */}
        <button
          id="add-endpoint-btn"
          className="btn btn-primary btn-sm"
          onClick={onAddEndpoint}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Endpoint
        </button>

        {/* Count */}
        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
          {endpointCount} endpoint{endpointCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Tag filter row */}
      {allTags.length > 0 && (
        <div className="tag-filters">
          <span className="tag-filter-label">Tags:</span>
          {allTags.map((tag) => (
            <button
              key={tag}
              className={`tag ${activeTags.includes(tag) ? 'active' : ''}`}
              onClick={() => onTagToggle(tag)}
              id={`tag-filter-${tag}`}
            >
              {tag}
            </button>
          ))}
          {activeTags.length > 0 && (
            <button className="tags-clear" onClick={onTagsClear}>Clear</button>
          )}
        </div>
      )}
    </>
  );
}
