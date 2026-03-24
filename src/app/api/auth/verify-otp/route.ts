import { adminAuth } from '@/lib/firebase-admin';
import connectToDatabase from '@/lib/db';
import OTP from '@/models/OTP';
import User from '@/models/User';

export async function POST(request: Request) {
  try {
    const { email, otp, username, password, fullName } = await request.json();

    if (!email || !otp || !username || !password) {
      return Response.json(
        { error: 'Missing required fields.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // 0. Check if username is already taken in MongoDB
    const existingUser = await User.findOne({ 
      username: username.toLowerCase().trim() 
    });
    
    if (existingUser) {
      return Response.json({ error: 'This username is already taken.' }, { status: 400 });
    }

    // 1. Verify OTP using MongoDB
    const otpDoc = await OTP.findOne({ email });
    
    if (!otpDoc) {
      return Response.json({ error: 'Invalid or expired code.' }, { status: 400 });
    }

    if (otpDoc.otp !== otp) {
      return Response.json({ error: 'Invalid code.' }, { status: 400 });
    }

    // 2. Create User in Firebase Auth using adminAuth
    let userRecord;
    try {
      userRecord = await adminAuth.createUser({
        email,
        password,
        displayName: fullName || username,
      });
    } catch (authError: any) {
      if (authError.code === 'auth/email-already-exists') {
        return Response.json({ error: 'This email is already registered.' }, { status: 400 });
      }
      throw authError;
    }

    // 3. Sync User Profile in MongoDB (check if they exist first)
    let dbUser = await User.findOne({ email: email.toLowerCase().trim() });

    if (!dbUser) {
      // First time logging in! Create the account profile.
      dbUser = await User.create({
        firebaseUid: userRecord.uid,
        email: email.toLowerCase().trim(),
        username: username.toLowerCase().trim(),
        fullName: fullName || '',
        password: password, // Note: Hash this in production!
        role: 'student',
      });
      console.log('New user created in MongoDB:', email);
    } else {
      // User already exists! (This happens during subsequent logins)
      console.log('Existing user logging in:', email);
    }




    // 4. Clean up OTP
    await OTP.deleteOne({ email });

    // 5. Generate Custom Token
    const customToken = await adminAuth.createCustomToken(userRecord.uid);


    return Response.json({ success: true, customToken });
  } catch (err: any) {
    console.error('verify-otp error:', err);
    return Response.json(
      { error: 'Verification failed. Please try again.' },
      { status: 500 }
    );
  }
}
