import { NextResponse } from 'next/server';
import { getServerSessionSafe } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Changelog from '@/models/Changelog';
import Endpoint from '@/models/Endpoint';

// GET /api/endpoints/[id]/changelog
export async function GET(req, { params }) {
  const session = await getServerSessionSafe();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const { id } = await params;

  // Verify ownership
  const endpoint = await Endpoint.findOne({ _id: id, userId: session.user.googleId }).lean();
  if (!endpoint) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const logs = await Changelog.find({ endpointId: id })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return NextResponse.json(logs);
}

// DELETE /api/endpoints/[id]/changelog — clear history
export async function DELETE(req, { params }) {
  const session = await getServerSessionSafe();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const { id } = await params;

  const endpoint = await Endpoint.findOne({ _id: id, userId: session.user.googleId }).lean();
  if (!endpoint) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await Changelog.deleteMany({ endpointId: id });
  return NextResponse.json({ success: true });
}
