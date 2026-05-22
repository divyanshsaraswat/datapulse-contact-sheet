import { NextResponse } from 'next/server';
import crypto from 'crypto';
import Papa from 'papaparse';
import { getServerSessionSafe } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Endpoint from '@/models/Endpoint';
import Changelog from '@/models/Changelog';

function buildHeadersObj(headersArr = []) {
  const obj = {};
  for (const { key, value } of headersArr) {
    if (key?.trim()) obj[key.trim()] = value || '';
  }
  return obj;
}

// POST /api/endpoints/check-all
// Called on page load to detect any changes across all active endpoints.
// Only re-fetches endpoints not checked in the last 10 minutes (unless force=true).
export async function POST(req) {
  const session = await getServerSessionSafe();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();

  let body = {};
  try { body = await req.json(); } catch {}
  const force = body.force === true;

  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

  const query = {
    userId: session.user.googleId,
    isActive: true,
  };

  if (!force) {
    query.$or = [
      { lastFetchedAt: { $lt: tenMinutesAgo } },
      { lastFetchedAt: null },
    ];
  }

  const endpoints = await Endpoint.find(query).lean();

  if (endpoints.length === 0) {
    return NextResponse.json({ checked: 0, updated: [], errors: [] });
  }

  const results = await Promise.allSettled(
    endpoints.map(async (ep) => {
      const reqHeaders = buildHeadersObj(ep.headers);

      const response = await fetch(ep.url, {
        headers: reqHeaders,
        signal: AbortSignal.timeout(12000),
        cache: 'no-store',
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const csvText = await response.text();
      const hash = crypto.createHash('sha256').update(csvText).digest('hex');

      const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true, worker: false });
      const rowCount = parsed.data.length;
      const columns = parsed.meta.fields || [];

      const hasUpdate = Boolean(ep.lastHash && ep.lastHash !== hash);

      let changelogEntry = null;
      if (hasUpdate) {
        const prevColumns = ep.lastColumns || [];
        const prevRowCount = ep.lastRowCount || 0;
        const newCols = columns.filter((c) => !prevColumns.includes(c));
        const removedCols = prevColumns.filter((c) => !columns.includes(c));
        const rowDiff = rowCount - prevRowCount;

        const parts = [];
        if (rowDiff > 0) parts.push(`+${rowDiff} rows`);
        else if (rowDiff < 0) parts.push(`${rowDiff} rows`);
        if (newCols.length) parts.push(`+${newCols.length} cols`);
        if (removedCols.length) parts.push(`-${removedCols.length} cols`);
        const summary = parts.length ? parts.join(', ') : 'Data changed';

        changelogEntry = await Changelog.create({
          endpointId: ep._id,
          userId: ep.userId,
          previousHash: ep.lastHash,
          newHash: hash,
          previousRowCount: prevRowCount,
          newRowCount: rowCount,
          addedRows: Math.max(0, rowDiff),
          removedRows: Math.max(0, -rowDiff),
          newColumns: newCols,
          removedColumns: removedCols,
          summary,
        });
      }

      await Endpoint.findByIdAndUpdate(ep._id, {
        lastHash: hash,
        lastRowCount: rowCount,
        lastColumns: columns,
        lastFetchedAt: new Date(),
        hasUpdate,
        status: 'ok',
        errorMessage: null,
      });

      return {
        id: ep._id.toString(),
        name: ep.name,
        hasUpdate,
        rowCount,
        changelog: changelogEntry,
      };
    })
  );

  const updated = [];
  const errors = [];

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status === 'fulfilled') {
      if (r.value.hasUpdate) updated.push(r.value);
    } else {
      const ep = endpoints[i];
      errors.push({ id: ep._id.toString(), name: ep.name, error: r.reason?.message });
      await Endpoint.findByIdAndUpdate(ep._id, {
        status: 'error',
        errorMessage: r.reason?.message,
        lastFetchedAt: new Date(),
      });
    }
  }

  return NextResponse.json({ checked: endpoints.length, updated, errors });
}
