import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { signIn as nextAuthSignIn } from 'next-auth/react';

import { auth } from '@/lib/firebase';


const googleProvider = new GoogleAuthProvider();

// ─── Google Sign-In ──────────────────────────────────────────────────────────

export async function signInWithGoogle(): Promise<void> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Sync profile to MongoDB
    await fetch('/api/auth/sync-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      }),
    });
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
}

// ─── Username Helpers ─────────────────────────────────────────────────────────

/**
 * Returns true if the given username (case-insensitive) is already taken.
 */
export async function checkUsernameExists(username: string): Promise<boolean> {
  const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(username)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to check username');
  return data.exists;
}


// ─── Email OR Username Login ──────────────────────────────────────────────────


export async function loginWithEmailOrIdentifier(
  identifier: string,
  password: string
): Promise<void> {
  let email = identifier.trim();

  // Resolve identifier (username or email) to the actual email via server
  const resolveRes = await fetch(`/api/auth/resolve-identifier?identifier=${encodeURIComponent(identifier)}`);
  const resolveData = await resolveRes.json();
  
  if (!resolveRes.ok) {
    throw new Error(resolveData.error || 'No account found with that identifier.');
  }

  email = resolveData.email;

  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const user = credential.user;

    // Block access until the email is verified
    if (!user.emailVerified) {
      await signOut(auth);
      throw new Error(
        'Please verify your email before logging in. Check your inbox for a verification link.'
      );
    }
  } catch (error: any) {
    if (
      error.code === 'auth/wrong-password' ||
      error.code === 'auth/user-not-found' ||
      error.code === 'auth/invalid-credential'
    ) {
      throw new Error('Invalid email/username or password. Please try again.');
    }
    throw error;
  }
}


// ─── OTP Verification & Account Creation ─────────────────────────────────────

/**
 * Verifies the 6-digit OTP through backend API, creates the Firebase Auth account,
 * saves the user profile, and cleans up the OTP document.
 */
export async function verifyOTPAndSignUp(
  email: string,
  otpCode: string,
  username: string,
  fullName: string,
  password?: string
): Promise<void> {
  if (!password) throw new Error('Password is required for account creation');

  try {
    // Call our new Admin-Powered API
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp: otpCode, username, password, fullName }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Verification failed');

    // 2. Trigger Auth.js (NextAuth) to set the session cookie
    const result = (await nextAuthSignIn('credentials', {
      email,
      isOtpLogin: 'true',
      redirect: true,
      redirectTo: '/dashboard',
    })) as any;

    if (result?.error) {
      throw new Error(result.error);
    }

  } catch (err: any) {

    console.error('verifyOTPAndSignUp error:', err);
    throw err;
  }
}

// ─── Sign-Out ─────────────────────────────────────────────────────────────────

export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}
