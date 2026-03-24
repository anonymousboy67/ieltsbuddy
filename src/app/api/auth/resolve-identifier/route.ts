import connectToDatabase from '@/lib/db';
import User from '@/models/User';

const STATIC_ADMIN_EMAIL = 'admin@iletsbuddy.com';
const STATIC_ADMIN_USERNAME = 'admin';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const identifier = searchParams.get('identifier');

  if (!identifier) {
    return Response.json({ error: 'Identifier is required' }, { status: 400 });
  }

  const normalizedIdentifier = identifier.toLowerCase().trim();

  // Resolve fixed admin identifier without DB lookup.
  if (
    normalizedIdentifier === STATIC_ADMIN_EMAIL ||
    normalizedIdentifier === STATIC_ADMIN_USERNAME
  ) {
    return Response.json({ email: STATIC_ADMIN_EMAIL });
  }

  try {
    await connectToDatabase();
    
    // If it's an email, return as is
    if (identifier.includes('@')) {
      return Response.json({ email: normalizedIdentifier });
    }

    // Otherwise, find user by username and return their email
    const user = await User.findOne({ 
      username: normalizedIdentifier 
    });

    if (!user) {
      return Response.json({ error: 'No account found with that username.' }, { status: 404 });
    }

    return Response.json({ email: user.email });
  } catch (err) {
    console.error('resolve-identifier error:', err);
    return Response.json({ error: 'Failed to resolve identifier' }, { status: 500 });
  }
}
