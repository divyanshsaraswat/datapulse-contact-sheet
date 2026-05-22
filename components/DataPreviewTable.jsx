'use client';

import { useState, useMemo } from 'react';

export default function DataPreviewTable({ rows = [], columns = [] }) {
  const [selectedCols, setSelectedCols] = useState(() => new Set(columns));
  const [tableSearch, setTableSearch] = useState('');
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  // Sync selected cols when columns prop changes
  useMemo(() => {
    setSelectedCols(new Set(columns));
  }, [columns.join(',')]); // eslint-disable-line

  const visibleCols = columns.filter((c) => selectedCols.has(c));

  const filteredRows = useMemo(() => {
    let r = rows;
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      r = r.filter((row) =>
        visibleCols.some((col) => String(row[col] ?? '').toLowerCase().includes(q))
      );
    }
    if (sortCol) {
      r = [...r].sort((a, b) => {
        const av = String(a[sortCol] ?? '');
        const bv = String(b[sortCol] ?? '');
        const num = (s) => parseFloat(s);
        const aNum = num(av);
        const bNum = num(bv);
        let cmp;
        if (!isNaN(aNum) && !isNaN(bNum)) {
          cmp = aNum - bNum;
        } else {
          cmp = av.localeCompare(bv);
        }
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return r;
  }, [rows, tableSearch, sortCol, sortDir, visibleCols]);

  const toggleCol = (col) => {
    setSelectedCols((prev) => {
      const next = new Set(prev);
      if (next.has(col)) { if (next.size > 1) next.delete(col); }
      else next.add(col);
      return next;
    });
  };

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const exportCSV = () => {
    const header = visibleCols.join(',');
    const body = filteredRows.map((row) =>
      visibleCols.map((c) => {
        const v = String(row[c] ?? '');
        return v.includes(',') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v;
      }).join(',')
    ).join('\n');
    const blob = new Blob([header + '\n' + body], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'export.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  if (columns.length === 0) {
    return (
      <div style={{ padding: '24px 20px', color: 'var(--text-muted)', fontSize: 13 }}>
        No data available. Hit Refresh to fetch.
      </div>
    );
  }

  return (
    <div>
      {/* Column picker + search */}
      <div className="table-controls">
        <div className="col-picker">
          {columns.map((col) => (
            <button
              key={col}
              className={`col-pill ${selectedCols.has(col) ? 'selected' : ''}`}
              onClick={() => toggleCol(col)}
              title={selectedCols.has(col) ? 'Hide column' : 'Show column'}
            >
              {selectedCols.has(col) && (
                <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="1 6 4.5 9.5 11 2" />
                </svg>
              )}
              {col}
            </button>
          ))}
        </div>

        <div className="table-search-wrap">
          <span className="table-search-icon">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </span>
          <input
            className="input table-search"
            placeholder="Filter rows…"
            value={tableSearch}
            onChange={(e) => setTableSearch(e.target.value)}
            id="table-row-search"
          />
        </div>

        <button className="btn btn-ghost btn-sm" onClick={exportCSV} id="export-csv-btn" title="Export visible data as CSV">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export
        </button>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 40, textAlign: 'center', color: 'var(--text-muted)' }}>#</th>
              {visibleCols.map((col) => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  className={sortCol === col ? 'sorted' : ''}
                >
                  {col}
                  <span className="sort-icon">
                    {sortCol === col ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={visibleCols.length + 1} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  No rows match your filter
                </td>
              </tr>
            ) : (
              filteredRows.map((row, i) => (
                <tr key={i}>
                  <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {i + 1}
                  </td>
                  {visibleCols.map((col) => (
                    <td key={col} title={String(row[col] ?? '')}>
                      {String(row[col] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="table-footer">
        <span>
          Showing <strong style={{ color: 'var(--text-secondary)' }}>{filteredRows.length}</strong> of{' '}
          <strong style={{ color: 'var(--text-secondary)' }}>{rows.length}</strong> rows
          {tableSearch && ' (filtered)'}
        </span>
        <span>{visibleCols.length} of {columns.length} columns visible</span>
      </div>
    </div>
  );
}
