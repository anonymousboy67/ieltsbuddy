import connectToDatabase from '@/lib/db';
import User from '@/models/User';

export async function POST(request: Request) {
  try {
    const { uid, email, displayName, photoURL } = await request.json();

    if (!uid || !email) {
      return Response.json({ error: 'Missing uid or email' }, { status: 400 });
    }

    await connectToDatabase();

    // Check if user exists
    let user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      // Create a default username from email if not present
      const baseUsername = displayName?.split(' ')[0].toLowerCase() || email.split('@')[0].toLowerCase();
      // Ensure username is unique (simple implementation: append random if taken)
      let finalUsername = baseUsername;
      const taken = await User.findOne({ username: finalUsername });
      if (taken) {
          finalUsername = `${baseUsername}${Math.floor(1000 + Math.random() * 9000)}`;
      }

      user = await User.create({
        firebaseUid: uid,
        email,
        username: finalUsername,
        fullName: displayName || '',
        image: photoURL || undefined,
        authProvider: 'google',
        role: 'student',
      });
    } else {
      user.fullName = displayName || user.fullName;
      user.image = photoURL || user.image;
      user.authProvider = user.authProvider || 'google';
      await user.save();
    }

    return Response.json({ success: true, user });
  } catch (err) {
    console.error('sync-profile error:', err);
    return Response.json({ error: 'Failed to sync profile' }, { status: 500 });
  }
}
