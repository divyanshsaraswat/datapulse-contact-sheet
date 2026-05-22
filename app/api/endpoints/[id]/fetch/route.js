import { NextResponse } from 'next/server';
import crypto from 'crypto';
import Papa from 'papaparse';
import { getServerSessionSafe } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Endpoint from '@/models/Endpoint';
import Changelog from '@/models/Changelog';

function computeHash(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function buildHeadersObj(headersArr = []) {
  const obj = {};
  for (const { key, value } of headersArr) {
    if (key?.trim()) obj[key.trim()] = value || '';
  }
  return obj;
}

async function fetchAndDiff(endpoint) {
  const reqHeaders = buildHeadersObj(endpoint.headers);

  const response = await fetch(endpoint.url, {
    headers: reqHeaders,
    signal: AbortSignal.timeout(15000),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }

  const csvText = await response.text();
  const hash = computeHash(csvText);

  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    worker: false,
  });

  const rows = parsed.data;
  const rowCount = rows.length;
  const columns = parsed.meta.fields || [];

  const prevHash = endpoint.lastHash;
  const hasUpdate = Boolean(prevHash && prevHash !== hash);

  let changelogEntry = null;

  if (hasUpdate) {
    const prevColumns = endpoint.lastColumns || [];
    const prevRowCount = endpoint.lastRowCount || 0;
    const newCols = columns.filter((c) => !prevColumns.includes(c));
    const removedCols = prevColumns.filter((c) => !columns.includes(c));
    const rowDiff = rowCount - prevRowCount;

    const parts = [];
    if (rowDiff > 0) parts.push(`+${rowDiff} rows`);
    else if (rowDiff < 0) parts.push(`${rowDiff} rows`);
    if (newCols.length) parts.push(`+${newCols.length} col${newCols.length > 1 ? 's' : ''}`);
    if (removedCols.length) parts.push(`-${removedCols.length} col${removedCols.length > 1 ? 's' : ''}`);
    const summary = parts.length ? parts.join(', ') : 'Data changed';

    changelogEntry = await Changelog.create({
      endpointId: endpoint._id,
      userId: endpoint.userId,
      previousHash: prevHash,
      newHash: hash,
      previousRowCount: prevRowCount,
      newRowCount: rowCount,
      addedRows: Math.max(0, rowDiff),
      removedRows: Math.max(0, -rowDiff),
      newColumns: newCols,
      removedColumns: removedCols,
      changedColumns: [],
      summary,
    });
  }

  const updated = await Endpoint.findByIdAndUpdate(
    endpoint._id,
    {
      lastHash: hash,
      lastRowCount: rowCount,
      lastColumns: columns,
      lastFetchedAt: new Date(),
      hasUpdate,
      status: 'ok',
      errorMessage: null,
    },
    { returnDocument: 'after' }
  ).lean();

  return { endpoint: updated, rows: rows.slice(0, 200), columns, rowCount, hasUpdate, changelog: changelogEntry };
}

// POST /api/endpoints/[id]/fetch
export async function POST(req, { params }) {
  const session = await getServerSessionSafe();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const { id } = await params;

  const endpoint = await Endpoint.findOne({ _id: id, userId: session.user.googleId });
  if (!endpoint) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  try {
    const result = await fetchAndDiff(endpoint);
    return NextResponse.json(result);
  } catch (err) {
    await Endpoint.findByIdAndUpdate(id, {
      status: 'error',
      errorMessage: err.message,
      lastFetchedAt: new Date(),
    });
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}
