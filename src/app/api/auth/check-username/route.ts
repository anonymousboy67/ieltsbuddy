import connectToDatabase from '@/lib/db';
import User from '@/models/User';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');

  if (!username) {
    return Response.json({ error: 'Username is required' }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const existingUser = await User.findOne({ 
      username: username.toLowerCase().trim() 
    });
    
    return Response.json({ exists: !!existingUser });
  } catch (err) {
    console.error('check-username error:', err);
    return Response.json({ error: 'Failed to check username' }, { status: 500 });
  }
}
