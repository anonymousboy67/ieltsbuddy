import { auth } from '@/auth';
import { adminAuth } from '@/lib/firebase-admin';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import mongoose from 'mongoose';

const STATIC_ADMIN_EMAIL = 'admin@iletsbuddy.com';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const role = (session as { user?: { role?: string } } | null)?.user?.role;
  const email = (session as { user?: { email?: string } } | null)?.user?.email;
  if (!session || role !== 'admin' || email !== STATIC_ADMIN_EMAIL) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return Response.json({ error: 'Invalid user id' }, { status: 400 });
  }

  const { action, isDisabled, newPassword } = await request.json();

  await connectToDatabase();
  const user = await User.findById(id);

  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  if (user.role === 'admin') {
    return Response.json({ error: 'Cannot modify admin account.' }, { status: 403 });
  }

  if (action === 'toggle-disable') {
    user.isDisabled = Boolean(isDisabled);
    await user.save();

    if (user.firebaseUid && adminAuth) {
      try {
        await adminAuth.updateUser(user.firebaseUid, { disabled: user.isDisabled });
      } catch (error) {
        console.error('firebase disable sync failed:', error);
      }
    }

    return Response.json({
      success: true,
      message: user.isDisabled ? 'Account disabled.' : 'Account enabled.',
    });
  }

  if (action === 'reset-password') {
    if (!newPassword || String(newPassword).length < 4) {
      return Response.json({ error: 'New password must be at least 4 characters.' }, { status: 400 });
    }

    user.password = String(newPassword);
    await user.save();

    if (user.firebaseUid && adminAuth) {
      try {
        await adminAuth.updateUser(user.firebaseUid, { password: String(newPassword) });
      } catch (error) {
        console.error('firebase password reset sync failed:', error);
      }
    }

    return Response.json({ success: true, message: 'Password reset successfully.' });
  }

  return Response.json({ error: 'Unsupported action' }, { status: 400 });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const role = (session as { user?: { role?: string } } | null)?.user?.role;
  const email = (session as { user?: { email?: string } } | null)?.user?.email;
  if (!session || role !== 'admin' || email !== STATIC_ADMIN_EMAIL) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return Response.json({ error: 'Invalid user id' }, { status: 400 });
  }

  await connectToDatabase();
  const user = await User.findById(id);

  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  if (user.role === 'admin') {
    return Response.json({ error: 'Cannot delete admin account.' }, { status: 403 });
  }

  if (user.firebaseUid && adminAuth) {
    try {
      await adminAuth.deleteUser(user.firebaseUid);
    } catch (error) {
      console.error('firebase delete sync failed:', error);
    }
  }

  await User.findByIdAndDelete(id);

  return Response.json({ success: true, message: 'User account deleted.' });
}
