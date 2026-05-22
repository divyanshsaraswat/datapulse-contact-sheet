import { NextResponse } from 'next/server';
import { getServerSessionSafe } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Endpoint from '@/models/Endpoint';

// GET /api/endpoints — list all endpoints for the current user
export async function GET() {
  const session = await getServerSessionSafe();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const endpoints = await Endpoint.find({ userId: session.user.googleId })
    .sort({ isPinned: -1, updatedAt: -1 })
    .lean();

  return NextResponse.json(endpoints);
}

// POST /api/endpoints — create a new endpoint
export async function POST(req) {
  const session = await getServerSessionSafe();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();

  const body = await req.json();
  const { name, url, description, tags, headers } = body;

  if (!name?.trim() || !url?.trim()) {
    return NextResponse.json({ error: 'Name and URL are required' }, { status: 400 });
  }

  const endpoint = await Endpoint.create({
    userId: session.user.googleId,
    name: name.trim(),
    url: url.trim(),
    description: description?.trim() || '',
    tags: (tags || []).map((t) => t.trim()).filter(Boolean),
    headers: (headers || []).filter((h) => h.key?.trim()),
  });

  return NextResponse.json(endpoint, { status: 201 });
}
