import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';

const STATIC_ADMIN_EMAIL = 'admin@iletsbuddy.com';

export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const email = (session?.user as { email?: string } | undefined)?.email;

  if (!session || role !== 'admin' || email !== STATIC_ADMIN_EMAIL) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectToDatabase();

  const users = await User.find({}, {
    email: 1,
    username: 1,
    fullName: 1,
    role: 1,
    isDisabled: 1,
    createdAt: 1,
  })
    .sort({ createdAt: -1 })
    .lean();

  return Response.json({ users });
}
