import { NextResponse } from 'next/server';
import { getServerSessionSafe } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Endpoint from '@/models/Endpoint';

function ownerFilter(session, id) {
  return { _id: id, userId: session.user.googleId };
}

// GET /api/endpoints/[id]
export async function GET(req, { params }) {
  const session = await getServerSessionSafe();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const { id } = await params;
  const endpoint = await Endpoint.findOne(ownerFilter(session, id)).lean();
  if (!endpoint) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(endpoint);
}

// PUT /api/endpoints/[id]
export async function PUT(req, { params }) {
  const session = await getServerSessionSafe();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const { id } = await params;
  const body = await req.json();

  const allowed = ['name', 'url', 'description', 'tags', 'headers', 'isPinned', 'isActive', 'pollingInterval'];
  const update = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  const endpoint = await Endpoint.findOneAndUpdate(
    ownerFilter(session, id),
    { $set: update },
    { returnDocument: 'after' }
  ).lean();

  if (!endpoint) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(endpoint);
}

// DELETE /api/endpoints/[id]
export async function DELETE(req, { params }) {
  const session = await getServerSessionSafe();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const { id } = await params;
  const result = await Endpoint.findOneAndDelete(ownerFilter(session, id));
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ success: true });
}
